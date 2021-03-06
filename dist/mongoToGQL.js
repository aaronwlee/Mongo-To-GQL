"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const apollo_server_express_1 = require("apollo-server-express");
const convertType_1 = __importDefault(require("./converters/convertType"));
const graphql_type_json_1 = __importDefault(require("graphql-type-json"));
const convertQueryType_1 = __importDefault(require("./converters/convertQueryType"));
const inputType_1 = __importDefault(require("./utils/inputType"));
const convertCap_1 = require("./converters/convertCap");
const validate_1 = require("./utils/validate");
class MongoToGQL {
    constructor(gqlLogger, devWithTs) {
        this.typeDefs = "\nscalar Date\nscalar JSON\n\n";
        this.typeQueryDefs = "\ntype Query {\n";
        this.typeMutationDefs = "\ntype Mutation {\n";
        this.type = 'js';
        this.resolvers = {
            JSON: graphql_type_json_1.default,
            Query: {}
        };
        this.converted = (customResolvers, customTypeDefs) => {
            if (customResolvers) {
                Object.keys(customResolvers).forEach(e => {
                    if (typeof customResolvers[e] === "object") {
                        this.resolvers[e] = Object.assign(Object.assign({}, this.resolvers[e]), customResolvers[e]);
                    }
                    else {
                        this.resolvers[e] = customResolvers[e];
                    }
                });
            }
            if (customTypeDefs) {
                this.typeDefs + "\n# Under are custom typeDefs\n\n" + customTypeDefs;
            }
            return {
                typeDefs: apollo_server_express_1.gql(this.typeDefs), resolvers: this.resolvers
            };
        };
        this.logger = null;
        this.mutationToReturnTypeDefinition = (mutationName) => {
            let returnTypeDef = `\ntype ${convertCap_1.convertFirstUppercase(mutationName)}ReturnType {\n`;
            returnTypeDef += "\tdone: JSON!\n";
            returnTypeDef += "\terror: JSON!\n";
            returnTypeDef += "}\n";
            this.typeDefs += returnTypeDef;
        };
        this.modelToReturnTypeDefinition = (modelName) => {
            let returnTypeDef = `\ntype ${convertCap_1.convertCapAndRemovePlural(modelName)}ReturnType {\n`;
            returnTypeDef += `\tdata: [${convertCap_1.convertCapAndRemovePlural(modelName)}!]\n`;
            returnTypeDef += "\tpage: Int\n";
            returnTypeDef += "\ttotal: Int\n";
            returnTypeDef += "}\n";
            this.typeDefs += returnTypeDef;
        };
        this.logger = gqlLogger;
        if (devWithTs) {
            this.type = 'ts';
        }
    }
    readModelList(modelFolderPath) {
        return new Promise((resolve, reject) => {
            const modelPathList = glob_1.default.sync(`${modelFolderPath}/*.${this.type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${modelFolderPath}/**/*.${this.type}' - found 0 files`);
                reject(`path: '${modelFolderPath}/*.${this.type}' - found 0 files`);
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`);
                resolve(modelPathList);
            }
        });
    }
    readMutationList(mutationFolderPath) {
        return new Promise((resolve, reject) => {
            const modelPathList = glob_1.default.sync(`${mutationFolderPath}/*.${this.type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${mutationFolderPath}/**/*.${this.type}' - found 0 files`);
                reject(`path: '${mutationFolderPath}/*.${this.type}' - found 0 files`);
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} mutations`);
                resolve(modelPathList);
            }
        });
    }
    modelToTypeDefinition(model, gqlOption) {
        let modelDef = `\ntype ${convertCap_1.convertCapAndRemovePlural(model.modelName)} {\n`;
        let embadedMany = {};
        Object.keys(model.schema.paths).forEach(fieldName => {
            if (fieldName === "_id") {
                modelDef += "\t_id: ID\n";
            }
            else if (fieldName !== "__v") {
                if (fieldName.split('.').length > 1) {
                    embadedMany[fieldName.split('.')[0]] = 'JSON';
                }
                else {
                    modelDef += convertType_1.default(fieldName, model.schema.paths[fieldName], gqlOption);
                }
            }
        });
        Object.keys(model.schema.virtuals).forEach(virtualName => {
            if (virtualName !== "id") {
                modelDef += `\t${virtualName}: JSON\n`;
            }
        });
        Object.keys(embadedMany).forEach(e => {
            modelDef += `\t${e}: ${embadedMany[e]}\n`;
        });
        modelDef += "}\n";
        this.typeDefs += modelDef;
    }
    modelToQueryDefinition(model) {
        let modelDef = `\ninput ${convertCap_1.convertCapAndRemovePlural(model.modelName)}Query {\n`;
        let embadedMany = {};
        Object.keys(model.schema.paths).forEach(fieldName => {
            if (fieldName.split('.').length > 1) {
                embadedMany[fieldName.split('.')[0]] = 'JSON';
            }
            else if (fieldName !== "__v") {
                modelDef += convertQueryType_1.default(fieldName, model.schema.paths[fieldName]);
            }
        });
        Object.keys(embadedMany).forEach(e => {
            modelDef += `\t${e}: ${embadedMany[e]}\n`;
        });
        modelDef += `\tsubSearch: JSON\n`;
        modelDef += "}\n";
        this.typeDefs += modelDef;
    }
    modelToSortKeyDefinition(model) {
        let modelDef = `\nenum ${convertCap_1.convertCapAndRemovePlural(model.modelName)}SortKey {\n`;
        Object.keys(model.schema.paths).forEach(fieldName => {
            if (fieldName !== "__v" && fieldName !== "_id" && fieldName.split('.').length === 1) {
                modelDef += `\t${fieldName}_asc\n`;
                modelDef += `\t${fieldName}_desc\n`;
            }
        });
        modelDef += "}\n";
        this.typeDefs += modelDef;
    }
    mutationToInputDefinition(mutation, type, mutationName) {
        return new Promise((resolve, reject) => {
            let tempString = "\n";
            if (type === "inputType") {
                tempString += `input ${convertCap_1.convertFirstUppercase(mutationName)}InputType {\n`;
            }
            else {
                tempString += `input ${type} {\n`;
            }
            Object.keys(mutation[type]).forEach((field) => {
                if (inputType_1.default.includes(mutation[type][field])) {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                }
                else {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                    this.mutationToInputDefinition(mutation, mutation[type][field].replace(/\[|\]|\!/g, ""));
                }
            });
            tempString += "}\n";
            this.typeDefs += tempString;
            resolve();
        });
    }
    modelToDefaultQuery(model, gqlOption = { Auth: false }) {
        this.resolvers.Query[convertCap_1.convertCapAndRemovePlural(model.modelName)] = (_, { _id }, { user }) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (gqlOption.Auth && !user) {
                        throw new apollo_server_express_1.AuthenticationError("Authentication required!");
                    }
                    const data = model.findById(_id);
                    resolve(data);
                }
                catch (error) {
                    reject(error);
                }
            }));
        };
        this.typeQueryDefs += `\t${convertCap_1.convertCapAndRemovePlural(model.modelName)}(_id: ID!): ${convertCap_1.convertCapAndRemovePlural(model.modelName)}!\n`;
    }
    modelToGetALLQuery(model, gqlOption = { Auth: false }) {
        this.resolvers.Query[convertCap_1.convertCapAndAddPlural(model.modelName)] = (_, { filter = {}, page = 0, limit = 10, sort }, { user }) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (gqlOption.Auth && !user) {
                        throw new apollo_server_express_1.AuthenticationError("Authentication required!");
                    }
                    // map query
                    let queryMap = {};
                    Object.keys(filter).forEach(filterKey => {
                        if (filterKey === "subSearch") {
                            queryMap = Object.assign(Object.assign({}, queryMap), JSON.parse(filter[filterKey].replace(/'/g, '"')));
                        }
                        else {
                            let splitedKey = filterKey.split("_");
                            if (splitedKey[0] === "id") {
                                splitedKey[0] = "_id";
                            }
                            if (splitedKey[1] === "has") {
                                queryMap[splitedKey[0]] = new RegExp(filter[filterKey], "i");
                            }
                            else if (splitedKey[1]) {
                                queryMap[splitedKey[0]] = {};
                                queryMap[splitedKey[0]][`$${splitedKey[1]}`] = filter[filterKey];
                            }
                            else {
                                queryMap[splitedKey[0]] = filter[filterKey];
                            }
                        }
                    });
                    // map sort by key
                    let sortMap = {};
                    if (sort) {
                        const splitedKey = sort.split("_");
                        sortMap[splitedKey[0]] = splitedKey[1];
                    }
                    console.log(queryMap);
                    const total = yield model.find(queryMap).populate(gqlOption && gqlOption.Populate).countDocuments();
                    const data = yield model.find(queryMap).populate(gqlOption && gqlOption.Populate).skip(page * limit).limit(limit).sort(sortMap);
                    resolve({
                        data: data,
                        page: page,
                        total: total
                    });
                }
                catch (error) {
                    reject(error);
                }
            }));
        };
        this.modelToReturnTypeDefinition(model.modelName);
        this.typeQueryDefs += `\t${convertCap_1.convertCapAndAddPlural(model.modelName)}(page: Int, limit: Int, filter: ${convertCap_1.convertCapAndRemovePlural(model.modelName)}Query, sort: ${convertCap_1.convertCapAndRemovePlural(model.modelName)}SortKey): ${convertCap_1.convertCapAndRemovePlural(model.modelName)}ReturnType!\n`;
    }
    generatebyPath(modelFolderPath, mutationFolderPath, customResolvers, customTypeDefs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("GQL autogenerater - start");
                const modelPathList = yield this.readModelList(path_1.default.join(process.cwd(), modelFolderPath));
                modelPathList.forEach((modelPath) => {
                    const imported = require(path_1.default.resolve(modelPath));
                    const model = imported.default;
                    const gqlOption = imported.gqlOption ? imported.gqlOption : {};
                    const errors = validate_1.virtualsValidate(model);
                    if (errors.length > 0) {
                        this.logger.error("error!! => ", errors);
                    }
                    this.modelToTypeDefinition(model, gqlOption);
                    this.modelToQueryDefinition(model);
                    this.modelToSortKeyDefinition(model);
                    this.modelToDefaultQuery(model, gqlOption);
                    this.modelToGetALLQuery(model, gqlOption);
                });
                this.typeQueryDefs += "} \n";
                this.typeDefs += this.typeQueryDefs;
                if (mutationFolderPath) {
                    this.resolvers.Mutation = {};
                    const mutationPathList = yield this.readMutationList(path_1.default.join(process.cwd(), mutationFolderPath));
                    yield Promise.all(mutationPathList.map((mutationPath) => __awaiter(this, void 0, void 0, function* () {
                        const Mutation = require(path_1.default.resolve(mutationPath)).default;
                        const mutation = new Mutation();
                        yield this.mutationToInputDefinition(mutation, "inputType", Mutation.name);
                        this.mutationToReturnTypeDefinition(Mutation.name);
                        this.typeMutationDefs += `\t${convertCap_1.convertFirstLowercase(Mutation.name)}(input: ${convertCap_1.convertFirstUppercase(Mutation.name)}InputType!): ${convertCap_1.convertFirstUppercase(Mutation.name)}ReturnType\n`;
                        this.resolvers.Mutation[convertCap_1.convertFirstLowercase(Mutation.name)] = mutation.resolver;
                    })));
                    this.typeMutationDefs += "} \n";
                    this.typeDefs += this.typeMutationDefs;
                }
                this.logger.debug("GQL autogenerater - complete");
                return this.converted(customResolvers, customTypeDefs);
            }
            catch (error) {
                throw {
                    error: error,
                    typeDefs: this.typeDefs
                };
            }
        });
    }
    generatebyList(modelList, mutationList, customResolvers, customTypeDefs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug("GQL autogenerater - start");
                Object.keys(modelList).forEach((importedModel) => {
                    const model = modelList[importedModel].default;
                    const gqlOption = modelList[importedModel].gqlOption ? modelList[importedModel].gqlOption : {};
                    const errors = validate_1.virtualsValidate(model);
                    if (errors.length > 0) {
                        this.logger.error("error!! => ", errors);
                    }
                    this.modelToTypeDefinition(model, gqlOption);
                    this.modelToQueryDefinition(model);
                    this.modelToSortKeyDefinition(model);
                    this.modelToDefaultQuery(model, gqlOption);
                    this.modelToGetALLQuery(model, gqlOption);
                });
                this.typeQueryDefs += "} \n";
                this.typeDefs += this.typeQueryDefs;
                if (mutationList) {
                    this.resolvers.Mutation = {};
                    yield Promise.all(Object.keys(mutationList).map((importedMutation) => __awaiter(this, void 0, void 0, function* () {
                        const Mutation = mutationList[importedMutation].default;
                        const mutation = new Mutation();
                        yield this.mutationToInputDefinition(mutation, "inputType", importedMutation);
                        this.mutationToReturnTypeDefinition(importedMutation);
                        this.typeMutationDefs += `\t${convertCap_1.convertFirstLowercase(importedMutation)}(input: ${convertCap_1.convertFirstUppercase(importedMutation)}InputType!): ${convertCap_1.convertFirstUppercase(importedMutation)}ReturnType\n`;
                        this.resolvers.Mutation[convertCap_1.convertFirstLowercase(importedMutation)] = mutation.resolver;
                    })));
                    this.typeMutationDefs += "} \n";
                    this.typeDefs += this.typeMutationDefs;
                }
                this.logger.debug("GQL autogenerater - complete");
                return this.converted(customResolvers, customTypeDefs);
            }
            catch (error) {
                throw {
                    error: error,
                    typeDefs: this.typeDefs
                };
            }
        });
    }
}
exports.default = MongoToGQL;
//# sourceMappingURL=mongoToGQL.js.map
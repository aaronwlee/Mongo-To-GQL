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
const logger_1 = __importDefault(require("./logger"));
const convertType_1 = __importDefault(require("./util/convertType"));
const convertCap_1 = require("./util/convertCap");
const graphql_type_json_1 = __importDefault(require("graphql-type-json"));
const mongoose_1 = __importDefault(require("mongoose"));
class MongoToGQL {
    constructor(userLogger) {
        this.typeDefs = `\nscalar Date\nscalar JSON\n\n`;
        this.typeQueryDefs = `\ntype Query {\n`;
        this.typeMutationDefs = `\ntype Mutation {\n`;
        this.resolvers = {
            JSON: graphql_type_json_1.default,
            Query: {},
            Mutation: {}
        };
        this.converted = () => ({ typeDefs: apollo_server_express_1.gql(this.typeDefs), resolvers: this.resolvers });
        this.logger = null;
        this.types = [
            "String", "String!", "[String]", "[String!]",
            "Date", "Date!", "[Date]", "[Date!]",
            "Int", "Int!", "[Int]", "[Int!]",
            "ID", "ID!", "[ID]", "[ID!]",
            "Float", "Float!", "[Float]", "[Float!]",
            "Boolean", "Boolean!", "[Boolean]", "[Boolean!]"
        ];
        this.convertQueryType = (fieldName, type) => {
            let returnString = ``;
            if (type.instance === "Date") {
                returnString += `\t${fieldName}_gt: Date\n`;
                returnString += `\t${fieldName}_gte: Date\n`;
                returnString += `\t${fieldName}_lt: Date\n`;
                returnString += `\t${fieldName}_lte: Date\n`;
            }
            else {
                returnString += `\t${fieldName}: String\n`;
                returnString += `\t${fieldName}_ne: String\n`;
                returnString += `\t${fieldName}_in: [String!]\n`;
                returnString += `\t${fieldName}_has: String\n`;
            }
            return returnString;
        };
        this.mutationToReturnTypeDefinition = (mutationName) => {
            let returnTypeDef = `\ntype ${convertCap_1.convertFirstUppercase(mutationName)}ReturnType {\n`;
            returnTypeDef += `\tdone: Boolean\n`;
            returnTypeDef += `\terror: JSON\n`;
            returnTypeDef += `}\n`;
            this.typeDefs += returnTypeDef;
        };
        this.modelToReturnTypeDefinition = (modelName) => {
            let returnTypeDef = `\ntype ${convertCap_1.convertCapAndRemovePlural(modelName)}ReturnType {\n`;
            returnTypeDef += `\tdata: [${convertCap_1.convertCapAndRemovePlural(modelName)}]\n`;
            returnTypeDef += `\tpage: Int\n`;
            returnTypeDef += `\ttotal: Int\n`;
            returnTypeDef += `}\n`;
            this.typeDefs += returnTypeDef;
        };
        this.logger = userLogger ? userLogger : logger_1.default;
    }
    readModelList(modelFolderPath, type = 'js') {
        return new Promise((resolve, reject) => {
            const modelPathList = glob_1.default.sync(`${modelFolderPath}/*.${type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${modelFolderPath}/*.${type}' - found 0 files`);
                reject(`path: '${modelFolderPath}/*.${type}' - found 0 files`);
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`);
                resolve(modelPathList);
            }
        });
    }
    readMutationList(mutationFolderPath, type = 'js') {
        return new Promise((resolve, reject) => {
            const modelPathList = glob_1.default.sync(`${mutationFolderPath}/*.${type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${mutationFolderPath}/*.${type}' - found 0 files`);
                reject(`path: '${mutationFolderPath}/*.${type}' - found 0 files`);
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`);
                resolve(modelPathList);
            }
        });
    }
    modelToTypeDefinition({ model, schema }) {
        let modelDef = `\ntype ${convertCap_1.convertCapAndRemovePlural(model.modelName)} {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName === '_id') {
                modelDef += `\t_id: ID\n`;
            }
            else if (fieldName !== '__v') {
                modelDef += `\t${fieldName}: ${convertType_1.default(schema.paths[fieldName])}\n`;
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    modelToQueryDefinition({ model, schema }) {
        let modelDef = `\ninput ${convertCap_1.convertCapAndRemovePlural(model.modelName)}Query {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v') {
                modelDef += this.convertQueryType(fieldName, schema.paths[fieldName]);
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    modelToSortKeyDefinition({ model, schema }) {
        let modelDef = `\nenum ${convertCap_1.convertCapAndRemovePlural(model.modelName)}SortKey {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v' && fieldName !== '_id') {
                modelDef += `\t${fieldName}_asc\n`;
                modelDef += `\t${fieldName}_desc\n`;
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    mutationToInputDefinition(mutation, type) {
        return new Promise((resolve, reject) => {
            let tempString = `\n`;
            if (type === "inputType") {
                tempString += `input ${convertCap_1.convertFirstUppercase(mutation.mutationName)}InputType {\n`;
            }
            else {
                tempString += `input ${type} {\n`;
            }
            Object.keys(mutation[type]).forEach((field) => {
                if (this.types.includes(mutation[type][field])) {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                }
                else {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                    this.mutationToInputDefinition(mutation, mutation[type][field].replace(/\[|\]|\!/g, ""));
                }
            });
            tempString += `}\n`;
            this.typeDefs += tempString;
            resolve();
        });
    }
    modelToDefaultQuery({ model }) {
        this.resolvers.Query[convertCap_1.convertCapAndRemovePlural(model.modelName)] = (_, { _id }) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
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
    modelToGetALLQuery({ model, gqlOption = {} }) {
        this.resolvers.Query[convertCap_1.convertCapAndAddPlural(model.modelName)] = (_, { filter = {}, page = 0, limit = 10, sort }) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // map query
                    let queryMap = {};
                    Object.keys(filter).forEach(filterKey => {
                        let splitedKey = filterKey.split('_');
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
                    });
                    // map sort by key
                    let sortMap = {};
                    if (sort) {
                        const splitedKey = sort.split('_');
                        sortMap[splitedKey[0]] = splitedKey[1];
                    }
                    const data = yield model.find(queryMap).populate(gqlOption && gqlOption.Populate).skip(page * limit).limit(limit).sort(sortMap);
                    resolve({
                        data: data,
                        page: page,
                        total: data.length
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
    generate(modelFolderPath, mutationFolderPath, type = 'js') {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('GQL autogenerater - start');
            const modelPathList = yield this.readModelList(path_1.default.join(process.cwd(), modelFolderPath), type);
            Object.keys(mongoose_1.default.connection.models).forEach(name => {
                delete mongoose_1.default.connection.models[name];
            });
            modelPathList.forEach((modelPath) => {
                const imported = require(path_1.default.resolve(modelPath));
                this.modelToTypeDefinition(imported);
                this.modelToQueryDefinition(imported);
                this.modelToSortKeyDefinition(imported);
                this.modelToDefaultQuery(imported);
                this.modelToGetALLQuery(imported);
            });
            this.typeQueryDefs += `} \n`;
            this.typeDefs += this.typeQueryDefs;
            const mutationPathList = yield this.readMutationList(path_1.default.join(process.cwd(), mutationFolderPath), type);
            yield Promise.all(mutationPathList.map((mutationPath) => __awaiter(this, void 0, void 0, function* () {
                const Mutation = require(path_1.default.resolve(mutationPath)).default;
                const mutation = new Mutation();
                yield this.mutationToInputDefinition(mutation, "inputType");
                this.mutationToReturnTypeDefinition(mutation.mutationName);
                this.typeMutationDefs += `\t${convertCap_1.convertFirstLowercase(mutation.mutationName)}(input: ${convertCap_1.convertFirstUppercase(mutation.mutationName)}InputType!): ${convertCap_1.convertFirstUppercase(mutation.mutationName)}ReturnType\n`;
                this.resolvers.Mutation[convertCap_1.convertFirstLowercase(mutation.mutationName)] = mutation.resolver;
            })));
            this.typeMutationDefs += `} \n`;
            this.typeDefs += this.typeMutationDefs;
            this.logger.debug('GQL autogenerater - complete');
            return true;
        });
    }
}
exports.default = MongoToGQL;
//# sourceMappingURL=index.js.map
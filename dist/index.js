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
class MongoToGQL {
    constructor(userLogger) {
        this.typeDefs = `\nscalar Date\n`;
        this.typeQueryDefs = `\ntype Query {\n`;
        this.resolvers = {
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
    mutationToDefinition(mutation, type) {
        return new Promise((resolve, reject) => {
            let tempString = ``;
            if (type === "inputType") {
                tempString += `type ${convertCap_1.convertCapAndRemovePlural(mutation.mutationName)}InputType {\n`;
            }
            else {
                tempString += `type ${type} {\n`;
            }
            Object.keys(mutation[type]).forEach((field) => {
                if (this.types.includes(mutation[type][field])) {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                }
                else {
                    tempString += `\t${field}: ${mutation[type][field]}\n`;
                    this.mutationToDefinition(mutation, mutation[type][field]);
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
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.debug('GQL autogenerater - start');
                const modelPathList = yield this.readModelList(modelFolderPath, type);
                modelPathList.forEach((modelPath) => {
                    const model = require(path_1.default.resolve(modelPath));
                    this.modelToTypeDefinition(model);
                    this.modelToQueryDefinition(model);
                    this.modelToSortKeyDefinition(model);
                    this.modelToDefaultQuery(model);
                    this.modelToGetALLQuery(model);
                });
                this.typeQueryDefs += `} \n`;
                const mutationPathList = yield this.readMutationList(mutationFolderPath, type);
                yield Promise.all(mutationPathList.map((mutationPath) => {
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        const Imported = require(path_1.default.resolve(mutationPath));
                        const mutationName = Object.keys(Imported)[0];
                        const mutation = new Imported[mutationName]();
                        yield this.mutationToDefinition(mutation, "inputType");
                        this.resolvers.Mutation[convertCap_1.convertFirstLowercase(mutationName)] = mutation.resolver;
                        resolve();
                    }));
                }));
                this.typeDefs += this.typeQueryDefs;
                this.logger.debug('GQL autogenerater - complete');
                resolve();
            }
            catch (error) {
                reject(error);
            }
        }));
    }
}
exports.default = MongoToGQL;
//# sourceMappingURL=index.js.map
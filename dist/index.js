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
const logger_1 = __importDefault(require("./logger"));
const apollo_server_express_1 = require("apollo-server-express");
class MongoToGQL {
    constructor(userLogger) {
        this.typeDefs = `\nscalar Date\n`;
        this.typeQueryDefs = `\ntype Query {\n`;
        this.resolvers = {
            Query: {}
        };
        this.converted = () => ({ typeDefs: apollo_server_express_1.gql(this.typeDefs), resolvers: this.resolvers });
        this.logger = null;
        this.convertCapAndRemovePlural = (fieldName) => {
            let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
            if (newFieldName[newFieldName.length - 1] === 's') {
                newFieldName = newFieldName.slice(0, newFieldName.length - 1);
            }
            return newFieldName;
        };
        this.convertCapAndAddPlural = (fieldName) => {
            let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
            if (newFieldName[newFieldName.length - 1] !== 's') {
                newFieldName += 's';
            }
            return newFieldName;
        };
        this.convertType = (type) => {
            const basic = ["String", "Date", "Number"];
            if (basic.includes(type.instance)) {
                if (type.instance === "Number") {
                    return "Int";
                }
                else {
                    return type.instance;
                }
            }
            else if (type.instance === "Array") {
                if (basic.includes(type.caster.instance)) {
                    if (type.caster.instance === "Number") {
                        return '[Int]';
                    }
                    else {
                        return `[${type.caster.instance}]`;
                    }
                }
                else {
                    return `[${this.convertCapAndRemovePlural(type.path)}]`;
                }
            }
            else if (type.instance === "ObjectID") {
                return this.convertCapAndRemovePlural(type.path);
            }
            else {
                return type.instance;
            }
        };
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
            let returnTypeDef = `\ntype ${this.convertCapAndRemovePlural(modelName)}ReturnType {\n`;
            returnTypeDef += `\tdata: [${this.convertCapAndRemovePlural(modelName)}]\n`;
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
    modelToTypeDefinition({ model, schema }) {
        let modelDef = `\ntype ${this.convertCapAndRemovePlural(model.modelName)} {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName === '_id') {
                modelDef += `\t_id: ID\n`;
            }
            else if (fieldName !== '__v') {
                modelDef += `\t${fieldName}: ${this.convertType(schema.paths[fieldName])}\n`;
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    modelToQueryDefinition({ model, schema }) {
        let modelDef = `\ninput ${this.convertCapAndRemovePlural(model.modelName)}Query {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v') {
                modelDef += this.convertQueryType(fieldName, schema.paths[fieldName]);
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    modelToSortKeyDefinition({ model, schema }) {
        let modelDef = `\nenum ${this.convertCapAndRemovePlural(model.modelName)}SortKey {\n`;
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v' && fieldName !== '_id') {
                modelDef += `\t${fieldName}_asc\n`;
                modelDef += `\t${fieldName}_desc\n`;
            }
        });
        modelDef += `}\n`;
        this.typeDefs += modelDef;
    }
    modelToDefaultQuery({ model }) {
        this.resolvers.Query[this.convertCapAndRemovePlural(model.modelName)] = (_, { _id }) => {
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
        this.typeQueryDefs += `\t${this.convertCapAndRemovePlural(model.modelName)}(_id: ID!): ${this.convertCapAndRemovePlural(model.modelName)}!\n`;
    }
    modelToGetALLQuery({ model, gqlOption = {} }) {
        this.resolvers.Query[this.convertCapAndAddPlural(model.modelName)] = (_, { filter = {}, page = 0, limit = 10, sort }) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // map query
                    let queryMap = {};
                    Object.keys(filter).forEach(filterKey => {
                        const splitedKey = filterKey.split('_');
                        if (splitedKey[1] === 'has') {
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
        this.typeQueryDefs += `\t${this.convertCapAndAddPlural(model.modelName)}(page: Int, limit: Int, filter: ${this.convertCapAndRemovePlural(model.modelName)}Query, sort: ${this.convertCapAndRemovePlural(model.modelName)}SortKey): ${this.convertCapAndRemovePlural(model.modelName)}ReturnType!\n`;
    }
    generate(modelFolderPath, type = 'js') {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug('GQL autogenerater - start');
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
                this.typeDefs += this.typeQueryDefs;
                logger_1.default.debug('GQL autogenerater - complete');
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
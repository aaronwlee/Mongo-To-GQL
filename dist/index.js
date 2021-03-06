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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoToGQL_1 = __importDefault(require("./mongoToGQL"));
const logger_1 = __importDefault(require("./utils/logger"));
const apollo_server_express_1 = require("apollo-server-express");
exports.graphType = {
    String: "String",
    StringRequire: "String!",
    StringArray: "[String]",
    StringArrayRequire: "[String!]",
    Int: "Int",
    IntRequire: "Int!",
    IntArray: "[Int]",
    IntArrayRequire: "[Int!]",
    Date: "Date",
    DateRequire: "Date!",
    DateArray: "[Date]",
    DateArrayRequire: "[Date!]",
    ID: "ID",
    IDRequire: "ID!",
    IDArray: "[ID]",
    IDArrayRequire: "[ID!]",
    Float: "Float",
    FloatRequire: "Float!",
    FloatArray: "[Float]",
    FloatArrayRequire: "[Float!]",
    Boolean: "Boolean",
    BooleanRequire: "Boolean!",
    BooleanArray: "[Boolean]",
    BooleanRequireArray: "[Boolean!]",
    Json: "JSON",
    JsonRequire: "JSON!",
    Upload: "Upload",
    UploadRequire: "Upload!",
    Custom: (custom) => custom,
    CustomRequire: (custom) => `${custom}!`,
    CustomArray: (custom) => `[${custom}]`,
    CustomArrayRequire: (custom) => `[${custom}!]`,
};
function convertToGQL(_a) {
    var options = __rest(_a, []);
    return __awaiter(this, void 0, void 0, function* () {
        const { modelFolderPath, mutationFolderPath = null, modelList, mutationList = null, devWithTs = false, customResolvers, customTypeDefs } = options;
        if (devWithTs && modelFolderPath) {
            logger_1.default.warn("You've selected development with typescript mode. Make sure you're using 'nodemon'. Have fun! :)");
            logger_1.default.info("Don't forget to change 'devWithTs' option to false and pure js file when you'll deploy as a production.");
        }
        try {
            const mongotogql = new mongoToGQL_1.default(logger_1.default, devWithTs);
            if (modelFolderPath) {
                const converted = yield mongotogql.generatebyPath(modelFolderPath, mutationFolderPath, customResolvers, customTypeDefs);
                return {
                    converted: converted,
                    pureTypeDefs: mongotogql.typeDefs,
                    pureResolvers: mongotogql.resolvers
                };
            }
            else if (modelList) {
                const converted = yield mongotogql.generatebyList(modelList, mutationList, customResolvers, customTypeDefs);
                return {
                    converted: converted,
                    pureTypeDefs: mongotogql.typeDefs,
                    pureResolvers: mongotogql.resolvers
                };
            }
            throw "Either modelFolderPath or modelList is must required";
        }
        catch (error) {
            console.error(error.error);
            throw error;
        }
    });
}
exports.convertToGQL = convertToGQL;
function executeApolloServer(_a) {
    var options = __rest(_a, []);
    return __awaiter(this, void 0, void 0, function* () {
        const { app, modelFolderPath, mutationFolderPath = null, modelList, mutationList = null, path = "/graphql", devWithTs = false, apolloOptions, context, customResolvers, customTypeDefs } = options;
        if (devWithTs && modelFolderPath) {
            logger_1.default.warn("You've selected development with typescript mode. Make sure you're using 'nodemon'. Have fun! :)");
            logger_1.default.info("Don't forget to change 'devWithTs' option to false and pure js file when you'll deploy as a production.");
        }
        try {
            const mongotogql = new mongoToGQL_1.default(logger_1.default, devWithTs);
            if (modelFolderPath) {
                const converted = yield mongotogql.generatebyPath(modelFolderPath, mutationFolderPath, customResolvers, customTypeDefs);
                new apollo_server_express_1.ApolloServer(Object.assign(Object.assign(Object.assign({}, apolloOptions), converted), { context: context, playground: process.env.NODE_ENV === 'production' ?
                        false :
                        {
                            settings: { 'request.credentials': 'include' }
                        } })).applyMiddleware({ app, path });
                logger_1.default.info(`GQL has successfully applied to middleware at ${path}`);
                return {
                    converted: converted,
                    pureTypeDefs: mongotogql.typeDefs,
                    pureResolvers: mongotogql.resolvers
                };
            }
            else if (modelList) {
                const converted = yield mongotogql.generatebyList(modelList, mutationList, customResolvers, customTypeDefs);
                new apollo_server_express_1.ApolloServer(Object.assign(Object.assign(Object.assign({}, apolloOptions), converted), { context: context, playground: process.env.NODE_ENV === 'production' ?
                        false :
                        {
                            settings: { 'request.credentials': 'include' }
                        } })).applyMiddleware({ app, path });
                logger_1.default.info(`GQL has successfully applied to middleware at ${path}`);
                return {
                    converted: converted,
                    pureTypeDefs: mongotogql.typeDefs,
                    pureResolvers: mongotogql.resolvers
                };
            }
            throw "Either 'modelFolderPath' or 'modelList' is must required";
        }
        catch (error) {
            console.error(error.error);
            throw error;
        }
    });
}
exports.executeApolloServer = executeApolloServer;
exports.default = (logger = logger_1.default, devWithTs = false) => new mongoToGQL_1.default(logger, devWithTs);
//# sourceMappingURL=index.js.map
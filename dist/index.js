"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoToGQL_1 = __importDefault(require("./mongoToGQL"));
const logger_1 = __importDefault(require("./utils/logger"));
const apollo_server_express_1 = require("apollo-server-express");
class ReturnType {
    constructor() {
        this.done = false;
    }
}
exports.ReturnType = ReturnType;
exports.GQLt = {
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
    Custom: (custom) => custom,
    CustomRequire: (custom) => `${custom}!`,
    CustomArray: (custom) => `[${custom}]`,
    CustomArrayRequire: (custom) => `[${custom}!]`,
};
function executeApolloServer(app, modelFolderPath, mutationFolderPath = null, logger = logger_1.default) {
    new mongoToGQL_1.default(logger).generate(modelFolderPath, mutationFolderPath)
        .then(converted => {
        new apollo_server_express_1.ApolloServer(converted).applyMiddleware({ app });
    })
        .catch(error => {
        logger.error("mongo-to-gql failed ", error);
    });
}
exports.executeApolloServer = executeApolloServer;
exports.default = (logger = logger_1.default) => new mongoToGQL_1.default(logger);
//# sourceMappingURL=index.js.map
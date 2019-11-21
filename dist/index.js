"use strict";
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
class ReturnType {
    constructor() {
        this.done = false;
    }
}
exports.ReturnType = ReturnType;
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
    Custom: (custom) => custom,
    CustomRequire: (custom) => `${custom}!`,
    CustomArray: (custom) => `[${custom}]`,
    CustomArrayRequire: (custom) => `[${custom}!]`,
};
class Options {
}
exports.Options = Options;
const apolloServerOptions = (_a) => {
    var options = __rest(_a, []);
    return ({
        app: options.app,
        path: options.path ? options.path : '/graphql',
        modelFolderPath: options.modelFolderPath,
        mutationFolderPath: options.mutationFolderPath ? options.mutationFolderPath : null,
        logger: options.logger ? options.logger : logger_1.default
    });
};
function executeApolloServer(_a) {
    var options = __rest(_a, []);
    const MTGOptions = apolloServerOptions(options);
    const { app, path, logger, modelFolderPath, mutationFolderPath } = MTGOptions;
    new mongoToGQL_1.default(MTGOptions.logger).generate(modelFolderPath, mutationFolderPath)
        .then(converted => {
        new apollo_server_express_1.ApolloServer(converted).applyMiddleware({ app, path });
    })
        .catch(error => {
        logger.error("mongo-to-gql failed ", error);
    });
}
exports.executeApolloServer = executeApolloServer;
exports.default = (logger = logger_1.default) => new mongoToGQL_1.default(logger);
//# sourceMappingURL=index.js.map
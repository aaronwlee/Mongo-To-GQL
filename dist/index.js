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
class MongoToGQLOptions {
    constructor() {
        this.path = "/graphql";
        this.mutationFolderPath = null;
        this.logger = logger_1.default;
    }
}
exports.MongoToGQLOptions = MongoToGQLOptions;
function executeApolloServer(_a) {
    var options = __rest(_a, []);
    return __awaiter(this, void 0, void 0, function* () {
        const { app, path, logger, modelFolderPath, mutationFolderPath } = options;
        console.log(options);
        try {
            const converted = yield new mongoToGQL_1.default(logger).generate(modelFolderPath, mutationFolderPath);
            new apollo_server_express_1.ApolloServer(converted).applyMiddleware({ app, path });
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.executeApolloServer = executeApolloServer;
exports.default = (logger = logger_1.default) => new mongoToGQL_1.default(logger);
//# sourceMappingURL=index.js.map
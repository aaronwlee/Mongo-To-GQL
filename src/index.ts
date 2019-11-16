import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import defaultlogger from './utils/logger'
import { ApolloServer } from "apollo-server-express";

export class ReturnType {
    done: boolean = false;
    error: any;
}

export interface Mutation {
    mutationName: string;
    inputType: {};
    resolver: (parent?: any, args?: any, context?: any, info?: any) => Promise<ReturnType>;
}

export const GQLt = {
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

    Custom: (custom: string) => custom,
    CustomRequire: (custom: string) => `${custom}!`,
    CustomArray: (custom: string) => `[${custom}]`,
    CustomArrayRequire: (custom: string) => `[${custom}!]`,
}

export function executeApolloServer(app: any, modelFolderPath: string, mutationFolderPath: string, type: string = 'js', logger: Logger = defaultlogger) {
    new MongoToGQL(logger).generate(modelFolderPath, mutationFolderPath, type)
        .then(converted => {
            new ApolloServer(converted).applyMiddleware({ app })
        })
        .catch(error => {
            logger.error("mongo-to-gql failed ", error)
        })
}

export default (logger: Logger = defaultlogger) => new MongoToGQL(logger);
import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import defaultlogger from './utils/logger'
import { ApolloServer } from "apollo-server-express";
import { Schema, Model } from "mongoose";

export class ReturnType {
    done: boolean = false;
    error: any;
}

export interface Mutation {
    mutationName: string;
    inputType: {};
    resolver: (parent?: any, args?: any, context?: any, info?: any) => Promise<ReturnType>;
}

export interface GraphModel {
    gqlOption?: {
        Populate: string[]
    }
    schema: Schema,
    model: Model<any>
}

export const graphType = {
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

export class Options {
    app: any;
    path?: string;
    modelFolderPath: string;
    mutationFolderPath?: string;
    logger?: string;
}

const apolloServerOptions = ({ ...options }: Options) => ({
    app: options.app,
    path: options.path ? options.path : '/graphql',
    modelFolderPath: options.modelFolderPath,
    mutationFolderPath: options.mutationFolderPath ? options.mutationFolderPath : null,
    logger: options.logger ? options.logger : defaultlogger
})

export function executeApolloServer({ ...options }: Options) {
    const MTGOptions = apolloServerOptions(options)
    const { app, path, logger, modelFolderPath, mutationFolderPath } = MTGOptions
    new MongoToGQL(MTGOptions.logger).generate(modelFolderPath, mutationFolderPath)
        .then(converted => {
            new ApolloServer(converted).applyMiddleware({ app, path })
        })
        .catch(error => {
            logger.error("mongo-to-gql failed ", error)
        })
}

export default (logger: Logger = defaultlogger) => new MongoToGQL(logger);
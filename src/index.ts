import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import defaultlogger from "./utils/logger";
import { ApolloServer } from "apollo-server-express";
import { Express } from 'express'

export class ReturnType {
  public done: boolean = false;
  public error: any;
}

export interface Imutation {
  mutationName: string;
  inputType: {};
  resolver: (parent?: any, args?: any, context?: any, info?: any) => Promise<ReturnType>;
}

export interface IgqlOption {
  Populate: string[] | {
    path: string;
    match?: any;
    select?: any;
    options?: any;
  }[];
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
};

export interface ImongoToGQLOptions {
  app: Express;
  path?: string;
  modelFolderPath: string;
  mutationFolderPath?: string;
  logger?: Logger;
  apolloOptions?: any;
}

interface IresultType {
  converted: {
    typeDefs: any,
    resolvers: any
  },
  pureTypeDefs: string,
  pureResolvers: any
}

export async function executeApolloServer({ ...options }: ImongoToGQLOptions): Promise<IresultType> {
  const { app, modelFolderPath, mutationFolderPath = null, path = "/graphql", logger = defaultlogger, apolloOptions } = options;
  try {
    const mongotogql = new MongoToGQL(logger)
    const converted = await mongotogql.generate(modelFolderPath, mutationFolderPath)
    new ApolloServer({ ...apolloOptions, ...converted }).applyMiddleware({ app, path });
    return {
      converted: converted,
      pureTypeDefs: mongotogql.typeDefs,
      pureResolvers: mongotogql.resolvers
    }
  } catch (error) {
    logger.error(error)
    console.error(error)
  }
}

export default (logger: Logger = defaultlogger) => new MongoToGQL(logger);
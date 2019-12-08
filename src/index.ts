import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import defaultlogger from "./utils/logger";
import { ApolloServer } from "apollo-server-express";
import { Express } from 'express'
import { Model } from "mongoose";


export interface Icontext {
  user: any;
}

export interface IreturnType {
  done?: any;
  error?: any;
}

export interface Imutation {
  mutationName: string;
  inputType: {};
  resolver: (parent?: any, args?: any, context?: Icontext, info?: any) => Promise<IreturnType>;
}

export interface IgqlOption {
  Populate?: string[] | {
    path: string;
    match?: any;
    model?: Model<any>;
    select?: any;
    options?: any;
  }[];
  Auth?: boolean;
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

  Json: "JSON",
  JsonRequire: "JSON!",

  Upload: "Upload",
  UploadRequire: "Upload!",

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
  devWithTs?: boolean;
  apolloOptions?: any;
  customResolvers?: any;
  context?: ({ req }: any) => Icontext;
  customTypeDefs?: string;
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
  const { app, modelFolderPath, mutationFolderPath = null, path = "/graphql", devWithTs = false, apolloOptions, customResolvers, customTypeDefs } = options;
  if (devWithTs) {
    defaultlogger.warn("You've selected development with typescript mode. Make sure you're using 'nodemon'. Have fun! :)")
    defaultlogger.info("Don't forget to change 'devWithTs' option to false and pure js file when you'll deploy as a production.")
  }
  try {
    const mongotogql = new MongoToGQL(defaultlogger, devWithTs)
    const converted = await mongotogql.generate(modelFolderPath, mutationFolderPath, customResolvers, customTypeDefs)
    new ApolloServer({ ...apolloOptions, ...converted }).applyMiddleware({ app, path });
    return {
      converted: converted,
      pureTypeDefs: mongotogql.typeDefs,
      pureResolvers: mongotogql.resolvers
    }
  } catch (error) {
    console.error(error.error)
    throw error
  }
}

export default (logger: Logger = defaultlogger, devWithTs: boolean = false) => new MongoToGQL(logger, devWithTs);
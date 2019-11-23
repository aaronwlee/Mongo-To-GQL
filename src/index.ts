import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import defaultlogger from "./utils/logger";
import { ApolloServer } from "apollo-server-express";

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

export class MongoToGQLOptions {
  public app: any;
  public path?: string = "/graphql";
  public modelFolderPath: string;
  public mutationFolderPath?: string = null;
  public logger?: Logger = defaultlogger;
}

export async function executeApolloServer({ ...options }: MongoToGQLOptions) {
  const { app, path, logger, modelFolderPath, mutationFolderPath } = options;
  console.log(options)
  try {
    const converted = await new MongoToGQL(logger).generate(modelFolderPath, mutationFolderPath)
    new ApolloServer(converted).applyMiddleware({ app, path });
  } catch (error) {
    console.error(error)
  }
}

export default (logger: Logger = defaultlogger) => new MongoToGQL(logger);
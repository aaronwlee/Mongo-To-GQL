import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import { Schema, Model, Mongoose } from "mongoose";
export declare class ReturnType {
    done: boolean;
    error: any;
}
export interface Mutation {
    mutationName: string;
    inputType: {};
    resolver: (parent?: any, args?: any, context?: any, info?: any) => Promise<ReturnType>;
}
export interface GraphModel {
    gqlOption?: {
        Populate: string[];
    };
    schema: Schema;
    model: Model<any>;
}
export declare function mongoModel(mongo: Mongoose, modelName: string, modelSchema: Schema): Model<any, {}>;
export declare const graphType: {
    String: string;
    StringRequire: string;
    StringArray: string;
    StringArrayRequire: string;
    Int: string;
    IntRequire: string;
    IntArray: string;
    IntArrayRequire: string;
    Date: string;
    DateRequire: string;
    DateArray: string;
    DateArrayRequire: string;
    ID: string;
    IDRequire: string;
    IDArray: string;
    IDArrayRequire: string;
    Float: string;
    FloatRequire: string;
    FloatArray: string;
    FloatArrayRequire: string;
    Boolean: string;
    BooleanRequire: string;
    BooleanArray: string;
    BooleanRequireArray: string;
    Custom: (custom: string) => string;
    CustomRequire: (custom: string) => string;
    CustomArray: (custom: string) => string;
    CustomArrayRequire: (custom: string) => string;
};
export declare class MongoToGQLOptions {
    app: any;
    path?: string;
    modelFolderPath: string;
    mutationFolderPath?: string;
    logger?: string;
}
export declare function executeApolloServer({ ...options }: MongoToGQLOptions): void;
declare const _default: (logger?: Logger) => MongoToGQL;
export default _default;

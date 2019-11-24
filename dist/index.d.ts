import MongoToGQL from "./mongoToGQL";
import { Logger } from "winston";
import { Express } from 'express';
export declare class ReturnType {
    done: boolean;
    error: any;
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
export interface ImongoToGQLOptions {
    app: Express;
    path?: string;
    modelFolderPath: string;
    mutationFolderPath?: string;
    logger?: Logger;
    apolloOptions?: any;
    customResolvers?: any;
    customTypeDefs?: string;
}
interface IresultType {
    converted: {
        typeDefs: any;
        resolvers: any;
    };
    pureTypeDefs: string;
    pureResolvers: any;
}
export declare function executeApolloServer({ ...options }: ImongoToGQLOptions): Promise<IresultType>;
declare const _default: (logger?: Logger) => MongoToGQL;
export default _default;

import { Logger } from 'winston';
export interface MutationClass {
    mutationName: string;
    inputType: {};
    resolver: any;
}
declare class MongoToGQL {
    typeDefs: string;
    private typeQueryDefs;
    resolvers: any;
    converted: any;
    private logger;
    private types;
    constructor(userLogger?: Logger);
    private convertQueryType;
    private readModelList;
    private readMutationList;
    private modelToTypeDefinition;
    private modelToQueryDefinition;
    private modelToSortKeyDefinition;
    private mutationToDefinition;
    private modelToDefaultQuery;
    private modelToGetALLQuery;
    private modelToReturnTypeDefinition;
    generate(modelFolderPath: string, mutationFolderPath: string, type?: string): Promise<unknown>;
}
export default MongoToGQL;

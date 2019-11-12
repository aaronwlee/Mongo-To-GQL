import { Logger } from 'winston';
declare class MongoToGQL {
    typeDefs: string;
    typeQueryDefs: string;
    resolvers: any;
    converted: any;
    private logger;
    constructor(userLogger?: Logger);
    private convertCapAndRemovePlural;
    private convertCapAndAddPlural;
    private convertType;
    private convertQueryType;
    private readModelList;
    private modelToTypeDefinition;
    private modelToQueryDefinition;
    private modelToSortKeyDefinition;
    private modelToDefaultQuery;
    private modelToGetALLQuery;
    private modelToReturnTypeDefinition;
    generate(modelFolderPath: string, type?: string): Promise<unknown>;
}
export default MongoToGQL;

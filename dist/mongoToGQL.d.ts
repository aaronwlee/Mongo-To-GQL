import { Logger } from "winston";
declare class MongoToGQL {
    typeDefs: string;
    private typeQueryDefs;
    private typeMutationDefs;
    private type;
    resolvers: any;
    converted: any;
    private logger;
    constructor(gqlLogger: Logger, devWithTs?: boolean);
    private readModelList;
    private readMutationList;
    private modelToTypeDefinition;
    private modelToQueryDefinition;
    private modelToSortKeyDefinition;
    private mutationToInputDefinition;
    private modelToDefaultQuery;
    private modelToGetALLQuery;
    private mutationToReturnTypeDefinition;
    private modelToReturnTypeDefinition;
    generate(modelFolderPath: string, mutationFolderPath?: string, customResolvers?: any, customTypeDefs?: string): Promise<any>;
}
export default MongoToGQL;

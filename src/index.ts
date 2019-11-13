import path from 'path';
import glob from 'glob';
import { gql } from 'apollo-server-express';
import { Logger } from 'winston';
import defaultlogger from './logger'
import convertType from './util/convertType';
import { convertCapAndAddPlural, convertCapAndRemovePlural, convertFirstLowercase } from './util/convertCap';

export interface Mutation {
    mutationName: string;
    inputType: {};
    resolver: any;
}

class MongoToGQL {
    public typeDefs: string = `\nscalar Date\n`;
    private typeQueryDefs: string = `\ntype Query {\n`

    public resolvers: any = {
        Query: {

        },
        Mutation: {

        }
    };

    public converted: any = () => ({ typeDefs: gql(this.typeDefs), resolvers: this.resolvers })

    private logger: Logger = null;

    private types = [
        "String", "String!", "[String]", "[String!]",
        "Date", "Date!", "[Date]", "[Date!]",
        "Int", "Int!", "[Int]", "[Int!]",
        "ID", "ID!", "[ID]", "[ID!]",
        "Float", "Float!", "[Float]", "[Float!]",
        "Boolean", "Boolean!", "[Boolean]", "[Boolean!]"
    ]

    constructor(userLogger?: Logger) {
        this.logger = userLogger ? userLogger : defaultlogger;
    }

    private convertQueryType = (fieldName: string, type: any) => {
        let returnString = ``
        if (type.instance === "Date") {
            returnString += `\t${fieldName}_gt: Date\n`
            returnString += `\t${fieldName}_gte: Date\n`
            returnString += `\t${fieldName}_lt: Date\n`
            returnString += `\t${fieldName}_lte: Date\n`
        }
        else {
            returnString += `\t${fieldName}: String\n`
            returnString += `\t${fieldName}_ne: String\n`
            returnString += `\t${fieldName}_in: [String!]\n`
            returnString += `\t${fieldName}_has: String\n`
        }
        return returnString;
    }

    private readModelList(modelFolderPath: string, type: string = 'js') {
        return new Promise<string[]>((resolve, reject) => {
            const modelPathList = glob.sync(`${modelFolderPath}/*.${type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${modelFolderPath}/*.${type}' - found 0 files`)
                reject(`path: '${modelFolderPath}/*.${type}' - found 0 files`)
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`)
                resolve(modelPathList);
            }
        })
    }

    private readMutationList(mutationFolderPath: string, type: string = 'js') {
        return new Promise<string[]>((resolve, reject) => {
            const modelPathList = glob.sync(`${mutationFolderPath}/*.${type}`);
            if (modelPathList.length === 0) {
                this.logger.error(`GQL autogenerater - path: '${mutationFolderPath}/*.${type}' - found 0 files`)
                reject(`path: '${mutationFolderPath}/*.${type}' - found 0 files`)
            }
            else {
                this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`)
                resolve(modelPathList);
            }
        })
    }

    private modelToTypeDefinition({ model, schema }: any) {
        let modelDef = `\ntype ${convertCapAndRemovePlural(model.modelName)} {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName === '_id') {
                modelDef += `\t_id: ID\n`
            }
            else if (fieldName !== '__v') {
                modelDef += `\t${fieldName}: ${convertType(schema.paths[fieldName])}\n`
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private modelToQueryDefinition({ model, schema }: any) {
        let modelDef = `\ninput ${convertCapAndRemovePlural(model.modelName)}Query {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v') {
                modelDef += this.convertQueryType(fieldName, schema.paths[fieldName])
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private modelToSortKeyDefinition({ model, schema }: any) {
        let modelDef = `\nenum ${convertCapAndRemovePlural(model.modelName)}SortKey {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v' && fieldName !== '_id') {
                modelDef += `\t${fieldName}_asc\n`
                modelDef += `\t${fieldName}_desc\n`
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private mutationToDefinition(mutation: any, type: any) {
        return new Promise((resolve, reject) => {
            let tempString = ``
            if (type === "inputType") {
                tempString += `type ${convertCapAndRemovePlural(mutation.mutationName)}InputType {\n`
            }
            else {
                tempString += `type ${type} {\n`
            }
            Object.keys(mutation[type]).forEach((field) => {
                if (this.types.includes(mutation[type][field])) {
                    tempString += `\t${field}: ${mutation[type][field]}\n`
                }
                else {
                    tempString += `\t${field}: ${mutation[type][field]}\n`
                    this.mutationToDefinition(mutation, mutation[type][field])
                }
            })
            tempString += `}\n`
            this.typeDefs += tempString
            resolve()
        })
    }

    private modelToDefaultQuery({ model }: any) {
        this.resolvers.Query[convertCapAndRemovePlural(model.modelName)] = (_: any, { _id }: any) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = model.findById(_id)
                    resolve(data);
                } catch (error) {
                    reject(error)
                }
            })
        }

        this.typeQueryDefs += `\t${convertCapAndRemovePlural(model.modelName)}(_id: ID!): ${convertCapAndRemovePlural(model.modelName)}!\n`
    }

    private modelToGetALLQuery({ model, gqlOption = {} }: any) {
        this.resolvers.Query[convertCapAndAddPlural(model.modelName)] = (_: any, { filter = {}, page = 0, limit = 10, sort }: any) => {
            return new Promise(async (resolve, reject) => {
                try {
                    // map query
                    let queryMap: any = {};
                    Object.keys(filter).forEach(filterKey => {
                        let splitedKey = filterKey.split('_')
                        if (splitedKey[0] === "id") {
                            splitedKey[0] = "_id"
                        }

                        if (splitedKey[1] === "has") {
                            queryMap[splitedKey[0]] = new RegExp(filter[filterKey], "i")
                        }
                        else if (splitedKey[1]) {
                            queryMap[splitedKey[0]] = {}
                            queryMap[splitedKey[0]][`$${splitedKey[1]}`] = filter[filterKey]
                        }
                        else {
                            queryMap[splitedKey[0]] = filter[filterKey]
                        }
                    })

                    // map sort by key
                    let sortMap: any = {}
                    if (sort) {
                        const splitedKey = sort.split('_')
                        sortMap[splitedKey[0]] = splitedKey[1]
                    }

                    const data = await model.find(queryMap).populate(gqlOption && gqlOption.Populate).skip(page * limit).limit(limit).sort(sortMap)
                    resolve({
                        data: data,
                        page: page,
                        total: data.length
                    })
                } catch (error) {
                    reject(error)
                }
            })
        }

        this.modelToReturnTypeDefinition(model.modelName)
        this.typeQueryDefs += `\t${convertCapAndAddPlural(model.modelName)}(page: Int, limit: Int, filter: ${convertCapAndRemovePlural(model.modelName)}Query, sort: ${convertCapAndRemovePlural(model.modelName)}SortKey): ${convertCapAndRemovePlural(model.modelName)}ReturnType!\n`
    }

    private modelToReturnTypeDefinition = (modelName: string) => {
        let returnTypeDef = `\ntype ${convertCapAndRemovePlural(modelName)}ReturnType {\n`
        returnTypeDef += `\tdata: [${convertCapAndRemovePlural(modelName)}]\n`
        returnTypeDef += `\tpage: Int\n`
        returnTypeDef += `\ttotal: Int\n`
        returnTypeDef += `}\n`
        this.typeDefs += returnTypeDef
    }

    public generate(modelFolderPath: string, mutationFolderPath: string, type: string = 'js') {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.debug('GQL autogenerater - start')
                const modelPathList: string[] = await this.readModelList(modelFolderPath, type)
                modelPathList.forEach((modelPath: any) => {
                    const model = require(path.resolve(modelPath))
                    this.modelToTypeDefinition(model);
                    this.modelToQueryDefinition(model);
                    this.modelToSortKeyDefinition(model);
                    this.modelToDefaultQuery(model);
                    this.modelToGetALLQuery(model);
                })
                this.typeQueryDefs += `} \n`

                const mutationPathList: string[] = await this.readMutationList(mutationFolderPath, type)
                await Promise.all(mutationPathList.map((mutationPath: any) => {
                    return new Promise(async (resolve, reject) => {
                        const Imported = require(path.resolve(mutationPath))
                        const mutationName = Object.keys(Imported)[0]
                        const mutation = new Imported[mutationName]()

                        await this.mutationToDefinition(mutation, "inputType")
                        this.resolvers.Mutation[convertFirstLowercase(mutationName)] = mutation.resolver
                        resolve()
                    })
                }))

                this.typeDefs += this.typeQueryDefs;
                this.logger.debug('GQL autogenerater - complete')
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default MongoToGQL

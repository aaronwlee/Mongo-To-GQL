import path from 'path';
import glob from 'glob';
import logger from './logger'
import { Logger } from 'winston';
import { gql } from 'apollo-server-express';

class MongoToGQL {
    public typeDefs: string = `\nscalar Date\n`;
    public typeQueryDefs: string = `\ntype Query {\n`

    public resolvers: any = {
        Query: {

        }
    };

    public converted: any = () => ({ typeDefs: gql(this.typeDefs), resolvers: this.resolvers })

    private logger: Logger = null;

    constructor(userLogger?: Logger) {
        this.logger = userLogger ? userLogger : logger;
    }

    private convertCapAndRemovePlural = (fieldName: string) => {
        let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
        if (newFieldName[newFieldName.length - 1] === 's') {
            newFieldName = newFieldName.slice(0, newFieldName.length - 1)
        }
        return newFieldName;
    }

    private convertCapAndAddPlural = (fieldName: any) => {
        let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
        if (newFieldName[newFieldName.length - 1] !== 's') {
            newFieldName += 's'
        }
        return newFieldName;
    }

    private convertType = (type: any) => {
        const basic = ["String", "Date", "Number"];
        if (basic.includes(type.instance)) {
            if (type.instance === "Number") {
                return "Int"
            }
            else {
                return type.instance
            }
        }
        else if (type.instance === "Array") {
            if (basic.includes(type.caster.instance)) {
                if (type.caster.instance === "Number") {
                    return '[Int]'
                }
                else {
                    return `[${type.caster.instance}]`
                }

            }
            else {
                return `[${this.convertCapAndRemovePlural(type.path)}]`
            }
        }
        else if (type.instance === "ObjectID") {
            return this.convertCapAndRemovePlural(type.path)
        }
        else {
            return type.instance
        }
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

    private modelToTypeDefinition({ model, schema }: any) {
        let modelDef = `\ntype ${this.convertCapAndRemovePlural(model.modelName)} {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName === '_id') {
                modelDef += `\t_id: ID\n`
            }
            else if (fieldName !== '__v') {
                modelDef += `\t${fieldName}: ${this.convertType(schema.paths[fieldName])}\n`
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private modelToQueryDefinition({ model, schema }: any) {
        let modelDef = `\ninput ${this.convertCapAndRemovePlural(model.modelName)}Query {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v') {
                modelDef += this.convertQueryType(fieldName, schema.paths[fieldName])
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private modelToSortKeyDefinition({ model, schema }: any) {
        let modelDef = `\nenum ${this.convertCapAndRemovePlural(model.modelName)}SortKey {\n`
        Object.keys(schema.paths).forEach(fieldName => {
            if (fieldName !== '__v' && fieldName !== '_id') {
                modelDef += `\t${fieldName}_asc\n`
                modelDef += `\t${fieldName}_desc\n`
            }
        })
        modelDef += `}\n`

        this.typeDefs += modelDef
    }

    private modelToDefaultQuery({ model }: any) {
        this.resolvers.Query[this.convertCapAndRemovePlural(model.modelName)] = (_: any, { _id }: any) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = model.findById(_id)
                    resolve(data);
                } catch (error) {
                    reject(error)
                }
            })
        }

        this.typeQueryDefs += `\t${this.convertCapAndRemovePlural(model.modelName)}(_id: ID!): ${this.convertCapAndRemovePlural(model.modelName)}!\n`
    }

    private modelToGetALLQuery({ model, gqlOption = {} }: any) {
        this.resolvers.Query[this.convertCapAndAddPlural(model.modelName)] = (_: any, { filter = {}, page = 0, limit = 10, sort }: any) => {
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
        this.typeQueryDefs += `\t${this.convertCapAndAddPlural(model.modelName)}(page: Int, limit: Int, filter: ${this.convertCapAndRemovePlural(model.modelName)}Query, sort: ${this.convertCapAndRemovePlural(model.modelName)}SortKey): ${this.convertCapAndRemovePlural(model.modelName)}ReturnType!\n`
    }

    private modelToReturnTypeDefinition = (modelName: string) => {
        let returnTypeDef = `\ntype ${this.convertCapAndRemovePlural(modelName)}ReturnType {\n`
        returnTypeDef += `\tdata: [${this.convertCapAndRemovePlural(modelName)}]\n`
        returnTypeDef += `\tpage: Int\n`
        returnTypeDef += `\ttotal: Int\n`
        returnTypeDef += `}\n`
        this.typeDefs += returnTypeDef
    }

    public generate(modelFolderPath: string, type: string = 'js') {
        return new Promise(async (resolve, reject) => {
            try {
                logger.debug('GQL autogenerater - start')
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
                this.typeDefs += this.typeQueryDefs;
                logger.debug('GQL autogenerater - complete')
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default MongoToGQL

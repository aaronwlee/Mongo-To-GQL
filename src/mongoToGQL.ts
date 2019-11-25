import path from "path";
import glob from "glob";
import { gql } from "apollo-server-express";
import { Logger } from "winston";
import convertType from "./converters/convertType";
import GraphQLJSON from "graphql-type-json";
import { Model } from "mongoose";
import convertQueryType from "./converters/convertQueryType";
import inputType from "./utils/inputType";
import { convertCapAndRemovePlural, convertFirstUppercase, convertCapAndAddPlural, convertFirstLowercase } from "./converters/convertCap";
import { virtualsValidate } from "./utils/validate";
import { IgqlOption } from "./index";

class MongoToGQL {
  public typeDefs: string = "\nscalar Date\nscalar JSON\n\n";
  private typeQueryDefs: string = "\ntype Query {\n"
  private typeMutationDefs: string = "\ntype Mutation {\n"

  public resolvers: any = {
    JSON: GraphQLJSON,
    Query: {

    }
  };

  public converted: any = (customResolvers?: any, customTypeDefs?: string) => {
    if (customResolvers) {
      Object.keys(customResolvers).forEach(e => {
        if (typeof customResolvers[e] === "object") {
          this.resolvers[e] = { ...this.resolvers[e], ...customResolvers[e] }
        }
        else {
          this.resolvers[e] = customResolvers[e]
        }
      })
    }
    if (customTypeDefs) {
      this.typeDefs + "\n# Under are custom typeDefs\n\n" + customTypeDefs
    }
    return {
      typeDefs: gql(this.typeDefs), resolvers: this.resolvers
    }
  }

  private logger: Logger = null;

  public constructor(gqlLogger: Logger) {
    this.logger = gqlLogger;
  }

  private readModelList(modelFolderPath: string, type: string = "js") {
    return new Promise<string[]>((resolve, reject) => {
      const modelPathList = glob.sync(`${modelFolderPath}/*.${type}`);
      if (modelPathList.length === 0) {
        this.logger.error(`GQL autogenerater - path: '${modelFolderPath}/*.${type}' - found 0 files`);
        reject(`path: '${modelFolderPath}/*.${type}' - found 0 files`);
      }
      else {
        this.logger.debug(`GQL autogenerater - found ${modelPathList.length} models`);
        resolve(modelPathList);
      }
    });
  }

  private readMutationList(mutationFolderPath: string, type: string = "js") {
    return new Promise<string[]>((resolve, reject) => {
      const modelPathList = glob.sync(`${mutationFolderPath}/*.${type}`);
      if (modelPathList.length === 0) {
        this.logger.error(`GQL autogenerater - path: '${mutationFolderPath}/*.${type}' - found 0 files`);
        reject(`path: '${mutationFolderPath}/*.${type}' - found 0 files`);
      }
      else {
        this.logger.debug(`GQL autogenerater - found ${modelPathList.length} mutations`);
        resolve(modelPathList);
      }
    });
  }

  private modelToTypeDefinition(model: any, gqlOption?: IgqlOption) {
    let modelDef = `\ntype ${convertCapAndRemovePlural(model.modelName)} {\n`;
    let embadedMany: any = {}

    Object.keys(model.schema.paths).forEach(fieldName => {
      if (fieldName === "_id") {
        modelDef += "\t_id: ID\n";
      }
      else if (fieldName !== "__v") {
        if (fieldName.split('.').length > 1) {
          embadedMany[fieldName.split('.')[0]] = 'JSON'
        }
        else {
          modelDef += convertType(fieldName, model.schema.paths[fieldName], gqlOption);
        }
      }
    });

    Object.keys(model.schema.virtuals).forEach(virtualName => {
      if (virtualName !== "id") {
        modelDef += `\t${virtualName}: JSON\n`
      }
    })

    Object.keys(embadedMany).forEach(e => {
      modelDef += `\t${e}: ${embadedMany[e]}\n`
    })

    modelDef += "}\n";

    this.typeDefs += modelDef;
  }

  private modelToQueryDefinition(model: any) {
    let modelDef = `\ninput ${convertCapAndRemovePlural(model.modelName)}Query {\n`;
    let embadedMany: any = {}

    Object.keys(model.schema.paths).forEach(fieldName => {
      if (fieldName.split('.').length > 1) {
        embadedMany[fieldName.split('.')[0]] = 'JSON'
      }
      else if (fieldName !== "__v") {
        modelDef += convertQueryType(fieldName, model.schema.paths[fieldName]);
      }
    });
    Object.keys(embadedMany).forEach(e => {
      modelDef += `\t${e}: ${embadedMany[e]}\n`
    })
    modelDef += `\tsubSearch: JSON\n`

    modelDef += "}\n";

    this.typeDefs += modelDef;
  }

  private modelToSortKeyDefinition(model: any) {
    let modelDef = `\nenum ${convertCapAndRemovePlural(model.modelName)}SortKey {\n`;
    Object.keys(model.schema.paths).forEach(fieldName => {
      if (fieldName !== "__v" && fieldName !== "_id" && fieldName.split('.').length === 1) {
        modelDef += `\t${fieldName}_asc\n`;
        modelDef += `\t${fieldName}_desc\n`;
      }
    });
    modelDef += "}\n";

    this.typeDefs += modelDef;
  }

  private mutationToInputDefinition(mutation: any, type: any) {
    return new Promise((resolve, reject) => {
      let tempString = "\n";
      if (type === "inputType") {
        tempString += `input ${convertFirstUppercase(mutation.mutationName)}InputType {\n`;
      }
      else {
        tempString += `input ${type} {\n`;
      }
      Object.keys(mutation[type]).forEach((field) => {
        if (inputType.includes(mutation[type][field])) {
          tempString += `\t${field}: ${mutation[type][field]}\n`;
        }
        else {
          tempString += `\t${field}: ${mutation[type][field]}\n`;
          this.mutationToInputDefinition(mutation, mutation[type][field].replace(/\[|\]|\!/g, ""));
        }
      });
      tempString += "}\n";
      this.typeDefs += tempString;
      resolve();
    });
  }

  private modelToDefaultQuery(model: any) {
    this.resolvers.Query[convertCapAndRemovePlural(model.modelName)] = (_: any, { _id }: any) => {
      return new Promise(async (resolve, reject) => {
        try {
          const data = model.findById(_id);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    };

    this.typeQueryDefs += `\t${convertCapAndRemovePlural(model.modelName)}(_id: ID!): ${convertCapAndRemovePlural(model.modelName)}!\n`;
  }

  private modelToGetALLQuery(model: any, gqlOption: any = {}) {
    this.resolvers.Query[convertCapAndAddPlural(model.modelName)] = (_: any, { filter = {}, page = 0, limit = 10, sort }: any) => {
      return new Promise(async (resolve, reject) => {
        try {
          // map query
          let queryMap: any = {};
          Object.keys(filter).forEach(filterKey => {
            if (filterKey === "subSearch") {
              queryMap = { ...queryMap, ...JSON.parse(filter[filterKey]) }
            }
            else {
              let splitedKey = filterKey.split("_");
              if (splitedKey[0] === "id") {
                splitedKey[0] = "_id";
              }

              if (splitedKey[1] === "has") {
                queryMap[splitedKey[0]] = new RegExp(filter[filterKey], "i");
              }
              else if (splitedKey[1]) {
                queryMap[splitedKey[0]] = {};
                queryMap[splitedKey[0]][`$${splitedKey[1]}`] = filter[filterKey];
              }
              else {
                queryMap[splitedKey[0]] = filter[filterKey];
              }
            }
          });

          // map sort by key
          let sortMap: any = {};
          if (sort) {
            const splitedKey = sort.split("_");
            sortMap[splitedKey[0]] = splitedKey[1];
          }

          console.log(queryMap);

          const data = await model.find(queryMap).populate(gqlOption && gqlOption.Populate).skip(page * limit).limit(limit).sort(sortMap);
          resolve({
            data: data,
            page: page,
            total: data.length
          });
        } catch (error) {
          reject(error);
        }
      });
    };

    this.modelToReturnTypeDefinition(model.modelName);
    this.typeQueryDefs += `\t${convertCapAndAddPlural(model.modelName)}(page: Int, limit: Int, filter: ${convertCapAndRemovePlural(model.modelName)}Query, sort: ${convertCapAndRemovePlural(model.modelName)}SortKey): ${convertCapAndRemovePlural(model.modelName)}ReturnType!\n`;
  }

  private mutationToReturnTypeDefinition = (mutationName: string) => {
    let returnTypeDef = `\ntype ${convertFirstUppercase(mutationName)}ReturnType {\n`;
    returnTypeDef += "\tdone: JSON\n";
    returnTypeDef += "\terror: JSON\n";
    returnTypeDef += "}\n";
    this.typeDefs += returnTypeDef;
  }

  private modelToReturnTypeDefinition = (modelName: string) => {
    let returnTypeDef = `\ntype ${convertCapAndRemovePlural(modelName)}ReturnType {\n`;
    returnTypeDef += `\tdata: [${convertCapAndRemovePlural(modelName)}]\n`;
    returnTypeDef += "\tpage: Int\n";
    returnTypeDef += "\ttotal: Int\n";
    returnTypeDef += "}\n";
    this.typeDefs += returnTypeDef;
  }

  public async generate(modelFolderPath: string, mutationFolderPath?: string, customResolvers?: any, customTypeDefs?: string) {
    this.logger.debug("GQL autogenerater - start");
    const modelPathList: string[] = await this.readModelList(path.join(process.cwd(), modelFolderPath));

    modelPathList.forEach((modelPath: any) => {
      const imported = require(path.resolve(modelPath));
      const model: Model<any> = imported.default;
      const gqlOption: IgqlOption = imported.gqlOption ? imported.gqlOption : {};
      const errors = virtualsValidate(model)
      if (errors.length > 0) {
        this.logger.error("error!! => ", errors)
      }
      this.modelToTypeDefinition(model, gqlOption);
      this.modelToQueryDefinition(model);
      this.modelToSortKeyDefinition(model);
      this.modelToDefaultQuery(model);
      this.modelToGetALLQuery(model, gqlOption);
    });

    this.typeQueryDefs += "} \n";
    this.typeDefs += this.typeQueryDefs;

    if (mutationFolderPath) {
      this.resolvers.Mutation = {};
      const mutationPathList: string[] = await this.readMutationList(path.join(process.cwd(), mutationFolderPath));
      await Promise.all(mutationPathList.map(async (mutationPath: any) => {
        const Mutation = require(path.resolve(mutationPath)).default;
        const mutation = new Mutation();

        await this.mutationToInputDefinition(mutation, "inputType");
        this.mutationToReturnTypeDefinition(mutation.mutationName);
        this.typeMutationDefs += `\t${convertFirstLowercase(mutation.mutationName)}(input: ${convertFirstUppercase(mutation.mutationName)}InputType!): ${convertFirstUppercase(mutation.mutationName)}ReturnType\n`;
        this.resolvers.Mutation[convertFirstLowercase(mutation.mutationName)] = mutation.resolver;
      }));
      this.typeMutationDefs += "} \n";

      this.typeDefs += this.typeMutationDefs;
    }

    this.logger.debug("GQL autogenerater - complete");

    return this.converted(customResolvers, customTypeDefs);
  }
}

export default MongoToGQL;

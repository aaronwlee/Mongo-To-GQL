# Mongo-To-GQL
<a href="https://github.com/aaronwlee/Mongo-To-GQL/blob/master/LICENSE.md"><img alt="GitHub license" src="https://img.shields.io/github/license/aaronwlee/Mongo-To-GQL"></a>

Auto-generator for the MongoDB model to GraphQL type definition and query resolvers.
Just write your mongoose model code, then I generate gql code for you!


*** *New Stable Version!! 2.2.x ***
* embedded many supported
* embedded search implemented
* customizable apollo server options supported
* customizable resolvers and typeDefs options supported
* file upload support via Upload

## Installing
```
$ npm i mongo-to-gql
```
Or
```
$ yarn add mongo-to-gql
```

# Getting Started
Mongo model basic

* just write your basic mongoose model with `gqlOption`
ex) src/model/user.model.ts
```ts
type UserDocument = Document & {
  email: string;
  age: number;
  name: string;
  password: string;
  picture: string[];
  follower: string[];
  product: string;
};

const schema: Schema<UserDocument> = new mongoose.Schema<UserDocument>({
  email: { type: String, unique: true },
  age: Number,
  name: { type: String, required: true },
  password: String,
  picture: [String],
  follower: [{ type: Schema.Types.ObjectId, ref: 'User' }],   // has many => this field will have `User` type which is from `ref`
  product: { type: Schema.Types.ObjectId }                    // has one without ref => this field will be `ID` type if there is no Populate options.
}, {                                                          // if the Populate options have `path` and `model` param, it will be `JSON` type.
  timestamps: true,
  // virtual requirements
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// JSON type
schema.virtual("fullName").get(function () {
  return ({
    name: this.name,
    email: this.email
  })
})

// JSON type
schema.virtual("extra").get(async function () {
  const users = await this.model("User").findOne({ name: "Aaron" })
  return users
})

// if you use has many or has one, you must export this option with exact name of const 
export const gqlOption: IgqlOption = {
  // if you didn't declare `ref` in the schema, you have to specify the target model.
  Populate: [{ path: "product", model: Product, select: "name" }, { path: "follower" }]     
}

export default mongoose.model<UserDocument>("User", schema);
```

After using our mongo-to-gql, you'll get auto-generated this queries and gql definitions
```ts
query getUsers {
  Users(page: 0, limit: 4, filter: {name_has: "a", email_in: ["mongo@gql.com", "gql@mongo.com"]}, sort: updatedAt_asc) {
    data {
      _id
      name
      email
      fullName
      follower {
        name
      }
      product         // This field is JSON type because of the schema that does not have "ref".
    }
    page
    total
  }
}

query UserByID {
  User(_id: "5dc8aa758ac3cd40e7ea0c7f") {
    name
    email
    follower {
      name
    }
  }
}
```

Result
```json
// query getUsers
{
  "data": {
    "Users": {
      "data": [
        {
          "name": "aaron",
          "_id": "5dc8aa758ac3cd40e7ea0c7f",
          "email": "mongo@gql.com",
          "fullName": "aaron mongo@gql.com",
          "follower": [
            {
              "name": "Aaron Wooseok Lee"
            }
          ],
          "product": {
            "_id": "5dda18db51cf6d338ac7822e",
            "name": "This is a product",
            "field1": "test field",
          }
        },
        {
          "name": "ace",
          "_id": "5dc8aa7e34b45241582cbd52",
          "email": "gql@mongo.com",
          "follower": [
            {
              "name": "Eric"
            },
            {
              "name": "aaron"
            }
          ],
          "product": {
            "_id": "5dda18db51cf6d338ac7822e",
            "name": "This is a product",
            "field1": "test field",
          }
        }
      ],
      "page": 0,
      "total": 2
    }
  }
}

// query UserByID
{
  "data": {
    "User": {
      "name": "aaron",
      "email": "mongo@gql.com",
      "follower": [
        {
          "name": "Aaron Wooseok Lee"
        }
      ],
    }
  }
}
```

## Methods

<br>

### Let's start it!

```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from "express";

const app = express();
// or
executeApolloServer({
    app: app,
    modelFolderPath: 'dist/model',
    mutationFolderPath: 'dist/mutation',
    path: "/myRouter",
}).then(result => {
  console.log(result.pureTypeDefs)  // display result
})
```

### options for the `executeApolloServer({})`

```ts
const options: ImongoToGQLOptions = {
  app: app,
  modelFolderPath: 'dist/model',
  
  // optional
  mutationFolderPath: 'dist/mutation',
  path: '/thisisnotdefaultpath',
  logger: logger,        // winston logger,
  apolloOptions: {...},  //https://www.apollographql.com/docs/apollo-server/api/apollo-server/
  customTypeDefs: `
  type Custom {
    something: String
  }
  `
  customResolvers: {
    Query: {
        asd: () => {
            console.log("hi")
        }
    },
    Mutation: {...}
    File: "Somthing"
  }
}
```
- `app` is your express app
- `modelFolderPath` should be your pure js model folder which is starting with `pwd` path
- `mutationFolderPath` should be your pure js mutation folder which is starting with `pwd` path
- `path` is for graphql path config, default router is `/graphql`
- `logger` is your customizable logger config, this logger is basically using winstonjs
- `apolloOptions` this option for ApolloServer's param
- `customResolvers` is for the extra resolvers
- `customTypeDefs` is for the extra typeDefs, but it must be string

### Promise results

```ts
executeApolloServer(options)
```
- Initializing, building and connect apollo server with MongoToGQLOptions
- After your express server executed, apollo server will start with `/graphql` router or your path config

```ts
interface IresultType {
  converted: {
    typeDefs: any,
    resolvers: any
  },
  pureTypeDefs: string,
  pureResolvers: any
}
```
- this interface is the promise results of `executeApolloServer`

<br>
<br>

## Examples

Mongo model with mongoosejs

<br>

### Model sample (in model folder)
> **Path** - src/model/user.model.ts
- exporting the `model` as a default is mandatory!
- `gqlOption` is for joining the foreign table, without this the queries will return the just _ids

Just write your mongoose model code, then I generate gql code for you!

```ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { IgqlOption } from 'mongo-to-gql'

const schema: Schema = new mongoose.Schema({
  email: { type: String, unique: true },
  age: Number,
  name: { type: String, required: true },
  password: String,
  picture: [String],
  geolocation: {
    latitude: Number,                                         // embaded many => this will be field JSON type
    longitude: Number 
  }
  follower: [{ type: Schema.Types.ObjectId, ref: 'User' }],   // has many => this field will have `User` type which is from `ref`
  product: { type: Schema.Types.ObjectId }                    // has one without ref => this field will be `ID` type if there is no Populate options.
}, {                                                          // if the Populate options have `path` and `model` param, it will be `JSON` type.
  timestamps: true,
  // virtual requirements
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// JSON type
schema.virtual("fullName").get(function () {
  return ({
    name: this.name,
    email: this.email
  })
})

// JSON type
schema.virtual("extra").get(async function () {
  const users = await this.model("User").findOne({ name: "Aaron" })
  return users
})

// if you use has many or has one, you must export this option with exact name of const 
export const gqlOption: IgqlOption = {
  // if you didn't declare `ref` in the schema, you have to specify the target model.
  Populate: [{ path: "product", model: Product, select: "name" }, { path: "follower" }]     
}

export default mongoose.model("User", schema);
```
<br>
<br>

model auto-generate results will be
<br>

| `params` | Description      |
|-------------|----------------|
| page    | Pagination                                                                                                                                              |
| limit   | page per                                                                                                                                                |
| filter  | each field name with in (array values are in data), has (regex), ne (array values are not in data); basic field name like `name` for finding exact data |
| filter field `JSON` | This field only able to filtering exact same JSON structure |
| filter `subSearch` | you can search the Embedded structure with a JSON string ex) `subSearch: "{'geolocation.latitude': 12.3}"` |
| sort    | each field name with asc or desc, but you can't get sortkey from JSON type                                                                              |

| `result` | Description                                                                                    |
|--------------|------------------------------------------------------------------------------------------|
| data  | result data object                                                                             |
| page  | current page                                                                                    |
| total | result data count                                                                               |
```ts
query getUsers {
  Users(page: 0, limit: 4, filter: {name_has: "a", email_in: ["mongo@gql.com", "gql@mongo.com"], subSearch: "{'geolocation.latitude': 12.3}"}, sort: updatedAt_asc) {
    data {
      _id
      name
      email
      follower {
        name
      }
      product         // This field is JSON type because of the schema that does not have "ref".
    }
    page
    total
  }
}

query UserByID {
  User(_id: "5dc8aa758ac3cd40e7ea0c7f") {
    name
    email
    follower {
        name
      }
    product         // This field is JSON type because of the schema that does not have "ref".
  }
}
```
<br>
<br>

### Mutation sample (in mutation folder)
> **Path** - src/mutation/addUser.ts
- `mutationName`, `inputType` and `resolver` are mandatory! Try to use `Imutation` interface, it'll be easier.
- Your mutation function name will save as starting with a lowercase.   
- Make this sure all extra input types must be declared! ex) ProductInputType
- The resolver should be an async method, but it's doesn't matter.

```ts
import crypto from 'crypto';
import User from "../model/user.model";
import { Imutation, graphType, IreturnType } from 'mongo-to-gql'
import Product from '../model/product.model';

class AddUser implements Imutation {
    mutationName: string = "AddUser"

    public inputType = {
        name: graphType.String,
        email: graphType.StringRequire,
        address: graphType.JSON,
        password: graphType.String,
        follower: graphType.ID,
        someJson: graphType.Json,             // json type param
        product: graphType.CustomRequire("CustomProductInputType") // this will automatically try to find this name of this element in your class
    }

    public CustomProductInputType = {       // automation target 
        name: graphType.String
    }

    // this must be returned as Promise<ReturnType>
    public resolver = (_: any, { input }: any): Promise<IreturnType> => {
        return new Promise(async (resolve, reject) => {
            try {
                const UserModel = new User().model;
                const ProductModel = new Product().model;
                const foundUser = await UserModel.findOne({ _id: input.follower })
                const newProduct = await ProductModel.create({ name: input.product.name })
                const result = await UserModel.create({
                    name: input.name,
                    address: input.address,
                    email: input.email,
                    // hash it before!
                    password: input.password,
                    picture: getAvatar(input.email),
                    follower: [foundUser],
                    thisisProducts: newProduct
                })
                resolve({
                    done: result,
                    error: null
                })
            } catch (error) {
                if (error.code === 11000) {
                    resolve({ done: false, error: "email already used" })
                }
                else {
                    resolve({ done: false, error: `${error} : bad happend while we are saving user data` })
                }
            }
        })
    }
}

const getAvatar = (Email: string, size: number = 200): string => {
    const md5 = crypto.createHash("md5").update(Email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
}

export default AddUser
```

### resolver return type
```ts
interface IreturnType {
  done?: any;             // JSON type
  error?: any;            // JSON type
}
```

### mutation auto-generate results will be

|`params` | Description   |
|-------------|----------------|
| input    | mutation class's inputType as a gql definition |


| `result` | Description      |
|--------------|------------------|
| done  | anything for a result as JSON      |
| error  | error as a JSON type    |

```ts
mutation AddUser{
	addUser(input: {
    name:"Wooseok Lee", 
    email: "aaron.lee@wooseok.com", 
    password: "123",
    address: "somewhere",
    follower: "5dd60a152b451e03159d2ead"
    somejson: {any: "json", types: "available"}
    product: {name: "PerfectOne"}
  }){
    done
    error
  }
}
```


## Authors

* ***Aaron Wooseok Lee*** - *Initial work* - [aaronwlee](https://github.com/aaronwlee)
* ***Eric Xizheng Ding*** - *Origin work* - [dingxizheng](https://github.com/dingxizheng/model_to_graphql)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

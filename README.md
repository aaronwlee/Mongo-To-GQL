# Mongo-To-GQL
<a href="https://github.com/aaronwlee/Mongo-To-GQL/blob/master/LICENSE.md"><img alt="GitHub license" src="https://img.shields.io/github/license/aaronwlee/Mongo-To-GQL"></a>

Auto-generator for the MongoDB model to GraphQL type definition and query resolvers.

*** *New Stable Version!! 2.1.0 ***
Please don't use previous versions.

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

* export const schema and const model in your mongo model file
ex) src/model/user.model.ts
```ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { GraphModel, mongoModel } from 'mongo-to-gql'

type UserDocument = Document & {
    email: string;
    name: string;
};

class User implements GraphModel {
  gqlOption = {
    Populate: ["followers"] // join options for query (field name)
  }

  schema: Schema = new Schema({
    email: { type: String, unique: true },
    name: String,
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }] // self join
  }, { timestamps: true });

  model: Model<UserDocument> = mongoModel(mongoose, "User", this.schema) // this is for remove OverwriteModelError issue
}

export default User;
```

After using our mongo-to-gql, you'll get auto-generated this queries and gql definitions
```ts
query getUsers {
  Users(page: 0, limit: 4, filter: {name_has: "a", email_in: ["mongo@gql.com", "gql@mongo.com"]}, sort: updatedAt_asc) {
    data {
      _id
      name
      email
    }
    page
    total
  }
}

query UserByID {
  User(_id: "5dc8aa758ac3cd40e7ea0c7f") {
    name
    email
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
          "email": "mongo@gql.com"
        },
        {
          "name": "ace",
          "_id": "5dc8aa7e34b45241582cbd52",
          "email": "gql@mongo.com"
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
      "email": "mongo@gql.com"
    }
  }
}
```

## Methods

<br>

### Let's start it!

```ts
const options: MongoToGQLOptions = {
    app: app,
    modelFolderPath: 'dist/model',
    
    // optional
    mutationFolderPath: 'dist/mutation',
    path: '/thisisnotdefaultpath',
    logger: logger // winston logger
}
```
- `app` is your express app
- `modelFolderPath` should be your pure js model folder which is starting with `pwd` path
- `mutationFolderPath` should be your pure js mutation folder which is starting with `pwd` path
- `path` is for graphql path config, default router is `/graphql`
- `logger` is your customizable logger config, this logger is basically using winstonjs

```ts
executeApolloServer(options)
```
- Initializing, building and connect apollo server with MongoToGQLOptions
- After your express server executed, apollo server will start with `/graphql` router or your path config


### will be deprecated


```ts
MongoToGQL(<Optional winston logger?>)
``` 
- Initialize library (before generate)

```ts
mongoToGQL.generate('dist/model', 'dist/mutation')
``` 
- Method for auto generate and it's a asynchronous method. It resolves `converted()` data. 

```ts
const gqlServer = new ApolloServer(mongoToGQL.converted())
```
- Initialize your GQL server with apollo. `converted()` method will join the typeDefs and resolvers as an object.

```ts
const gqlServer = new ApolloServer({typeDefs: mongoToGQL.typeDefs, resolvers: mongoToGQL.resolvers})
```
- Alternatively
- `mongoToGQL.typeDefs` is a public method, so you can using it to lookup GQL definition data
- `mongoToGQL.resolvers`  Also, It is a public method. 

```ts
gqlServer.applyMiddleware({ app });
```
- Apply into your express app! 
- After your express server executed, apollo server will make a router in your `/graphql`


## How to Initialize

`New!`
```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from "express";

const app = express();

const options: MongoToGQLOptions = {
    app: app,
    modelFolderPath: 'dist/model',
    mutationFolderPath: 'dist/mutation'
}
executeApolloServer(options)
// or
executeApolloServer({
    app: app,
    modelFolderPath: 'dist/model',
    mutationFolderPath: 'dist/mutation'
})

```

`Old-1!`
```ts
const mongoToGql = MongoToGQL()
mongoToGql.generate('dist/model', 'dist/mutation')
  .then(converted => {
    const gqlServer = new ApolloServer(converted);
    // or
    const gqlServer = new ApolloServer(mongoToGql.converted()); 
    // or
    const gqlServer = new ApolloServer({ typeDefs: mongoToGql.typeDefs, resolvers: mongoToGql.resolvers });

    gqlServer.applyMiddleware({ app });
  })
  .catch(error => {
      console.error("GQL converting error!\n", error)
      process.exit(1);
  })
```

`Old-2!`
```ts
import MongoToGQL from 'mongo-to-gql';
import express from "express";
import { ApolloServer } from 'apollo-server-express';

const app = express();

MongoToGQL().generate('dist/model', 'dist/mutation')
  .then(convered => {
    new ApolloServer(converted).applyMiddleware({ app });
  })
  .catch (error => {
    console.error("GQL converting error!\n", error);
    process.exit(1);
  })
```

<br>
<br>

## Examples

Mongo model with mongoosejs

<br>

### Mutation sample (in mutation folder)
> **Path** - src/model/user.model.ts
- `schema` and `model` are mandatory! Try to use `GraphModel` interface, it'll be easier.
- `gqlOption` is for joining the foreign table, without this the queries will return the just _ids
- `mongoModel` is for solving `OverwriteModelError` issue, recommand to use it

```ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { GraphModel, mongoModel } from 'mongo-to-gql'

type UserDocument = Document & {
    email: string;
    age: number;
    name: string;
    password: string;
    follower: Schema.Types.ObjectId;
    thisisProducts: Schema.Types.ObjectId;
};

class User implements GraphModel {
    // this is optional for joining table when do the queries
    gqlOption = {
        Populate: ["follower", "thisisProducts"]
    }

    // name must be schema
    schema: any = new Schema({
        email: { type: String, unique: true },
        age: { type: Number },
        name: { type: String, required: true },
        password: String,
        follower: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        thisisProducts: { type: Schema.Types.ObjectId, ref: "Product" }     // foreign model 
    }, { timestamps: true });

    // name must be model
    model: Model<UserDocument> = mongoModel(mongoose, "User", this.schema) // this is for remove OverwriteModelError issue
}

export default User
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
| sort    | each field name with asc or desc                                                                                                                        |

| `result` | Description                                                                                    |
|--------------|------------------------------------------------------------------------------------------|
| data  | result data object                                                                             |
| page  | current page                                                                                    |
| total | result data count                                                                               |
```ts
query getUsers {
  Users(page: 0, limit: 4, filter: {name_has: "a", email_in: ["mongo@gql.com", "gql@mongo.com"]}, sort: updatedAt_asc) {
    data {
      _id
      name
      email
    }
    page
    total
  }
}

query UserByID {
  User(_id: "5dc8aa758ac3cd40e7ea0c7f") {
    name
    email
  }
}
```
<br>
<br>

### Mutation sample (in mutation folder)
> **Path** - src/mutation/addUser.ts
- `mutationName`, `inputType` and `resolver` are mandatory! Try to use `Mutation` interface, it'll be easier.
- Your mutation function name will save as starting with a lowercase.   
- Make this sure all extra input types must be declared! ex) ProductInputType
- The resolver should be an async method, but it's doesn't matter.

```ts
import crypto from 'crypto';
import User from "../model/user.model";
import { Mutation, graphType, ReturnType } from 'mongo-to-gql'
import Product from '../model/product.model';

class AddUser implements Mutation {
    mutationName: string = "AddUser"

    public inputType = {
        name: graphType.String,
        email: graphType.StringRequire,
        address: graphType.StringRequire,
        password: graphType.String,
        follower: graphType.ID,
        product: graphType.CustomRequire("CustomProductInputType")
    }

    public CustomProductInputType = {
        name: graphType.String
    }

    // this must be returned as Promise<ReturnType>
    public resolver = (_: any, { input }: any): Promise<ReturnType> => {
        return new Promise(async (resolve, reject) => {
            try {
                const UserModel = new User().model;
                const ProductModel = new Product().model;
                const foundUser = await UserModel.findOne({ _id: input.follower })
                const newProduct = await ProductModel.create({ name: input.product.name })
                await UserModel.create({
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
                    done: true,
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


### mutation auto-generate results will be

|`params` | Description   |
|-------------|----------------|
| input    | mutation class's inputType as a gql definition |


| `result` | Description      |
|--------------|------------------|
| done  | boolean for result      |
| error  | error as a JSON type    |

```ts
mutation AddUser{
	addUser(input: {
    name:"Wooseok Lee", 
    email: "aaron.lee@wooseok.com", 
    password: "123",
    address: "somewhere",
    follower: "5dd60a152b451e03159d2ead"
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

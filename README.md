# Mongo-To-GQL
<a href="https://github.com/aaronwlee/Mongo-To-GQL/blob/master/LICENSE.md"><img alt="GitHub license" src="https://img.shields.io/github/license/aaronwlee/Mongo-To-GQL"></a>

Auto-generator for the MongoDB model to GraphQL type definition and query resolvers.
Just write your mongoose model code, then I generate gql code for you!

*Current* - ***2.3.0*** - *(feat)*: [aaronwlee](https://github.com/aaronwlee)
* enabled the conversion with the list of models and mutations.
* enabled the conversion models and mutations to GQL ready to use `string` and `object`.

***2.2.13*** - *(fix)*: [aaronwlee](https://github.com/aaronwlee)
* subdirectory supporting has updated (bug fix) 
* getting a total query has enhanced (bug fix) 

***2.2.10*** - *(fix)*: [aaronwlee](https://github.com/aaronwlee)
* authentication method for the apollo server has added
* auth boolean option has added into the gqloption
* Now you able to connect with the typescript model and mutation in development mode. Set the 'devWithTs' option and use the nodemon. 

***2.2.7*** - *(feat)*: [aaronwlee](https://github.com/aaronwlee)
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
  Populate: [{ path: "product", model: Product, select: "name" }, { path: "follower" }],
  Auth: true    // authentication option. if the apollo server context option sends an appropriate 'user', this model's GQL query can be accessible.  
}

export default mongoose.model<UserDocument>("User", schema);
```

After using our mongo-to-gql, you'll get auto-generated this queries and gql definitions
```ts
query getUsers {
  Users(
    page: 0, 
    limit: 4, 
    filter: {name_has: "a", email_in: ["mongo@gql.com", "gql@mongo.com"]}, 
    sort: updatedAt_asc
    ) {
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

## Let's start it!
### Start with ApolloServer
* Development mode | start with nodemon your main ts file

```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from 'express';

const app = express();

executeApolloServer({
    app: app,
    devWithTs: true,                // if you're using typescript with nodemon and ts-node.
    modelFolderPath: 'src/model',       // pure .ts path
    mutationFolderPath: 'src/mutation', // pure .ts path
    path: "/myRouter",
}).then(result => {
  console.log(result.pureTypeDefs)  // display result
})
```

* Production Mode - built by Typescript

```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from 'express';

const app = express();

executeApolloServer({
    app: app,
    modelFolderPath: 'dist/model',        // built .js path
    mutationFolderPath: 'dist/mutation',  // built .js path
    path: "/myRouter",
}).then(result => {
  console.log(result.pureTypeDefs)  // display result
})
```

* Production Mode - built by Webpack

```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from 'express';
import * as User from './model/user';             // this is important to import an entire module's contents
import * as addUser from './mutation/addUser';    // more info - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

const app = express();

executeApolloServer({
    app: app,
    modelList: {
      User
    },
    mutationList: {
      addUser
    }
    path: "/myRouter",
}).then(result => {
  console.log(result.pureTypeDefs)  // display result
})
```

<br />

### Start with only Converting

* Development mode | start with nodemon your main ts file

```ts
import { convertToGQL } from 'mongo-to-gql';
import express from 'express';

const app = express();

convertToGQL({
    devWithTs: true,                // if you're using typescript with nodemon and ts-node.
    modelFolderPath: 'src/model',       // pure .ts path
    mutationFolderPath: 'src/mutation', // pure .ts path
}).then(result => {
  console.log(result.converted)  // use it to init your gql server
})
```

* Production Mode - built by Typescript

```ts
import { convertToGQL } from 'mongo-to-gql';
import express from 'express';

const app = express();

convertToGQL({
    modelFolderPath: 'dist/model',        // built .js path
    mutationFolderPath: 'dist/mutation',  // built .js path
}).then(result => {
  console.log(result.converted)  // use it to init your gql server
})
```

* Production Mode - built by Webpack

```ts
import { convertToGQL } from 'mongo-to-gql';
import express from 'express';
import * as User from './model/user';             // this is important to import an entire module's contents
import * as addUser from './mutation/addUser';    // more info - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

const app = express();

convertToGQL({
    modelList: {
      User
    },
    mutationList: {
      addUser
    }
}).then(result => {
  console.log(result.converted)  // use it to init your gql server
})
```

### options for the `executeApolloServer({})`

```ts
const options: ImongoToGQLOptions = {
  app: app,

  // one of these is a must.
  modelFolderPath: 'dist/model',
  modelList: {
    User: userModel
  }
  
  // optional
  devWithTs: true,                  // option for using typescript folder path. for the auto build in development, you must use nodemon.
  mutationFolderPath: 'dist/mutation',  // when you use modelFolderPath only
  mutationList: {                       // when you use modelList only
    addUser
  }
  path: '/thisisnotdefaultpath',
  context: ({ req }: any) => {      // https://www.apollographql.com/docs/apollo-server/security/authentication/
    const user = req.session.user;

    return { user };
  }
  apolloOptions: {                  // https://www.apollographql.com/docs/apollo-server/api/apollo-server/
    cacheControl: {
      defaultMaxAge: 5,
    }
  },  
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
- `modelFolderPath` should be your pure js model folder which is starting with `pwd` path | but if you set `devWithTs` option to true, then you can able to use the ts model folder.
- `modelList` should be a list of your imported models, and it must be an entire module's contents. ex) `import * as` 
- `mutationFolderPath` should be your pure js mutation folder which is starting with `pwd` path | but if you set `devWithTs` option to true, then you can able to use the ts mutation folder.
- `mutationList` should be a list of your imported mutations, and it must be an entire module's contents. ex) `import * as` 
- `devWithTs` this option is enable to use your typescript folder path only for development environment. must use nodemon.
- `path` is for graphql path config, default router is `/graphql`
- `context` is for authenticating your resolvers. you can basically pass the user parameter or token.  
- `apolloOptions` this option for ApolloServer's param
- `customResolvers` is for the extra resolvers
- `customTypeDefs` is for the extra typeDefs, but it must be string

### options for the `convertToGQL({})`

```ts
const options: ImongoToGQLConverterOptions = {
  modelFolderPath: 'dist/model',
  
  // optional
  devWithTs: true,                  // option for using typescript folder path. for the auto build in development, you must use nodemon.
  mutationFolderPath: 'dist/mutation',
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
- `modelFolderPath` should be your pure js model folder which is starting with `pwd` path | but if you set `devWithTs` option to true, then you can able to use the ts model folder.
- `modelList` should be a list of your imported models, and it must be an entire module's contents. ex) `import * as` 
- `mutationFolderPath` should be your pure js mutation folder which is starting with `pwd` path | but if you set `devWithTs` option to true, then you can able to use the ts mutation folder.
- `mutationList` should be a list of your imported mutations, and it must be an entire module's contents. ex) `import * as` 
- `devWithTs` this option is enable to use your typescript folder path only for development environment. must use nodemon.
- `customResolvers` is for the extra resolvers
- `customTypeDefs` is for the extra typeDefs, but it must be string

### Promise results

```ts
executeApolloServer(options)
```
- Initializing, building and connect apollo server with `MongoToGQLOptions`
- After your express server executed, apollo server will start with `/graphql` router or your `path` config

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

<br />

```ts
convertToGQL(options)
```
- it converts your `models` and `mutations` to GQL ready to use `string` and `object`.

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
- this interface is the promise results of `convertToGQL`

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
  Populate: [{ path: "product", model: Product, select: "name" }, { path: "follower" }],
  Auth: true     // authentication option. if the apollo server context option sends an appropriate 'user', this model's GQL query can be accessible.
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
- `inputType` and `resolver` are mandatory! Try to use `Imutation` interface, it'll be easier.
- Your mutation function name will save as starting with a lowercase.   
- Make this sure all extra input types must be declared! ex) ProductInputType
- The resolver should be an async method, but it's doesn't matter.

```ts
import crypto from 'crypto';
import User from "../model/user.model";
import { Imutation, graphType, IreturnType } from 'mongo-to-gql'
import Product from '../model/product.model';

// class name is your mutation's name
class AddUser implements Imutation {
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
    public resolver = (_: any, { input }: any, { user }: any): Promise<IreturnType> => {
        return new Promise(async (resolve, reject) => {
            try {
                // if you set the context option and passed an appropriate user, you can validate the authentication via the third parameter of the resolver.
                if(!user) {
                  throw "auth required"
                }
                // 
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
                    error: {}
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
  done: any;             // JSON type
  error: any;            // JSON type
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
* ***Eric Xizheng Ding*** - *Inspiratied* - [dingxizheng](https://github.com/dingxizheng/model_to_graphql)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

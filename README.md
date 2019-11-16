# Mongo-To-GQL
<a href="https://github.com/aaronwlee/Mongo-To-GQL/blob/master/LICENSE.md"><img alt="GitHub license" src="https://img.shields.io/github/license/aaronwlee/Mongo-To-GQL"></a>

Auto-generator for the MongoDB model to GraphQL type definition and query resolvers.

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
type UserDocument = Document & {
    email: string;
    name: string;
};

export const schema: any = new Schema({
    email: { type: String, unique: true },
    name: String,
}, { timestamps: true });

export const model = mongoose.model<UserDocument>("User", schema);
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


|`Methods`                   | Description                                                                                                                                          |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
|`const mongoToGQL = MongoToGQL(<Option Logger>)`     | Initialize library (before generate)                                                                                       |
|`mongoToGQL.generate('dist/model', 'dist/mutation')`| Execute the `mongoToGQL.generate(<modelFolderPath>, <mutationFolderPath>);` method for auto generate and it's a asynchronous method |
|`mongoToGQL.typeDefs`| `mongoToGQL.typeDefs` is a public method, so you can using it to lookup GQL definition data                                                                 |
|`mongoToGQL.resolvers`| Also, `mongoToGQL.resolvers` is a public method.                                                                                                           |
|`const gqlServer = new ApolloServer(mongoToGQL.converted())`| Initialize your GQL server with apollo. `converted()` method will join the typeDefs and resolvers as an object.     |
|`const gqlServer = new ApolloServer({typeDefs: mongoToGQL.typeDefs, resolvers: mongoToGQL.resolvers})` | Alternatively                                                              |
|`gqlServer.applyMiddleware({ app });`| Apply into your express app! After your express server executed, apollo server will make a router in your `/graphql`                        |

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
`New!`
```ts
import { executeApolloServer } from 'mongo-to-gql';
import express from "express";

const app = express();

executeApolloServer(app, 'dist/model', 'dist/mutation');
```
`Old!`
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

<br>
<br>

## Examples

Mongo model with mongoosejs

<br>
<br>

`src/model/user.model.ts`
* schema and model are mandatory
```ts
import mongoose, { Schema, Document } from "mongoose";

type UserDocument = Document & {
    email: string;
    name: string;
    password: string;
    address: string;
    picture: string[];
    products: string[];
    test: string;
};

export const gqlOption = {
    Populate: ["products", "test"]
}

export const schema: any = new Schema({
    email: { type: String, unique: true },
    name: String,
    password: String,
    address: String,
    picture: String,
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    test: { type: Schema.Types.ObjectId, ref: "Test" }
}, { timestamps: true }); 

export const model = mongoose.model<UserDocument>("User", schema);

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

|mutation sample (in mutation folder) src/mutation/addUser.ts                                                           |
|-----------------------------------------------------------------------------------------------------------------------|
| `mutationName`, `inputType` and `resolver` are mandatory! Try to use `Mutation` interface, it'll be easier.           |
| Your mutation function name will save as starting with a lowercase.                                                   |
| Make this sure all extra input types must be declared! ex) ProductInputType                                           |
| The resolver should be an async method, but it's doesn't matter.                                                      |
```ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as User from "../model/user.model";
import * as Product from "../model/product.model";
import * as Test from "../model/test.model";
import { Mutation, GQLt } from 'mongo-to-gql'

class ReturnType {
    done: boolean = false;
    error: any;
}
class AddUser implements Mutation {
    mutationName: string = "AddUser"

    public inputType = {
        name: GQLt.String,      // same as "String"
        email: GQLt.String,
        address: GQLt.String,
        password: GQLt.String,
        product: GQLt.CustomArray("ProductInputType"),      // same as "[ProductInputType]"
        test: GQLt.Custom("TestInputType")
    }

    public ProductInputType = {
        name: GQLt.String,
        detail: GQLt.String
    }

    public TestInputType = {
        text: GQLt.String
    }

    public resolver = (_: any, { input }: any): Promise<ReturnType> => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(input.password, 10, async function (err, hash) {
                try {
                    if (err) {
                        resolve({ done: false, error: "bycrypt error" })
                    }
                    // Store hash in your password DB.
                    const newProduct = await Product.model.create(input.product)
                    const newTest = await Test.model.create(input.test)
                    await User.model.create({
                        name: input.name,
                        address: input.address,
                        email: input.email,
                        password: hash,
                        picture: getAvatar(input.email),
                        products: newProduct,
                        test: newTest
                    })
                    resolve({
                        done: true,
                        error: null
                    })
                } catch (error) {
                    if (error.code === 11000) {
                        resolve({ done: false, error: 'email already used' });
                    }
                    else {
                        resolve({ done: false, error: `${error} : bad happend while we are saving user data`'email already used' });
                    }
                }

            });
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
        name:"aaron", 
        email: "aaron@aaron.com", 
        password: "thisispassword", 
        product: [
            { name: "starseed", detail: "this is good!" },
            { name: "Good seed", detail: "You'll love it!" }
        ]
    }) {
        done
        error
    }
}
```


## Authors

* ***Eric Xizheng Ding*** - *Origin work* - [dingxizheng](https://github.com/dingxizheng/model_to_graphql)
* ***Aaron Wooseok Lee*** - *Initial work* - [aaronwlee](https://github.com/aaronwlee)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

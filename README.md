# Mongo-To-GQL
https://img.shields.io/github/license/aaronwlee/Mongo-To-GQL
Auto-generator for the MongoDB model to GraphQL type definition and query resolvers.

## Getting Started
Mongo model basic
* export const schema and export const model must implemented!
```js
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

After model to gql
```js
query getUsers {
  Users(page: 0, limit: 4, filter: {name_has: "j", email_in: ["jisu@asd.com", "wooseok"]}, sort: updatedAt_asc) {
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
```js
// query getUsers
{
  "data": {
    "Users": {
      "data": [
        {
          "name": "jisu",
          "_id": "5dc8aa758ac3cd40e7ea0c7f",
          "email": "wooseok"
        },
        {
          "name": "jisu",
          "_id": "5dc8aa7e34b45241582cbd52",
          "email": "jisu@asd.com"
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
      "name": "jisu",
      "email": "wooseok"
    }
  }
}
```

### Prerequisites

This module based on Express, apollo-server and MongoDB with Mongoosejs

```js
"apollo-server": "^2.9.7",
"apollo-server-express": "^2.9.7",
"express": "^4.17.1",
"glob": "^7.1.6",
"graphql": "^14.5.8",
"winston": "^3.2.1"
```

### Installing

```
$ npm i mongo-to-gql
```

Or

```
$ yarn add mongo-to-gql
```

## Running the tests

Mongo model with mongoosejs

user.ts in src/model
```js
import mongoose, { Schema, Document } from "mongoose";
import * as Product from './Product';

type UserDocument = Document & {
    email: string;
    name: string;
    password: string;
    address: string;
    picture: string[];
    product: string[];
};

export const gqlOption = {
    Populate: ["product", "test"]
}

export const schema: any = new Schema({
    email: { type: String, unique: true },
    smaple: { type: Number },
    today: { type: Date, default: Date.now },
    name: String,
    password: String,
    address: String,
    picture: String,
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    test: { type: Schema.Types.ObjectId, ref: "Test" }
}, { timestamps: true });

export const model = mongoose.model<UserDocument>("User", schema);

```


and after mongo connection in app.ts
```js
import mongoose from 'mongoose';
import { ApolloServer } from 'apollo-server-express';
import MongoToGQL from 'mongo-to-gql'

const connectWithRetry = (mongoUrl: string) => {
    return mongoose.connect(mongoUrl, mongoOptions, function (err) {
        if (err) {
            console.log("MongoDB connection error. - retrying in 5 sec", err);
            setTimeout(connectWithRetry, 5000);
        }
        else {
            console.error("MongoDB successfully connected");
        }
    });
};

connectWithRetry(MONGODB_URI).then(async () => {
    try {
        const mongoToGQL = new MongoToGQL();
        await mongoToGQL.generate(`${__dirname}/model`);

        // you can see the results from this console.log
        // console.log("GQL converting start =>> ", mongoToGQL.typeDefs, "\n<<= GQL converting done")

        const gqlServer = new ApolloServer(mongoToGQL.converted());

        gqlServer.applyMiddleware({ app });
    } catch (error) {
        console.error("GQL converting error!\n", error)
        process.exit(1);
    }
})
```


## Authors

* ***Aaron Wooseok Lee*** - *Initial work* - [aaronwlee](https://github.com/aaronwlee)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

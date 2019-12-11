import { executeApolloServer } from '../src';
import express from 'express'

const resultTypeDefs = `
scalar Date
scalar JSON


type User {
	username: String
	email: String
	firstName: String
	lastName: String
	bio: String
	currency: String
	img: [String]
	user: [User]
	following: [User]
	followers: [User]
	_id: ID
	updatedAt: Date
	createdAt: Date
}

input UserQuery {
	username: String
	username_ne: String
	username_in: [String!]
	username_has: String
	email: String
	email_ne: String
	email_in: [String!]
	email_has: String
	firstName: String
	firstName_ne: String
	firstName_in: [String!]
	firstName_has: String
	lastName: String
	lastName_ne: String
	lastName_in: [String!]
	lastName_has: String
	bio: String
	bio_ne: String
	bio_in: [String!]
	bio_has: String
	currency: String
	currency_ne: String
	currency_in: [String!]
	currency_has: String
	img: String
	img_ne: String
	img_in: [String!]
	img_has: String
	user: String
	user_ne: String
	user_in: [String!]
	user_has: String
	following: String
	following_ne: String
	following_in: [String!]
	following_has: String
	followers: String
	followers_ne: String
	followers_in: [String!]
	followers_has: String
	_id: String
	_id_ne: String
	_id_in: [String!]
	_id_has: String
	updatedAt_gt: Date
	updatedAt_gte: Date
	updatedAt_lt: Date
	updatedAt_lte: Date
	createdAt_gt: Date
	createdAt_gte: Date
	createdAt_lt: Date
	createdAt_lte: Date
	subSearch: JSON
}

enum UserSortKey {
	username_asc
	username_desc
	email_asc
	email_desc
	firstName_asc
	firstName_desc
	lastName_asc
	lastName_desc
	bio_asc
	bio_desc
	currency_asc
	currency_desc
	img_asc
	img_desc
	user_asc
	user_desc
	following_asc
	following_desc
	followers_asc
	followers_desc
	updatedAt_asc
	updatedAt_desc
	createdAt_asc
	createdAt_desc
}

type UserReturnType {
	data: [User!]
	page: Int
	total: Int
}

type Query {
	User(_id: ID!): User!
	Users(page: Int, limit: Int, filter: UserQuery, sort: UserSortKey): UserReturnType!
} \n`

test('type definitions test', async () => {
  const app = express();
  const result = await executeApolloServer({
    app: app,
    devWithTs: true,
    modelFolderPath: 'sample/model'
  })
  expect(result.pureTypeDefs).toBe(resultTypeDefs)
})
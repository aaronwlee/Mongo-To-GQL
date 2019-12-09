import mongoose, { Schema } from "mongoose";
import { IgqlOption } from "../../src";

const UserSchema: Schema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  firstName: String,
  lastName: String,
  bio: String,
  currency: String,
  img: [String],
  user: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

export const gqlOption: IgqlOption = {
  Populate: ["user", "following", "followers", "posts", "likes", "comments", "rooms"],
  Auth: true
};

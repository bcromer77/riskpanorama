// models/Organisation.ts
import { Schema, Document, Types } from "mongoose";

export interface IOrganisation extends Document {
  name: string;
  country: string;
  users: Types.ObjectId[];
  documentCount: number;
  inviteToken: string;
  rolePermissions: Record<string, string[]>;
}

export const OrganisationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  documentCount: { type: Number, default: 0 },
  inviteToken: { type: String, unique: true, sparse: true }, 
  rolePermissions: { type: Object, default: {} },
});

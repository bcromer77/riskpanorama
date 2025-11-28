// models/ApiKey.ts

// NOTE: We only import the Schema essentials, not 'model'
import { Schema, Document, Types } from "mongoose";

// 1. Interface Definition (REQUIRED export)
export interface IApiKey extends Document { 
    key: string;
    organisationId: Types.ObjectId;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
}

// 2. Schema Definition (REQUIRED export)
export const ApiKeySchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    organisationId: {
        type: Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
});

// 3. Model Placeholder (CRITICAL FIX: Prevents compiler crash)
// We set the export to 'null' to prevent the Next.js compiler from trying 
// to read 'mongoose.models.ApiKey' during static analysis.
// The actual model registration logic is safely handled inside your getModel utility.
export const ApiKey = null;

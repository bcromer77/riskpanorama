// models/Token.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IToken extends Document {
    userId: Types.ObjectId;
    token: string;
    type: 'emailVerification' | 'passwordReset';
    createdAt: Date;
    expiresAt: Date;
}

const TokenSchema: Schema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    token: { 
        type: String, 
        required: true, 
        unique: true 
    },
    type: { 
        type: String, 
        enum: ['emailVerification', 'passwordReset'], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: { expires: '1h' } // MongoDB TTL index to auto-expire tokens after 1 hour
    },
    expiresAt: {
        type: Date,
        required: true,
    }
});

// We compile this model inside models/index.ts alongside User/Organisation, 
// but define the schema here:
export const TokenModel = (mongoose.models.Token as Model<IToken>) || mongoose.model<IToken>('Token', TokenSchema);

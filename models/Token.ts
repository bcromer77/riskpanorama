// models/Token.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IToken extends Document {
    userId: Types.ObjectId;
    token: string;
    // UPDATED: Added organisationInvite type
    type: 'emailVerification' | 'passwordReset' | 'organisationInvite'; 
    
    // NEW: Target Organisation ID (Required for EPIC 1.2 Invites)
    organisationId?: Types.ObjectId; 
    
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
        // UPDATED: Added 'organisationInvite'
        enum: ['emailVerification', 'passwordReset', 'organisationInvite'], 
        required: true 
    },
    // NEW: Linked to the Organisation being invited to (Conditional requirement)
    organisationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organisation',
        required: function(this: IToken) {
            // organisationId is ONLY required if the token type is 'organisationInvite'
            return this.type === 'organisationInvite'; 
        },
        sparse: true, // Allows null/missing values if not an invite token
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
// but define the schema here for export:
export const TokenModel = (mongoose.models.Token as Model<IToken>) || mongoose.model<IToken>('Token', TokenSchema);

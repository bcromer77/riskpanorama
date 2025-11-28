// models/index.ts

import { Db } from 'mongodb';
import mongoose from 'mongoose';
import { User, UserSchema, IUser } from './User';
import { Organisation, OrganisationSchema, IOrganisation } from './Organisation';
import { ApiKey, ApiKeySchema, IApiKey } from './ApiKey';

// Define a map for models to be initialized
const schemaMap = {
    User: { schema: UserSchema, model: User },
    Organisation: { schema: OrganisationSchema, model: Organisation },
    ApiKey: { schema: ApiKeySchema, model: ApiKey },
};

/**
 * Initializes Mongoose models against the provided MongoDB native Db instance.
 * This is used in transaction-based route handlers like signup/route.ts.
 * @param dbIdentity - The MongoDB native Db instance.
 * @returns An object containing the initialized Mongoose models.
 */
export const initializeIdentityModels = (dbIdentity: Db) => {
    // 1. Get the current active connection used by the identity DB
    const connection = mongoose.connections.find(conn => conn.name === dbIdentity.databaseName);
    
    // Fallback/safety check
    if (!connection) {
        throw new Error(`Mongoose connection not found for database: ${dbIdentity.databaseName}`);
    }

    const models: any = {};

    for (const [name, { schema }] of Object.entries(schemaMap)) {
        // Use the connection's model cache to check existence, preventing redefine errors
        if (!connection.models[name]) {
            // If the model does not exist on this specific connection, define it
            models[name] = connection.model(name, schema as any);
        } else {
            // If the model exists, use the existing one
            models[name] = connection.models[name];
        }
    }

    return models as { User: typeof User, Organisation: typeof Organisation, ApiKey: typeof ApiKey };
};

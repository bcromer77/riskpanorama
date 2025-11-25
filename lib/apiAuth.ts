import { NextResponse } from 'next/server';
import { getDatabases } from './mongodb';
import { initializeIdentityModels } from '@/models/index';
import crypto from 'crypto';
import { Model } from 'mongoose';
import { IApiKey } from '@/models/ApiKey'; // Import interface for strong typing
import { ObjectId } from 'mongodb';

// Define the API Key Validation result type
interface ApiKeyValidationResult {
    isValid: boolean;
    organisationId: string | null;
    keyId: string | null;
    error?: string;
}

/**
 * CORE AUTHENTICATION MIDDLEWARE for API Key Bearer Tokens.
 * This checks the provided key against the hashed store in MongoDB.
 * @param request The incoming NextRequest object.
 * @returns ApiKeyValidationResult containing the organizationId and validation status.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyValidationResult> {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isValid: false, organisationId: null, keyId: null, error: "Missing Bearer Token." };
    }

    const fullKey = authHeader.substring(7).trim();
    if (!fullKey) {
        return { isValid: false, organisationId: null, keyId: null, error: "Empty API Key." };
    }

    // 1. Derive prefix and hash for quick lookup and verification
    const keyPrefix = fullKey.slice(0, 8);
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    try {
        const { dbIdentity } = await getDatabases();
        // NOTE: We rely on the ApiKeyModel being correctly included in initializeIdentityModels
        const { ApiKey } = await initializeIdentityModels(dbIdentity);
        
        // 2. Lookup Key by prefix AND check active status
        const apiKeyRecord = await (ApiKey as Model<IApiKey>).findOne({
            keyPrefix: keyPrefix,
            isActive: true,
        });

        if (!apiKeyRecord) {
            return { isValid: false, organisationId: null, keyId: null, error: "Invalid or inactive key prefix." };
        }

        // 3. Compare Stored Hash (CRITICAL VERIFICATION STEP)
        const isMatch = (apiKeyRecord as IApiKey).compareKey(fullKey);

        if (!isMatch) {
            // Note: Use a generic error here to prevent timing attacks
            return { isValid: false, organisationId: null, keyId: null, error: "Invalid API Key." };
        }
        
        // 4. Update lastUsed timestamp (for audit/governance)
        await (ApiKey as Model<IApiKey>).updateOne(
            { _id: apiKeyRecord._id }, 
            { $set: { lastUsed: new Date() } }
        );

        // 5. SUCCESS: Return the authenticated Organisation ID
        return { 
            isValid: true, 
            organisationId: apiKeyRecord.organisationId.toString(),
            keyId: apiKeyRecord._id.toString(),
        };

    } catch (error: any) {
        console.error("API Key validation error:", error);
        return { isValid: false, organisationId: null, keyId: null, error: "Internal API authentication error." };
    }
}
```

## 🛠️ Step 2: Integrating the Middleware into Ingress Routes

We must now modify your two primary ingress APIs (`/api/ingest` and `/api/agent/report`) to prioritize the API key check before the NextAuth session check.

### A. Update `app/api/ingest/route.ts` (API Key Check)

We'll add a helper function to decide whether to authenticate via **Session (Frontend)** or **API Key (Enterprise)**.

```typescript
// app/api/ingest/route.ts (Conceptual update)

// ... imports ...
import { validateApiKey } from "@/lib/apiAuth"; // NEW IMPORT

// Helper to determine the source of the organization ID
const getAuthContext = async (request: Request) => {
    const apiKeyResult = await validateApiKey(request);

    if (apiKeyResult.isValid) {
        // API Key Context: High-priority, metered, enterprise access
        return { 
            organisationId: apiKeyResult.organisationId!, 
            userId: apiKeyResult.keyId!, // Use key ID as user ID for API Audit Trail
            isApi: true 
        };
    }
    
    // Fallback to NextAuth Session Context (Frontend access)
    const session = await getServerSession(authOptions);

    if (session?.user?.id && session.user.organisationId) {
        return { 
            organisationId: session.user.organisationId, 
            userId: session.user.id, 
            isApi: false 
        };
    }

    return { organisationId: null, userId: null, isApi: false };
};


export async function POST(req: Request) {
    // ... initial setup ...

    // --- 1. AUTHENTICATION & CONTEXT EXTRACTION ---
    const authContext = await getAuthContext(req);

    if (!authContext.organisationId) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "X-Request-ID": requestId } });
    }
    
    // Use context results for core variables
    const userId = authContext.userId as string; // Will be User ID or API Key ID
    const organisationId = authContext.organisationId as string;
    // Note: If using API, credit check/deduction must rely solely on the database, not the JWT session.

    // ... rest of the logic remains the same, but remove the old getServerSession check ...
    // The credit deduction logic in step 6 must also be updated to ensure credits are checked live from the DB, as the JWT is not available/reliable for API Keys.
    // However, since your transaction already checks the DB for credits ({ $gte: 1 }), this is largely covered.
}

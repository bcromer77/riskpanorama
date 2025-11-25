// lib/vectorize.ts
import OpenAI from "openai";

// Initialize OpenAI client (make sure API key is in environment)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Using the industry standard model for high-quality RAG embeddings
const EMBEDDING_MODEL = "text-embedding-3-small"; 

/**
 * Generates a vector embedding for a given text snippet using OpenAI.
 * This is the high-trust method used for RAG indexing.
 * @param text The text to embed (e.g., the full text of the sealed document).
 * @returns An array of floating-point numbers (the vector).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.length === 0) {
        // If text is empty, throw a controlled error to stop the ingestion.
        throw new Error("Cannot generate embedding for empty text.");
    }
    
    // Safety cap the text to prevent excessive cost/token usage
    // text-embedding-3-small supports up to 8192 tokens (approx 32k characters)
    const safeText = text.slice(0, 30000); 

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: safeText,
            encoding_format: "float",
        });

        // The vector is contained in the data array's first element
        return response.data[0].embedding;
        
    } catch (error) {
        console.error("OpenAI Embedding generation failed:", error);
        // Throw a specific error to fail the ingestion pipeline gracefully
        throw new Error("Failed to generate document vector embedding. Check OpenAI API key and usage.");
    }
}

// Rename for backward compatibility if needed, but 'generateEmbedding' is clearer.
export { generateEmbedding as embedText };

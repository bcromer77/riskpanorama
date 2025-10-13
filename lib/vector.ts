// lib/vector.ts
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

if (!VOYAGE_API_KEY) {
  throw new Error("❌ VOYAGE_API_KEY environment variable is missing");
}

export async function embedText(text: string): Promise<number[]> {
  if (!text || typeof text !== "string") {
    throw new Error("Input text must be a non-empty string");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3", // ✅ Confirmed 1024 dimensions
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Voyage API error ${response.status}: ${err.error || "Unknown"}`
    );
  }

  const data = await response.json();
  const embedding = data.data?.[0]?.embedding;

  if (!embedding || embedding.length !== 1024) {
    throw new Error(
      `Expected 1024-dimensional vector, got ${embedding?.length || "none"}`
    );
  }

  return embedding;
}


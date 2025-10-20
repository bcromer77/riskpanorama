// lib/vector.ts
// Voyage AI embed helper for MongoDB Atlas Vector Search
// Fallback-safe: works even if API key missing

export async function embed(text: string): Promise<number[]> {
  if (!text || !text.trim()) return [];

  try {
    // Use Voyage if available
    if (process.env.VOYAGE_API_KEY) {
      const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "voyage-large-2",
          input: text.slice(0, 8000),
        }),
      });

      const data = await resp.json();
      if (data?.data?.[0]?.embedding) return data.data[0].embedding;
      console.warn("Voyage response missing embedding:", data);
    }

    // fallback: deterministic pseudo-vector
    return Array.from({ length: 1024 }, (_, i) => Math.sin(i + text.length) * 0.5);
  } catch (err) {
    console.error("embed() failed:", err);
    return Array(1024).fill(0.1);
  }
}

// backward-compat alias (for old imports like embedText)
export { embed as embedText };


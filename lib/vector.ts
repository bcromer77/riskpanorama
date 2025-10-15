export async function embedText(text: string) {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-context-3",
      input: [text],
    }),
  });

  const json = await response.json();
  return json.data?.[0]?.embedding || [];
}


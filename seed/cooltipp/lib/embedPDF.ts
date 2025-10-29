import pdfParse from "pdf-parse";

export async function embedPDF(buffer: Buffer) {
  const data = await pdfParse(buffer);
  const text = data.text.slice(0, 4000); // keep short for MVP

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-2",
    }),
  });

  const result = await res.json();

  // quick summary to display in the UI
  const summary = text.split("\n").slice(0, 5).join(" ");
  const keywords = text.match(/\b[A-Z][a-z]+\b/g)?.slice(0, 10) || [];

  return { summary, keywords, embedding: result.data?.[0]?.embedding || [] };
}


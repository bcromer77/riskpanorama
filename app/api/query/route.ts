// app/api/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'voyage-large-2'
    })
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `You are an expert supply chain risk analyst helping retailers identify product quality issues and return risks.

Context from technical documents:
${context}

Question: ${question}

Analyze the context and provide a clear, detailed answer identifying:
- Specific defects or quality issues
- Safety concerns
- Components that don't meet specifications
- Potential causes of customer returns
- Brand-specific risks

Answer:`;

  const response = await fetch('https://api.voyageai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'voyage-chat-1',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);
    
    // Search MongoDB using vector search
    const client = await clientPromise;
    const db = client.db('supply_chain_risk');
    const collection = db.collection('documents');
    
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 5
        }
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();
    
    // Build context from results
    const context = results
      .map(r => `[Source: ${r.metadata.source}]\n${r.text}`)
      .join('\n\n---\n\n');
    
    // Generate answer using Voyage
    const answer = await generateAnswer(question, context);
    
    return NextResponse.json({
      answer,
      sources: results.map(r => ({
        source: r.metadata.source,
        score: r.score,
        excerpt: r.text.substring(0, 200) + '...'
      }))
    });
    
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

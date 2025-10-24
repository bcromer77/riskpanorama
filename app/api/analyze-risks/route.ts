// app/api/analyze-risks/route.ts
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

async function analyzeRisks(query: string, context: string): Promise<string> {
  const prompt = `Extract specific risks and issues from the following technical documentation. Be concise and factual.

Risk Category: ${query}

Context:
${context}

List only the specific risks found:`;

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
      max_tokens: 200,
      temperature: 0.3
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('supply_chain_risk');
    const collection = db.collection('documents');
    
    // Get all unique sources
    const sources = await collection.distinct('metadata.source');
    
    const riskQueries = [
      'manufacturing defects and quality issues',
      'safety concerns and hazards',
      'components that fail specifications',
      'battery performance problems',
      'structural integrity issues'
    ];
    
    const riskAnalysis: any = {};
    
    for (const source of sources) {
      riskAnalysis[source] = {
        risks: [],
        riskScore: 0
      };
      
      for (const query of riskQueries) {
        const embedding = await generateEmbedding(query);
        
        const results = await collection.aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: embedding,
              numCandidates: 50,
              limit: 3,
              filter: {
                'metadata.source': source
              }
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
        
        if (results.length > 0 && results[0].score > 0.7) {
          const context = results.map(r => r.text).join('\n\n');
          const risk = await analyzeRisks(query, context);
          
          if (risk && risk.length > 20) {
            riskAnalysis[source].risks.push({
              category: query,
              description: risk,
              severity: results[0].score
            });
            riskAnalysis[source].riskScore += results[0].score;
          }
        }
      }
    }
    
    // Sort by risk score
    const sortedRisks = Object.entries(riskAnalysis)
      .sort(([, a]: any, [, b]: any) => b.riskScore - a.riskScore);
    
    return NextResponse.json({
      analysis: Object.fromEntries(sortedRisks),
      summary: {
        totalProducts: sources.length,
        highRiskProducts: sortedRisks.filter(([, data]: any) => data.riskScore > 2).length
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze risks' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const runtime = 'nodejs';

// ---------------- CONFIG ----------------
const DB_VERACITY = 'veracity101';        // Galina / Veracity101 workspace
const DB_PANORAMA = 'riskpanorama';       // Your ESG / signals db
const CHUNKS_COL = 'talk_chunks';         // chunks+embeddings collection
const VECTOR_INDEX_NAME = 'vector_index'; // MUST match Atlas index name
const DEFAULT_TOPK = 40;

// Default Golden Vale counties (commercial focus block)
const GOLDEN_VALE_COUNTIES = [
  'Tipperary',
  'Limerick',
  'Cork',
  'Kerry',
  'Kilkenny',
  'Waterford',
  'Clare'
];

// -------- Voyage Helpers --------
async function voyageChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model = 'voyage-chat-2'
) {
  const res = await fetch('https://api.voyageai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('⚠️ voyageChat raw error:', res.status, text);

    // fallback stub so the pipeline can still produce a response
    return JSON.stringify({
      levers: [],
      constraints: [],
      metrics: [],
      applicability: [],
      risks: [],
      executive_summary:
        'LLM not available (Voyage 404). This is a placeholder summary.',
      benefits: [
        'Placeholder benefit: pipeline executed end-to-end',
        'Vector search returned chunks from Mongo',
        'Report structure generated successfully'
      ],
      quick_actions: [
        'Connect working LLM provider',
        'Add geo metadata to chunks at ingest',
        'Expose this report in the dashboard'
      ],
      program_blueprint: {
        sponsor: 'TBD',
        target_users: 'TBD',
        offer: 'TBD',
        funding_stack: 'TBD',
        KPIs: ['TBD KPI 1', 'TBD KPI 2'],
        governance: 'TBD',
        timeline: 'TBD'
      },
      pilot_plan: {
        duration_months: 9,
        cohort_size: '3-5 sites',
        phases: [
          { name: 'Baseline', tasks: 'Measure current performance' },
          { name: 'Deploy', tasks: 'Install or trial solution' },
          { name: 'Optimise', tasks: 'Tune, verify, compare to baseline' }
        ],
        scale_criteria: 'If KPIs improve by >10% with acceptable risk.'
      },
      value_model: {
        conservative: 'Placeholder conservative case',
        base: 'Placeholder base case',
        optimistic: 'Placeholder optimistic case',
        notes:
          'Real values will come from metrics extracted from document text.'
      },
      alignment: { items: [] },
      risks_section: [
        { risk: 'LLM not yet validated', mitigation: 'Add working model key' }
      ],
      citations: []
    });
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Voyage chat returned empty content');
  return content;
}

async function embedText(input: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'voyage-large-2',
      input
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage embeddings error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const emb = data?.data?.[0]?.embedding;
  if (!Array.isArray(emb)) throw new Error('Invalid embedding from Voyage');
  return emb;
}

// -------- Types --------
type PersonaKey =
  | 'council'
  | 'electricity_provider'
  | 'data_centre'
  | 'university'
  | 'sme';

type GenerateBody = {
  docIds?: string[];             // optional: limit to specific doc(s)
  query?: string;                // optional: free-text semantic query
  personas: PersonaKey[];        // required
  geography?: string;            // legacy single-county
  region?: string;               // e.g. "Golden Vale"
  counties?: string[];           // e.g. ["Cork","Limerick"]
  alignmentPacks?: {
    seai?: any;
    ucd?: any;
    region?: Record<string, any>;    // { "Golden Vale": {...} }
    counties?: Record<string, any>;  // { "Cork": {...}, "Limerick": {...} }
  };
  dbSource?: 'veracity101' | 'riskpanorama'; // choose source DB
  topK?: number;
};

// -------- Alignment + Geo helpers --------
function normalizeCounty(name?: string) {
  return (name || '').trim();
}

function makeAlignmentHints(
  packs: GenerateBody['alignmentPacks'],
  county?: string,
  region?: string
) {
  const hints: string[] = [];
  if (region && packs?.region?.[region]) {
    hints.push(`${region} alignment pack available.`);
  }
  if (county && packs?.counties?.[county]) {
    hints.push(`${county} alignment pack available.`);
  }
  if (packs?.seai) hints.push('SEAI funding alignment available.');
  if (packs?.ucd) hints.push('UCD research alignment available.');
  return hints.join(' ');
}

function buildAlignmentItems(
  packs: GenerateBody['alignmentPacks'],
  county?: string,
  region?: string
): { framework: string; theme: string; rationale: string }[] {
  const items: { framework: string; theme: string; rationale: string }[] = [];

  const addPack = (frameworkLabel: string, pack: any) => {
    if (!pack) return;
    const themes = Array.isArray(pack.themes) ? pack.themes : [];
    themes.forEach((t: any) => {
      items.push({
        framework: frameworkLabel,
        theme: t.name || t.id || 'Theme',
        rationale: t.kpis
          ? `KPIs: ${t.kpis.join(', ')}`
          : 'Relevant strategic objective'
      });
    });
  };

  if (!packs) return items;
  if (region && packs.region?.[region]) addPack(region, packs.region[region]);
  if (county && packs.counties?.[county]) addPack(county, packs.counties[county]);
  if (packs.seai) addPack('SEAI', packs.seai);
  if (packs.ucd) addPack('UCD', packs.ucd);

  return items;
}

// -------- Prompt Templates --------
function lcmSystemPrompt() {
  return `You extract actionable implementation signals from technical documents.
Return only valid JSON with keys: levers, constraints, metrics, applicability, risks.
- levers: { name, description, direction ("increase"|"decrease"|"optimize"), indicative_range (string), unit (string|null) }
- constraints: { type, description }
- metrics: { name, value (string), unit (string|null), context, confidence (string|null) }
- applicability: { context, maturity ("simulation"|"lab"|"field"|"pilot"|"production"), requirements }
- risks: { risk, mitigation }
Be conservative and cite only what is supported by the provided excerpts.`;
}

function personaSystemPrompt(persona: PersonaKey) {
  const who =
    persona === 'council'
      ? 'Local Council decision-makers'
      : persona === 'electricity_provider'
      ? 'Electricity provider/DSO leadership'
      : persona === 'data_centre'
      ? 'Data centre / industrial site leadership'
      : persona === 'university'
      ? 'University research and PhD leads'
      : 'SME / operator / site manager';

  const goals =
    persona === 'council'
      ? 'public value, lower bills, jobs, emissions, resilience'
      : persona === 'electricity_provider'
      ? 'peak reduction, flexibility, reliability, avoided capex'
      : persona === 'data_centre'
      ? 'no-new-peak planning, community benefits, ESG credibility'
      : persona === 'university'
      ? 'novelty, data availability, measurable KPIs'
      : 'cost reduction, uptime, ROI, simple procurement';

  return `You generate a Stakeholder Benefits Report from technical content for ${who}.
Optimize for clarity and actionability for ${goals}.

Return ONLY valid JSON with keys:
- executive_summary (<=180 words, non-technical)
- benefits (3-6 bullet strings, conservative quantified ranges if possible)
- quick_actions (3 bullets: actions they could start next week)
- program_blueprint { sponsor, target_users, offer, funding_stack, KPIs (array), governance, timeline }
- pilot_plan { duration_months, cohort_size, phases: [{ name, tasks }], scale_criteria }
- value_model { conservative, base, optimistic, notes }
- alignment { items: [{ framework, theme, rationale }] }
- risks (array of { risk, mitigation })
- citations (array of { docId, chunkIdx, quote })`;
}

// -------- Main Handler --------
export async function POST(req: NextRequest) {
  try {
    // ---- 1. Parse request body ----
    const body = (await req.json()) as GenerateBody;
    const {
      docIds = [],
      query = '',
      personas,
      geography, // legacy single-county
      region,
      counties,
      alignmentPacks,
      dbSource = 'veracity101',
      topK = DEFAULT_TOPK
    } = body;

    if (!Array.isArray(personas) || personas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'personas[] required' },
        { status: 400 }
      );
    }

    // ---- 2. Derive targetCounties ----
    // Priority:
    //   - explicit counties[] from request
    //   - known region ("Golden Vale")
    //   - legacy geography string
    //   - default Golden Vale if nothing provided
    let targetCounties: string[] = [];

    if (Array.isArray(counties) && counties.length > 0) {
      targetCounties = counties.map(normalizeCounty);
    } else if (region && region.toLowerCase() === 'golden vale') {
      targetCounties = GOLDEN_VALE_COUNTIES;
    } else if (geography) {
      targetCounties = [normalizeCounty(geography)];
    } else {
      targetCounties = GOLDEN_VALE_COUNTIES;
    }

    const normalizedRegion = region || 'Golden Vale';

    // ---- 3. Mongo connections ----
    const client = await clientPromise;
    const dbV = client.db(DB_VERACITY);
    const dbR = client.db(DB_PANORAMA);

    // Which DB we pull chunks from (Veracity101 by default)
    const activeDB = dbSource === 'riskpanorama' ? dbR : dbV;
    const chunksCol = activeDB.collection(CHUNKS_COL);

    // ---- 4. Build query vector from user query or fallback ----
    const seedQuery =
      query && query.trim().length > 0
        ? query
        : 'Extract practical applications, levers, constraints, metrics, and risks.';
    const qVec = await embedText(seedQuery);

    // ---- 5. Build optional semantic filters ----
    const geoFilterCandidate =
      targetCounties.length > 0
        ? {
            $or: [
              { 'geo.counties': { $in: targetCounties } },
              { 'geo.region': normalizedRegion }
            ]
          }
        : {};

    const docFilterCandidate =
      docIds.length > 0
        ? {
            docId: { $in: docIds.map((id) => new ObjectId(id)) }
          }
        : {};

    // Start assembling the vector search
    const vSearch: any = {
      index: VECTOR_INDEX_NAME,
      path: 'embedding',
      queryVector: qVec,
      numCandidates: Math.max(topK * 10, 200),
      limit: topK
    };

    // If user supplied docIds, always include that filter
    if (docIds.length > 0) {
      vSearch.filter = { ...docFilterCandidate };
    }

    // Only apply geo filter if the collection actually has geo.* at all
    let hasGeoMetadata = false;
    try {
      const probe = await chunksCol
        .find(
          { geo: { $exists: true } },
          { projection: { _id: 1 }, limit: 1 }
        )
        .toArray();
      hasGeoMetadata = probe.length > 0;
    } catch {
      hasGeoMetadata = false;
    }

    if (hasGeoMetadata && Object.keys(geoFilterCandidate).length > 0) {
      if (vSearch.filter) {
        vSearch.filter = { $and: [vSearch.filter, geoFilterCandidate] };
      } else {
        vSearch.filter = geoFilterCandidate;
      }
    }

    // ---- 6. Run vector search in Mongo ----
    const pipeline: any[] = [
      { $vectorSearch: vSearch },
      {
        $project: {
          docId: 1,
          idx: 1,
          text: 1,
          geo: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const relevantChunks = (await chunksCol.aggregate(pipeline).toArray()) as any[];

    if (!relevantChunks.length) {
      return NextResponse.json(
        { success: false, error: 'No relevant chunks found' },
        { status: 404 }
      );
    }

    // ---- 7. Cross-db enrichment from RiskPanorama (ESG, etc.) ----
    let contextSignals: any[] = [];
    try {
      const docIdsOnly = relevantChunks.map((c) => c.docId);
      contextSignals = await dbR
        .collection('esg_signals')
        .find({ docId: { $in: docIdsOnly } })
        .limit(10)
        .toArray();
    } catch (e) {
      console.warn('⚠️ No cross-database context found or esg_signals missing:', e);
    }

    // ---- 8. Prepare LCM extraction context ----
    const contextPayload = {
      region: normalizedRegion,
      counties: targetCounties,
      chunk_count: relevantChunks.length,
      chunks: relevantChunks.map((c) => ({
        docId: String(c.docId),
        idx: c.idx,
        text: String(c.text || '').slice(0, 2000)
      })),
      extra_context: contextSignals
    };

    // ---- 9. Extract levers / constraints / metrics / applicability / risks ----
    const lcmContent = await voyageChat([
      { role: 'system', content: lcmSystemPrompt() },
      { role: 'user', content: JSON.stringify(contextPayload) }
    ]);

    let lcmJson: any;
    try {
      lcmJson = JSON.parse(lcmContent);
    } catch {
      lcmJson = {
        levers: [],
        constraints: [],
        metrics: [],
        applicability: [],
        risks: []
      };
    }

    // ---- 10. Generate persona x county reports ----
    const outputs: any[] = [];

    for (const county of targetCounties) {
      const alignmentItems = buildAlignmentItems(
        alignmentPacks,
        county,
        normalizedRegion
      );
      const alignmentHint = makeAlignmentHints(
        alignmentPacks,
        county,
        normalizedRegion
      );

      for (const persona of personas) {
        const personaContext = {
          region: normalizedRegion,
          county,
          alignment_hint: alignmentHint,
          lcm: lcmJson,
          excerpts: contextPayload.chunks.slice(0, 30),
          alignment_items: alignmentItems
        };

        const personaContent = await voyageChat([
          { role: 'system', content: personaSystemPrompt(persona) },
          {
            role: 'user',
            content: JSON.stringify({
              persona,
              county,
              region: normalizedRegion,
              alignmentItems,
              data: personaContext
            })
          }
        ]);

        let reportJson: any;
        try {
          reportJson = JSON.parse(personaContent);
        } catch {
          reportJson = {
            executive_summary:
              'Report generation failed to produce valid JSON.',
            benefits: [],
            quick_actions: [],
            program_blueprint: {},
            pilot_plan: {},
            value_model: {},
            alignment: { items: [] },
            risks: [],
            citations: []
          };
        }

        // Make sure citations exist
        if (
          !Array.isArray(reportJson.citations) ||
          reportJson.citations.length === 0
        ) {
          reportJson.citations = contextPayload.chunks
            .slice(0, 5)
            .map((c) => ({
              docId: c.docId,
              chunkIdx: c.idx,
              quote: String(c.text).slice(0, 200)
            }));
        }

        // If model didn't populate alignment.items, inject ours
        if (
          !reportJson.alignment ||
          !Array.isArray(reportJson.alignment.items)
        ) {
          reportJson.alignment = { items: alignmentItems };
        }

        outputs.push({ persona, county, report: reportJson });
      }
    }

    // ---- 11. Save results to Mongo for dashboard/history ----
    try {
      await Promise.all([
        dbV.collection('report_requests').insertOne({
          createdAt: new Date(),
          personas,
          region: normalizedRegion,
          counties: targetCounties,
          sourceDocs: docIds,
          usedChunks: relevantChunks.length
        }),
        dbV.collection('reports').insertMany(
          outputs.map((o) => ({
            createdAt: new Date(),
            persona: o.persona,
            county: o.county,
            region: normalizedRegion,
            report: o.report
          }))
        )
      ]);
    } catch (e) {
      console.warn('⚠️ Could not save reports:', e);
    }

    // ---- 12. Return to caller ----
    return NextResponse.json({
      success: true,
      region: normalizedRegion,
      counties: targetCounties,
      personas,
      count: outputs.length,
      reports: outputs,
      usedChunks: relevantChunks.length
    });
  } catch (err: any) {
    console.error('❌ Report generation error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}


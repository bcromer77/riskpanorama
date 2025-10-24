 Veracity101 — Science that explains itself


 The Vision

Veracity101 bridges the gap between **scientific research** and **practical decision-making**.  
It transforms dense academic papers into **understandable, actionable intelligence** for local governments, industries, and supply-chain partners.

The mission:  
> “To make science beneficial — turning every research paper into a program, pilot, or product.”

Our system ingests scientific PDFs, extracts meaning, and uses AI to tailor insights to the language, goals, and metrics of each stakeholder — whether that’s a **county council**, a **co-op**, or a **corporate buyer**.

---

 Architecture Overview

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | Next.js 15 + App Router | Upload PDFs, ask questions, view reports |
| **Backend** | Node (Next API Routes) | Text extraction, chunking, embedding, reporting |
| **Database** | MongoDB Atlas Vector Search | Stores embeddings and chunks for semantic retrieval |
| **Embeddings** | VoyageAI (`voyage-large-2`) | Captures semantic meaning for context-aware Q&A |
| **Parsing** | pdf-parse → pdfjs-dist → OCR fallback | Resilient PDF text extraction pipeline |
| **Reporting** | JSON → Markdown → PDF | Generates stakeholder-specific summaries and reports |

---

 Current Capabilities

✅ Ingest any PDF (research, ESG, policy, supplier)  
✅ Clean and chunk the text, store embeddings in MongoDB  
✅ Ask natural-language questions (“Summarize findings and methods”)  
✅ Retrieve the most relevant sections with citations  
✅ Prepare multi-audience summaries using persona adapters  

---

 Why It matters

Scientific and engineering papers are packed with knowledge — but they’re rarely readable by the people who could act on them.  
Veracity101 translates this complexity into **clear, evidence-based guidance** for those making policy, investment, or procurement decisions.


 Example 1 — Local Council understanding Galina’s research

**Scenario:**  
Galina’s *Therminic 2025* paper explores advanced **liquid cooling methods** for data centres and energy recovery systems.  
For most councils, the paper’s maths and thermodynamics are impenetrable.  
But the implications — lower emissions, energy reuse, reduced peak load — are directly relevant to local climate and infrastructure plans.

**How Veracity101 helps**

1. **Upload the PDF** — The paper is parsed and embedded in MongoDB.  
2. **Ask natural questions:**  
   - “How could this research help a mid-sized town reduce grid strain?”  
   - “What would be the cost and benefit of adopting this method?”  
3. **Persona Adapter: Council**
   - Rewrites findings into clear outcomes:  
     - *“Introducing pulsating cooling could reduce municipal data-centre energy demand by up to 18%, equivalent to powering 600 homes.”*  
     - *“Reusing waste heat could cut local emissions by 240 tonnes CO₂/year.”*  
4. **Outputs a Stakeholder Report**:
   - Executive summary (non-technical)
   - Benefits and KPIs
   - “Next steps” for grant or pilot funding
   - Evidence citations (so officials can trace back to the research)

This allows **a council energy team** to:
- Understand what’s technically possible  
- Identify funding or pilot options  
- Engage researchers with concrete data  
- Justify investment in sustainable cooling or battery systems  

Veracity101 effectively turns a scientific PDF into **a ready-to-act briefing**.

---

 Example 2 — Ornua Provenance Intelligence for Costco (Kerrygold USA)

**Scenario:**  
Ornua wants to prove Kerrygold’s dairy supply chain is both **authentic and scientifically verified** —  
linking farm-level sustainability data with global retail standards.

Veracity101 ingests multiple scientific and technical PDFs:
- UCD methane-reduction trial reports  
- SEAI process-heat recovery audits  
- Bord Bia sustainability certifications  
- Farm efficiency and feed-conversion studies  

Each is embedded and analyzed to extract:
- **Levers:** what actions drive improvement (e.g. reduce process heat, improve feed mix)  
- **Constraints:** what conditions must hold (e.g. herd size, temperature range)  
- **Metrics:** measurable proof (e.g. “14% process heat reduction”, “0.3 kg CO₂e/litre milk cut”)  

**Persona Adapter: Corporate / Retail Buyer**

Veracity101 transforms this technical evidence into a **“Buyer Sustainability Dossier”**:  

**Executive Summary (Excerpt)**  
> Kerrygold’s verified on-farm and processing efficiencies, validated through Irish and EU scientific data, demonstrate measurable sustainability performance.  
> Verified results include:  
> - **14% reduction** in process heat use (UCD thermal studies)  
> - **0.3 kg CO₂e/litre** methane-intensity improvement (Teagasc trials)  
> - **8% increase** in feed-efficiency yield (pasture optimization)  
>   
> These metrics align with Costco’s 2025 Scope-3 supplier verification framework and the EU Corporate Sustainability Directive, giving Kerrygold a competitive ESG advantage in US retail.

**Why This Matters**

- **For Ornua:** turns raw scientific audits into brand value and shelf trust.  
- **For Costco:** provides transparent, verifiable metrics stored in MongoDB for auditing.  
- **For Farmers:** converts science into recognition and premium value for verified efficiency.  

In short, *Veracity101 transforms provenance into performance* — proof-driven storytelling backed by verifiable data.

---

##  How the system extracts meaning

Each ingested document produces structured knowledge:

| Category | Description | Example |
|-----------|--------------|----------|
| **Levers** | What can change | “Reduce pump power by 12%” |
| **Constraints** | What must stay true | “Maintain laminar flow under 0.8 m/s” |
| **Metrics** | Quantified evidence | “Heat loss reduced by 14% (±1.2)” |
| **Applicability** | When and where it applies | “Validated in 25 °C–70 °C temperature range” |

MongoDB stores these as vectorized knowledge objects, allowing multi-paper comparisons —  
for example, aggregating ten farm trials into a single “National Provenance Dashboard”.

---

 Stakeholder report template (Standard Output)

1. Executive Summary (150–200 words)  
2. Benefits (3–5 bullets, quantified where possible)  
3. What You Can Do Next (3 practical actions)  
4. Program Blueprint (timeline, roles, funding)  
5. Pilot Plan (baseline → deploy → optimize → measure)  
6. Value Model (conservative / base / optimistic cases)  
7. Alignment (optional policy or framework links)  
8. Risks & Mitigations  
9. Evidence & Citations (chunk IDs, source text)

This format stays constant — only the **persona** and **context** change.

---

 APIs

| Endpoint | Description | Status |
|-----------|--------------|--------|
| `POST /api/ingest` | Upload and parse PDFs into MongoDB | ✅ |
| `POST /api/talk/query` | Ask natural-language questions | ✅ |
| `POST /api/report/generate` | Generate persona-based reports | 🔧 Coming soon |

---

 Roadmap

| Phase | Description | Lead |
|--------|--------------|------|
| ✅ Phase 1 | PDF ingestion & semantic query working | Bazil |
|  Phase 2 | Persona adapters (Council & Ornua) | Bazil + Galina |
|  Phase 3 | Multi-document synthesis and “Stakeholder Report Generator” | UCD Nexus & Veracity101 team |

---




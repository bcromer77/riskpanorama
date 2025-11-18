// app/api/map-signals/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // In production you pull from MongoDB
  // For now, simulated Palantir-style global signals:
  const signals = [
    {
      id: "sig001",
      lat: -13.274,
      lng: 34.301,
      country: "Mozambique",
      category: "FPIC",
      severity: 0.92,
      title: "FPIC grievance escalation",
      description:
        "Balama community asserts lack of Free, Prior and Informed Consent in recent expansion plans.",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "sig002",
      lat: 23.6345,
      lng: -102.5528,
      country: "Mexico",
      category: "Political",
      severity: 0.68,
      title: "Election-year volatility",
      description:
        "Lithium nationalisation rhetoric increasing; expected legal uncertainty post-vote.",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "sig003",
      lat: -4.0383,
      lng: 21.7587,
      country: "DRC",
      category: "Water",
      severity: 0.87,
      title: "Water stress in cobalt corridor",
      description:
        "Refining region flagged for severe water scarcity affecting ESG disclosures.",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "sig004",
      lat: 65.5848,
      lng: 22.1567,
      country: "Sweden",
      category: "Indigenous",
      severity: 0.33,
      title: "Sámi Radio Report",
      description:
        "Sámi indigenous broadcast discusses land use concerns around planned rail expansion.",
      lastUpdated: new Date().toISOString(),
    },
  ];

  // Supplier nodes — you will eventually pull from Mongo
  const suppliers = [
    {
      id: "sup001",
      supplier: "Northvolt",
      lat: 64.7502,
      lng: 20.9500,
      country: "Sweden",
      passportId: "abc123456",
      fpicScore: 0.20,
      esgScore: 0.88,
      politicalScore: 0.42,
    },
    {
      id: "sup002",
      supplier: "Syrah Resources",
      lat: -16.9167,
      lng: 36.9833,
      country: "Mozambique",
      passportId: "def789101",
      fpicScore: 0.91,
      esgScore: 0.56,
      politicalScore: 0.74,
    },
  ];

  return NextResponse.json({ signals, suppliers });
}


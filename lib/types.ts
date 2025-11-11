// lib/types.ts

export type AccessTier = "public" | "legitimate_interest" | "authority" | "commission";

export interface BatteryPassportDoc {
  _id?: any;
  battery_id: string; // model or serial
  category: "EV" | "LMT" | "Industrial";
  operator?: {
    name?: string;
    role?: "manufacturer" | "importer";
    country?: string;
    eori?: string;
  };
  access?: { default_tier?: AccessTier };

  general?: {
    manufacturer_name?: string;
    manufacturing_place?: string;
    manufacturing_date?: string;
    mass_kg?: number;
    conformity_docs?: string[];
    labels?: string[];
  };

  carbon_footprint?: {
    total_gco2_per_kWh?: number;
    performance_class?: string;
    stage?: {
      raw_materials?: { gco2_per_kWh?: number; data_source?: "primary" | "secondary" };
      manufacturing?: { gco2_per_kWh?: number; data_source?: "primary" | "secondary" };
      distribution?: { gco2_per_kWh?: number; data_source?: "primary" | "secondary" };
      eol?: { gco2_per_kWh?: number; data_source?: "primary" | "secondary" };
    };
    study_url?: string;
  };

  due_diligence?: {
    report_url?: string;
    third_party_verification?: string;
    supply_chain_indices?: string[];
  };

  circularity?: {
    recycled_content?: Partial<
      Record<"Ni" | "Co" | "Li" | "Pb", { pre_consumer?: number; post_consumer?: number }>
    >;
    renewable_content_share?: number;
    dismantling_manual_urls?: string[];
    eol_info?: { takeback?: string; collection_points?: string[] };
  };

  performance?: {
    static?: {
      rated_capacity_Ah?: number;
      voltage_min_nom_max?: [number, number, number];
      lifetime_years?: number;
    };
    dynamic?: {
      remaining_capacity_Ah?: number;
      state_of_charge?: number;
      cycles?: number;
      last_updated?: string;
    };
  };

  evidence_docs?: { title: string; url: string; type?: "LCA" | "Audit" | "Passport" }[];
  country?: string;
  created_at?: string;
  updated_at?: string;
}


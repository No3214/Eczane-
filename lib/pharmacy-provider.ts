import { Pharmacy } from "@/types/pharmacy";

export interface PharmacyQuery {
  lat?: number;
  lng?: number;
  city?: string;
  district?: string;
}

export type PharmacyProviderInput = PharmacyQuery;

export interface PharmacyProvider {
  name: string;
  priority: number;
  canHandle(input: PharmacyQuery): boolean;
  fetch(input: PharmacyQuery): Promise<Pharmacy[]>;
}

export type EnrichedPharmacy = Pharmacy & {
  source: string;
  source_label: string;
  confidence_score: number;
  is_live: boolean;
  warning_message?: string;
};

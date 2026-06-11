import { Pharmacy } from "@/types/pharmacy";
import { PharmacyProvider, PharmacyProviderInput } from "../pharmacy-provider";
import { generateMockPharmacies } from "@/lib/pharmacy-data";
import { normalizePharmacy } from "../pharmacy-normalizer";

export class MockProvider implements PharmacyProvider {
  name = "mock";
  priority = 100; // Last resort

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_input: PharmacyProviderInput): boolean {
    return true; // Always handles as a last resort fallback
  }

  async fetch(input: PharmacyProviderInput): Promise<Pharmacy[]> {
    const mocks = generateMockPharmacies(input.lat, input.lng, input.city, input.district);
    return mocks.map((m) => normalizePharmacy(m, "mock"));
  }
}

import Dexie, { type Table } from "dexie";
import { Pharmacy } from "@/types/pharmacy";
import { DrugInfo } from "@/lib/drug-data";

export interface CachedSearch {
  id?: number;
  city: string;
  district: string;
  timestamp: number;
}

export class NobetciPlusDB extends Dexie {
  pharmacies!: Table<Pharmacy>;
  searchHistory!: Table<CachedSearch>;
  prospectusCache!: Table<DrugInfo>;

  constructor() {
    super("NobetciPlusDB");
    this.version(1).stores({
      pharmacies: "id, city, district, latitude, longitude, updated_at",
      searchHistory: "++id, [city+district], timestamp",
      prospectusCache: "id, name, activeIngredient",
    });
  }
}

export const db = new NobetciPlusDB();

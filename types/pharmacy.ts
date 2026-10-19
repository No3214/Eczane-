export interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance?: number; // Calculated distance in km
  confidence_score?: number; // Accuracy level out of 100
  updated_at?: string; // Last updated timestamp
  surplus_items?: { id: string; name: string; discount_badge?: string; price?: string }[];
  // Provider Metadata
  source?: string;
  source_label?: string;
  source_updated_at?: string;
  roster_date?: string; // Source calendar date; does not establish current duty hours
  is_live?: boolean;
  warning_message?: string;
}

export interface Report {
  id?: string;
  pharmacy_id: string;
  pharmacy_name?: string;
  report_type: 'wrong_location' | 'wrong_phone' | 'closed' | 'wrong_address' | 'other';
  message?: string;
  user_latitude?: number;
  user_longitude?: number;
  status?: 'open' | 'resolved';
  created_at?: string;
}

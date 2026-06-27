import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  agency_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  user_id: string;
  title: string;
  property_type: 'apartment' | 'house' | 'land' | 'commercial' | 'duplex' | 'townhouse' | 'villa' | 'office';
  status: 'draft' | 'available' | 'under_contract' | 'sold' | 'withdrawn';
  price: number;
  currency: string;
  location: string;
  city: string;
  state: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  land_size_sqm: number | null;
  built_area_sqm: number | null;
  features: string[] | null;
  description: string | null;
  generated_description: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'closed' | 'lost';
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  preferred_locations: string[] | null;
  preferred_property_types: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyClient = {
  id: string;
  property_id: string;
  client_id: string;
  interest_level: 'low' | 'medium' | 'high' | 'very_high';
  notes: string | null;
  created_at: string;
};

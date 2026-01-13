export interface Dog {
  id: string;
  dog_name: string;
  // Kennels can come back as:
  // - relation objects via Supabase joins (recommended)
  // - legacy strings (older schema)
  // - null/undefined (optional kennel)
  primary_kennel?: string | Kennel | null;
  secondary_kennel?: string | Kennel | null;
  // Some pages still fall back to these legacy name fields
  primary_kennel_name?: string;
  secondary_kennel_name?: string;
  // Current schema uses FK ids
  primary_kennel_id?: string | null;
  secondary_kennel_id?: string | null;
  gender: 'male' | 'female';
  champion?: 'none' | 'ch' | 'dual_ch' | 'gr_ch' | 'dual_gr_ch' | 'nw_gr_ch' | 'inw_gr_ch';
  image_url?: string;
  father_id?: string;
  mother_id?: string;
  created_at?: string;
  father?: Dog | null;
  mother?: Dog | null;
}

export interface Kennel {
  id: string;
  name: string;
  // Optional fields depending on your Supabase schema/migrations
  name_lower?: string;
  created_at?: string;
}

export interface DogFormData {
  dog_name: string;
  champion?: Dog['champion'];
  // Primary/secondary kennels are selected via ids in the UI.
  primary_kennel_id?: string;
  secondary_kennel_id?: string;
  // Legacy support (some older codepaths may still pass strings)
  primary_kennel?: string;
  secondary_kennel?: string;
  gender: 'male' | 'female';
  father_id?: string;
  mother_id?: string;
  photo?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

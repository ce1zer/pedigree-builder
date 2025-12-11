export interface Kennel {
  id: string;
  name: string;
  created_at: string;
}

export interface Dog {
  id: string;
  dog_name: string;
  champion?: 'none' | 'ch' | 'dual_ch' | 'gr_ch' | 'dual_gr_ch' | 'nw_gr_ch' | 'inw_gr_ch'; // Champion status
  primary_kennel?: string | Kennel; // Legacy text field (deprecated) or joined Kennel object
  secondary_kennel?: string | Kennel; // Legacy text field (deprecated) or joined Kennel object
  primary_kennel_id?: string;
  secondary_kennel_id?: string;
  primary_kennel_name?: string; // For display purposes
  secondary_kennel_name?: string; // For display purposes
  gender: 'male' | 'female';
  image_url?: string;
  father_id?: string;
  mother_id?: string;
  created_at: string;
  father?: Dog | null;
  mother?: Dog | null;
}

export interface DogFormData {
  dog_name: string;
  champion?: 'none' | 'ch' | 'dual_ch' | 'gr_ch' | 'dual_gr_ch' | 'nw_gr_ch' | 'inw_gr_ch';
  primary_kennel_id?: string;
  secondary_kennel_id?: string;
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

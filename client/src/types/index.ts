export interface Dog {
  id: string;
  dog_name: string;
  primary_kennel: string;
  secondary_kennel?: string;
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
  primary_kennel: string;
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

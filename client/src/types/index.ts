// Gender type definition
export type Gender = 'male' | 'female';

// Dog interface representing a dog profile with parent relationships
export interface Dog {
  id: string;
  dog_name: string;
  primary_kennel: string;
  secondary_kennel?: string;
  gender: Gender;
  image_url?: string;
  father_id?: string;
  mother_id?: string;
  created_at: string;
  father?: Dog | null;
  mother?: Dog | null;
}

// Form data interface for creating/updating dogs
export interface DogFormData {
  dog_name: string;
  primary_kennel: string;
  secondary_kennel?: string;
  gender: Gender;
  father_id?: string;
  mother_id?: string;
  photo?: File;
}

// Generic API response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

// Pedigree tree node interface for pedigree generation
export interface PedigreeNode {
  id: string;
  dog_name: string;
  primary_kennel: string;
  secondary_kennel?: string;
  gender: Gender;
  image_url?: string;
  generation: number;
  father: PedigreeNode | null;
  mother: PedigreeNode | null;
}
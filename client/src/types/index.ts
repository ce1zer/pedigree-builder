export interface Dog {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date: string;
  breed: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  father?: Dog | null;
  mother?: Dog | null;
}

export interface DogFormData {
  name: string;
  gender: 'male' | 'female';
  birth_date: string;
  breed: string;
  photo?: File;
}

export interface ParentData {
  father_id?: string;
  mother_id?: string;
}

export interface PedigreeNode {
  id: string;
  name: string;
  gender: 'male' | 'female';
  breed: string;
  birth_date: string;
  photo_url?: string;
  generation: number;
  father?: PedigreeNode | null;
  mother?: PedigreeNode | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

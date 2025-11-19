import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Dog, DogFormData, ApiResponse } from '../types';

// API configuration
const API_BASE_URL = '/api';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to handle API responses
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> => {
  return response.data;
};

// Helper function to create form data for dog operations
const createDogFormData = (dogData: DogFormData): FormData => {
  const formData = new FormData();
  formData.append('dogData', JSON.stringify({
    dog_name: dogData.dog_name,
    primary_kennel: dogData.primary_kennel,
    secondary_kennel: dogData.secondary_kennel,
    gender: dogData.gender,
    father_id: dogData.father_id,
    mother_id: dogData.mother_id,
  }));
  
  if (dogData.photo) {
    formData.append('photo', dogData.photo);
  }
  
  return formData;
};

// Dogs API service
export const dogsApi = {
  /**
   * Retrieve all dogs with their parent information
   */
  getAll: async (): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs');
    return handleApiResponse(response);
  },

  /**
   * Retrieve a specific dog by ID with parent information
   */
  getById: async (id: string): Promise<ApiResponse<Dog>> => {
    const response = await api.get(`/dogs/${id}`);
    return handleApiResponse(response);
  },

  /**
   * Create a new dog profile
   */
  create: async (dogData: DogFormData): Promise<ApiResponse<Dog>> => {
    const formData = createDogFormData(dogData);
    
    const response = await api.post('/dogs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return handleApiResponse(response);
  },

  /**
   * Update an existing dog profile
   */
  update: async (id: string, dogData: DogFormData): Promise<ApiResponse<Dog>> => {
    const formData = createDogFormData(dogData);
    
    const response = await api.put(`/dogs/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return handleApiResponse(response);
  },

  /**
   * Delete a dog profile
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/dogs/${id}`);
    return handleApiResponse(response);
  },

  /**
   * Search dogs by name or kennel
   */
  search: async (query: string): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs/search', {
      params: { q: query },
    });
    
    return handleApiResponse(response);
  },
};
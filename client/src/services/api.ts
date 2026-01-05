import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Dog, DogFormData, ApiResponse, Kennel } from '../types';

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
    gender: dogData.gender,
    champion: dogData.champion,
    father_id: dogData.father_id,
    mother_id: dogData.mother_id,
    primary_kennel_id: dogData.primary_kennel_id,
    secondary_kennel_id: dogData.secondary_kennel_id,
    // Legacy fields (safe to include; API will ignore if unused)
    primary_kennel: dogData.primary_kennel,
    secondary_kennel: dogData.secondary_kennel,
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

// Kennels API service
export const kennelsApi = {
  /**
   * Retrieve all kennels
   */
  getAll: async (): Promise<ApiResponse<Kennel[]>> => {
    const response = await api.get('/kennels');
    return handleApiResponse(response);
  },

  /**
   * Retrieve a specific kennel by ID
   */
  getById: async (id: string): Promise<ApiResponse<Kennel>> => {
    const response = await api.get(`/kennels/${id}`);
    return handleApiResponse(response);
  },

  /**
   * Create a new kennel
   */
  create: async (name: string): Promise<ApiResponse<Kennel>> => {
    const response = await api.post('/kennels', { name });
    return handleApiResponse(response);
  },

  /**
   * Update an existing kennel
   */
  update: async (id: string, name: string): Promise<ApiResponse<Kennel>> => {
    const response = await api.put(`/kennels/${id}`, { name });
    return handleApiResponse(response);
  },

  /**
   * Delete a kennel
   */
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/kennels/${id}`);
    return handleApiResponse(response);
  },
};
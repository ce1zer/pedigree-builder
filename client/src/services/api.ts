import axios from 'axios';
import { Dog, DogFormData, ApiResponse } from '../types';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? '/client/api' : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dogs API
export const dogsApi = {
  // Get all dogs
  getAll: async (): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs');
    return response.data;
  },

  // Get specific dog
  getById: async (id: string): Promise<ApiResponse<Dog>> => {
    const response = await api.get(`/dogs/${id}`);
    return response.data;
  },

  // Create new dog
  create: async (dogData: DogFormData): Promise<ApiResponse<Dog>> => {
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

    const response = await api.post('/dogs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update dog profile
  update: async (id: string, dogData: DogFormData): Promise<ApiResponse<Dog>> => {
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

    const response = await api.put(`/dogs/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Search by name or kennel
  search: async (query: string): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs/search', {
      params: { q: query },
    });
    return response.data;
  },
};

export default api;

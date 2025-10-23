import axios from 'axios';
import { Dog, DogFormData, ParentData, PedigreeNode, ApiResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dogs API
export const dogsApi = {
  // Alle honden ophalen
  getAll: async (): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs');
    return response.data;
  },

  // Specifieke hond ophalen
  getById: async (id: string): Promise<ApiResponse<Dog>> => {
    const response = await api.get(`/dogs/${id}`);
    return response.data;
  },

  // Nieuwe hond aanmaken
  create: async (dogData: DogFormData): Promise<ApiResponse<Dog>> => {
    const formData = new FormData();
    formData.append('dogData', JSON.stringify({
      name: dogData.name,
      gender: dogData.gender,
      birth_date: dogData.birth_date,
      breed: dogData.breed,
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

  // Hondenprofiel bijwerken
  update: async (id: string, dogData: DogFormData): Promise<ApiResponse<Dog>> => {
    const formData = new FormData();
    formData.append('dogData', JSON.stringify({
      name: dogData.name,
      gender: dogData.gender,
      birth_date: dogData.birth_date,
      breed: dogData.breed,
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

  // Ouders koppelen
  linkParents: async (id: string, parentData: ParentData): Promise<ApiResponse<any>> => {
    const response = await api.post(`/dogs/${id}/parents`, parentData);
    return response.data;
  },

  // Zoeken op naam
  search: async (query: string): Promise<ApiResponse<Dog[]>> => {
    const response = await api.get('/dogs/search', {
      params: { q: query },
    });
    return response.data;
  },
};

// Pedigree API
export const pedigreeApi = {
  // Stamboom genereren
  generate: async (rootDogId: string, maxGenerations: number = 5): Promise<ApiResponse<PedigreeNode>> => {
    const response = await api.post('/pedigree/generate', {
      rootDogId,
      maxGenerations,
    });
    return response.data;
  },

  // Stamboom exporteren als PNG
  exportAsPng: async (pedigreeData: PedigreeNode): Promise<Blob> => {
    const response = await api.post('/pedigree/export', {
      pedigreeData,
      format: 'png',
    }, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;

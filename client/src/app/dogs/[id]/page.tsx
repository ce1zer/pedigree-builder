'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Users, TreePine, User } from 'lucide-react';
import { Dog, DogFormData } from '@/types';
import { dogsApi } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const PHOTO_SIZE = 'h-32 w-32';
const USER_ICON_SIZE = 'h-16 w-16';

// Pedigree generation interface
interface PedigreeGeneration {
  generation: number;
  dogs: (Dog | null)[];
}

// Helper function to fetch a dog by ID
const fetchDogById = async (dogId: string): Promise<Dog | null> => {
  try {
    const response = await dogsApi.getById(dogId);
    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.warn(`Failed to fetch dog with ID ${dogId}:`, error);
    return null;
  }
};

// Helper function to build pedigree generations recursively
const buildPedigreeGenerations = async (rootDog: Dog): Promise<PedigreeGeneration[]> => {
  const generations: PedigreeGeneration[] = [
    {
      generation: 0,
      dogs: [rootDog]
    }
  ];

  // Generation 1: Parents
  const parents: (Dog | null)[] = [];
  if (rootDog.father_id) {
    parents.push(await fetchDogById(rootDog.father_id));
  } else {
    parents.push(null);
  }
  if (rootDog.mother_id) {
    parents.push(await fetchDogById(rootDog.mother_id));
  } else {
    parents.push(null);
  }
  generations.push({
    generation: 1,
    dogs: parents
  });

  // Generation 2: Grandparents
  const grandparents: (Dog | null)[] = [];
  for (const parent of parents) {
    if (parent?.father_id) {
      grandparents.push(await fetchDogById(parent.father_id));
    } else {
      grandparents.push(null);
    }
    if (parent?.mother_id) {
      grandparents.push(await fetchDogById(parent.mother_id));
    } else {
      grandparents.push(null);
    }
  }
  generations.push({
    generation: 2,
    dogs: grandparents
  });

  // Generation 3: Great-grandparents
  const greatGrandparents: (Dog | null)[] = [];
  for (const grandparent of grandparents) {
    if (grandparent?.father_id) {
      greatGrandparents.push(await fetchDogById(grandparent.father_id));
    } else {
      greatGrandparents.push(null);
    }
    if (grandparent?.mother_id) {
      greatGrandparents.push(await fetchDogById(grandparent.mother_id));
    } else {
      greatGrandparents.push(null);
    }
  }
  generations.push({
    generation: 3,
    dogs: greatGrandparents
  });

  return generations;
};

// Basic Info Card Component
interface BasicInfoCardProps {
  dog: Dog;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({ dog }) => (
  <div className="card-spotify">
    <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
    
    <div className="flex items-start space-x-6">
      {/* Profile Image */}
      <div className="flex-shrink-0">
        {dog.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.dog_name}
            className={`${PHOTO_SIZE} rounded-xl object-cover`}
          />
        ) : (
          <div className={`${PHOTO_SIZE} bg-gray-800 rounded-xl flex items-center justify-center`}>
            <User className={`${USER_ICON_SIZE} text-gray-500`} />
          </div>
        )}
      </div>
      
      {/* Dog Information */}
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-gray-400">Dog Name</label>
            <p className="text-lg text-white font-medium">{dog.dog_name}</p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Gender</label>
            <p className="text-lg text-white">
              {dog.gender === 'male' ? 'Male' : 'Female'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Primary Kennel</label>
            <p className="text-lg text-white">{dog.primary_kennel}</p>
          </div>
          
          {dog.secondary_kennel && (
            <div>
              <label className="text-sm font-semibold text-gray-400">Secondary Kennel</label>
              <p className="text-lg text-white">{dog.secondary_kennel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Dog Card Component for Pedigree Tree
interface DogCardProps {
  dog: Dog | null;
  isCurrentDog?: boolean;
  relationship?: string;
}

const DogCard: React.FC<DogCardProps> = ({ dog, isCurrentDog = false, relationship }) => {
  if (!dog) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[200px] opacity-50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 italic">Unknown</p>
            <p className="text-xs text-gray-600">{relationship}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border rounded-lg p-4 min-w-[200px] transition-all hover:bg-gray-750 ${
      isCurrentDog 
        ? 'border-green-500 bg-gray-800/80 shadow-lg shadow-green-500/20' 
        : 'border-gray-700 hover:border-gray-600'
    }`}>
      <div className="flex items-start space-x-3">
        {/* Dog Image */}
        <div className="flex-shrink-0">
          {dog.image_url ? (
            <img
              src={dog.image_url}
              alt={dog.dog_name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Dog Info */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/dogs/${dog.id}`}
            className={`block font-medium hover:text-green-400 transition-colors ${
              isCurrentDog ? 'text-white text-lg' : 'text-white'
            }`}
          >
            {dog.dog_name}
          </Link>
          <p className="text-sm text-gray-400">{dog.primary_kennel}</p>
          <p className="text-xs text-gray-500">
            {dog.gender === 'male' ? 'Male' : 'Female'}
            {relationship && ` • ${relationship}`}
          </p>
        </div>
      </div>
    </div>
  );
};

// Pedigree Tree Component
interface PedigreeTreeProps {
  generations: PedigreeGeneration[];
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ generations }) => {
  const rootDog = generations[0]?.dogs[0];
  
  if (!rootDog) {
    return (
      <div className="card-spotify">
        <h2 className="text-xl font-semibold text-white mb-6">3-Generation Pedigree</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No pedigree data available</p>
        </div>
      </div>
    );
  }

  // Extract dogs from each generation
  const parents = generations[1]?.dogs || [];
  const grandparents = generations[2]?.dogs || [];
  const greatGrandparents = generations[3]?.dogs || [];

  return (
    <div className="card-spotify">
      <h2 className="text-xl font-semibold text-white mb-6">3-Generation Pedigree</h2>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px] space-y-8">
          {/* Generation 0: Current Dog */}
          <div className="flex justify-center">
            <div className="relative">
              <DogCard dog={rootDog} isCurrentDog={true} />
              
              {/* Connection lines to parents */}
              {parents.some(p => p !== null) && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
              )}
            </div>
          </div>

          {/* Generation 1: Parents */}
          {parents.some(p => p !== null) && (
            <div className="flex justify-center space-x-16">
              {/* Father */}
              <div className="relative">
                <DogCard dog={parents[0]} relationship="Father" />
                
                {/* Connection lines to grandparents */}
                {grandparents.some((g, i) => i < 2 && g !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
              
              {/* Mother */}
              <div className="relative">
                <DogCard dog={parents[1]} relationship="Mother" />
                
                {/* Connection lines to grandparents */}
                {grandparents.some((g, i) => i >= 2 && g !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
            </div>
          )}

          {/* Generation 2: Grandparents */}
          {grandparents.some(g => g !== null) && (
            <div className="flex justify-center space-x-8">
              {/* Father's Father */}
              <div className="relative">
                <DogCard dog={grandparents[0]} relationship="Father's Father" />
                
                {/* Connection lines to great-grandparents */}
                {greatGrandparents.some((gg, i) => i < 2 && gg !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
              
              {/* Father's Mother */}
              <div className="relative">
                <DogCard dog={grandparents[1]} relationship="Father's Mother" />
                
                {/* Connection lines to great-grandparents */}
                {greatGrandparents.some((gg, i) => i >= 2 && i < 4 && gg !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
              
              {/* Mother's Father */}
              <div className="relative">
                <DogCard dog={grandparents[2]} relationship="Mother's Father" />
                
                {/* Connection lines to great-grandparents */}
                {greatGrandparents.some((gg, i) => i >= 4 && i < 6 && gg !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
              
              {/* Mother's Mother */}
              <div className="relative">
                <DogCard dog={grandparents[3]} relationship="Mother's Mother" />
                
                {/* Connection lines to great-grandparents */}
                {greatGrandparents.some((gg, i) => i >= 6 && gg !== null) && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
                )}
              </div>
            </div>
          )}

          {/* Generation 3: Great-grandparents */}
          {greatGrandparents.some(gg => gg !== null) && (
            <div className="flex justify-center space-x-4">
              {/* Father's Father's Father */}
              <DogCard dog={greatGrandparents[0]} relationship="Father's Father's Father" />
              
              {/* Father's Father's Mother */}
              <DogCard dog={greatGrandparents[1]} relationship="Father's Father's Mother" />
              
              {/* Father's Mother's Father */}
              <DogCard dog={greatGrandparents[2]} relationship="Father's Mother's Father" />
              
              {/* Father's Mother's Mother */}
              <DogCard dog={greatGrandparents[3]} relationship="Father's Mother's Mother" />
              
              {/* Mother's Father's Father */}
              <DogCard dog={greatGrandparents[4]} relationship="Mother's Father's Father" />
              
              {/* Mother's Father's Mother */}
              <DogCard dog={greatGrandparents[5]} relationship="Mother's Father's Mother" />
              
              {/* Mother's Mother's Father */}
              <DogCard dog={greatGrandparents[6]} relationship="Mother's Mother's Father" />
              
              {/* Mother's Mother's Mother */}
              <DogCard dog={greatGrandparents[7]} relationship="Mother's Mother's Mother" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main DogProfile component
const DogProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [pedigreeGenerations, setPedigreeGenerations] = useState<PedigreeGeneration[]>([]);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DogFormData>();

  const selectedGender = watch('gender');

  // Load dog data
  const loadDog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getById(id!);
      
      if (response.success && response.data) {
        setDog(response.data);
        setValue('dog_name', response.data.dog_name);
        setValue('primary_kennel', response.data.primary_kennel);
        setValue('secondary_kennel', response.data.secondary_kennel || '');
        setValue('gender', response.data.gender);
        setValue('father_id', response.data.father_id || '');
        setValue('mother_id', response.data.mother_id || '');
      } else {
        toast.error(response.error || 'Dog not found');
        router.push('/');
      }
    } catch (error) {
      toast.error('Error loading dog profile');
    } finally {
      setLoading(false);
    }
  }, [id, router, setValue]);

  // Load available dogs for parent selection
  const loadAvailableDogs = useCallback(async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        const filtered = response.data.filter(d => d.id !== id);
        setAvailableDogs(filtered);
      }
    } catch (error) {
      // Silent fail
    }
  }, [id]);

  // Load pedigree generations
  const loadPedigreeGenerations = useCallback(async () => {
    if (!dog) return;
    
    try {
      setPedigreeLoading(true);
      const generations = await buildPedigreeGenerations(dog);
      setPedigreeGenerations(generations);
    } catch (error) {
      console.error('Error loading pedigree generations:', error);
      toast.error('Error loading pedigree data');
    } finally {
      setPedigreeLoading(false);
    }
  }, [dog]);

  // Handle form update
  const handleUpdate = useCallback(async (data: DogFormData) => {
    try {
      setIsSubmitting(true);
      const response = await dogsApi.update(id!, data);
      
      if (response.success) {
        toast.success('Dog profile updated successfully!');
        setIsEditing(false);
        await loadDog(); // Reload dog data
        await loadPedigreeGenerations(); // Reload pedigree data
      } else {
        toast.error(response.error || 'Error updating dog profile');
      }
    } catch (error) {
      toast.error('Error updating dog profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, loadDog, loadPedigreeGenerations]);

  // Load data on component mount
  useEffect(() => {
    if (id) {
      loadDog();
      loadAvailableDogs();
    }
  }, [id, loadDog, loadAvailableDogs]);

  // Load pedigree when dog data is available
  useEffect(() => {
    if (dog) {
      loadPedigreeGenerations();
    }
  }, [dog, loadPedigreeGenerations]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Dog not found
  if (!dog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Dog Not Found</h2>
        <Link href="/" className="btn-spotify-primary inline-flex items-center space-x-2">
          <ArrowLeft className={ICON_SIZE} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-spotify-ghost p-2"
          >
            <ArrowLeft className={ICON_SIZE} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">{dog.dog_name}</h1>
            <p className="text-gray-400 mt-2 text-lg">{dog.primary_kennel}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-spotify-secondary inline-flex items-center space-x-2"
          >
            <Edit className={SMALL_ICON_SIZE} />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-8">
          <div className="card-spotify">
            <h2 className="text-xl font-semibold text-white mb-6">Edit Dog Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dog Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Dog Name *
                </label>
                <input
                  type="text"
                  {...register('dog_name', { 
                    required: 'Dog name is required',
                    minLength: { value: 2, message: 'Dog name must be at least 2 characters' }
                  })}
                  className="input-spotify w-full"
                />
                {errors.dog_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.dog_name.message}</p>
                )}
              </div>

              {/* Primary Kennel */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Primary Kennel *
                </label>
                <input
                  type="text"
                  {...register('primary_kennel', { 
                    required: 'Primary kennel is required',
                    minLength: { value: 2, message: 'Primary kennel must be at least 2 characters' }
                  })}
                  className="input-spotify w-full"
                />
                {errors.primary_kennel && (
                  <p className="mt-2 text-sm text-red-400">{errors.primary_kennel.message}</p>
                )}
              </div>

              {/* Secondary Kennel */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Secondary Kennel
                </label>
                <input
                  type="text"
                  {...register('secondary_kennel')}
                  className="input-spotify w-full"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Gender *
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="input-spotify w-full"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-400">{errors.gender.message}</p>
                )}
              </div>

              {/* Father */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Father
                </label>
                <select
                  {...register('father_id')}
                  className="input-spotify w-full"
                >
                  <option value="">No father selected</option>
                  {availableDogs
                    .filter(d => d.gender === 'male')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.dog_name} ({d.primary_kennel})
                      </option>
                    ))}
                </select>
              </div>

              {/* Mother */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Mother
                </label>
                <select
                  {...register('mother_id')}
                  className="input-spotify w-full"
                >
                  <option value="">No mother selected</option>
                  {availableDogs
                    .filter(d => d.gender === 'female')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.dog_name} ({d.primary_kennel})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-spotify-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-spotify-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-8">
          {/* Basic Information */}
          <BasicInfoCard dog={dog} />

          {/* Pedigree Tree */}
          {pedigreeLoading ? (
            <div className="card-spotify">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-gray-400">Loading pedigree...</span>
              </div>
            </div>
          ) : (
            <PedigreeTree generations={pedigreeGenerations} />
          )}

          {/* Metadata */}
          <div className="card-spotify">
            <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2 text-white">{formatDate(dog.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogProfile;
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

// Pedigree Node Component
interface PedigreeNodeProps {
  dog: Dog | null;
  hasChildren?: boolean;
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, hasChildren = false }) => {
  if (!dog) {
    return (
      <div className="w-56 h-28 bg-neutral-900 border-2 border-gray-600 rounded-lg flex items-center p-3 gap-3">
        <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <User className="h-10 w-10 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Unknown</p>
          <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">Unknown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 h-28 bg-neutral-900 border-2 border-blue-500 rounded-lg flex items-center p-3 gap-3 transition-all hover:bg-neutral-800">
      {/* Dog Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        {dog.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.dog_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <User className="h-10 w-10 text-gray-500" />
          </div>
        )}
      </div>
      
      {/* Dog Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase font-medium tracking-wider leading-tight">
          {dog.primary_kennel}
        </p>
        <Link 
          href={`/dogs/${dog.id}`}
          className="text-white uppercase font-bold tracking-wide leading-tight hover:text-blue-400 transition-colors block truncate text-sm"
        >
          {dog.dog_name}
        </Link>
      </div>
    </div>
  );
};

// Pedigree Branch Component
interface PedigreeBranchProps {
  dog: Dog | null;
  children?: React.ReactNode;
  isLeft?: boolean;
}

const PedigreeBranch: React.FC<PedigreeBranchProps> = ({ dog, children, isLeft = false }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Dog Node */}
      <div className="relative">
        <PedigreeNode dog={dog} hasChildren={!!children} />
        {/* Connection line to children */}
        {children && (
          <div className={`absolute top-1/2 ${isLeft ? '-right-3' : '-left-3'} w-6 h-[2px] bg-white transform -translate-y-1/2`}></div>
        )}
      </div>
      
      {/* Children */}
      {children && (
        <div className="mt-8">
          {children}
        </div>
      )}
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
      <div className="bg-neutral-900 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-white mb-8">3-Generation Pedigree</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No pedigree data available</p>
        </div>
      </div>
    );
  }

  // Extract dogs from each generation
  const parents = generations[1]?.dogs || [null, null];
  const grandparents = generations[2]?.dogs || [null, null, null, null];
  const greatGrandparents = generations[3]?.dogs || [null, null, null, null, null, null, null, null];

  // Build the symmetrical tree structure
  const father = parents[0];
  const mother = parents[1];
  
  // Father's lineage (top half)
  const fathersFather = grandparents[0];
  const fathersMother = grandparents[1];
  const fathersFathersFather = greatGrandparents[0];
  const fathersFathersMother = greatGrandparents[1];
  const fathersMothersFather = greatGrandparents[2];
  const fathersMothersMother = greatGrandparents[3];
  
  // Mother's lineage (bottom half)
  const mothersFather = grandparents[2];
  const mothersMother = grandparents[3];
  const mothersFathersFather = greatGrandparents[4];
  const mothersFathersMother = greatGrandparents[5];
  const mothersMothersFather = greatGrandparents[6];
  const mothersMothersMother = greatGrandparents[7];

  return (
    <div className="bg-neutral-900 rounded-lg p-8">
      <h2 className="text-xl font-semibold text-white mb-8">3-Generation Pedigree</h2>
      
      <div className="w-full">
        <div className="flex justify-center items-start gap-8">
          {/* 1st Generation: Parents */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="h-6 bg-blue-500 rounded-sm mb-2 w-32"></div>
              <p className="text-xs text-white uppercase font-bold tracking-wider">1st Generation</p>
            </div>
            
            <div className="flex flex-col gap-8">
              {/* Father */}
              <div className="relative">
                <PedigreeNode dog={father} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
              
              {/* Mother */}
              <div className="relative">
                <PedigreeNode dog={mother} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* 2nd Generation: Grandparents */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="h-6 bg-blue-500 rounded-sm mb-2 w-32"></div>
              <p className="text-xs text-white uppercase font-bold tracking-wider">2nd Generation</p>
            </div>
            
            <div className="flex flex-col gap-8">
              {/* Father's Father */}
              <div className="relative">
                <PedigreeNode dog={fathersFather} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
              
              {/* Father's Mother */}
              <div className="relative">
                <PedigreeNode dog={fathersMother} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
              
              {/* Mother's Father */}
              <div className="relative">
                <PedigreeNode dog={mothersFather} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
              
              {/* Mother's Mother */}
              <div className="relative">
                <PedigreeNode dog={mothersMother} hasChildren={true} />
                <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-white transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* 3rd Generation: Great-grandparents */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="h-6 bg-blue-500 rounded-sm mb-2 w-32"></div>
              <p className="text-xs text-white uppercase font-bold tracking-wider">3rd Generation</p>
            </div>
            
            <div className="flex flex-col gap-8">
              {/* Father's Father's Father */}
              <PedigreeNode dog={fathersFathersFather} />
              
              {/* Father's Father's Mother */}
              <PedigreeNode dog={fathersFathersMother} />
              
              {/* Father's Mother's Father */}
              <PedigreeNode dog={fathersMothersFather} />
              
              {/* Father's Mother's Mother */}
              <PedigreeNode dog={fathersMothersMother} />
              
              {/* Mother's Father's Father */}
              <PedigreeNode dog={mothersFathersFather} />
              
              {/* Mother's Father's Mother */}
              <PedigreeNode dog={mothersFathersMother} />
              
              {/* Mother's Mother's Father */}
              <PedigreeNode dog={mothersMothersFather} />
              
              {/* Mother's Mother's Mother */}
              <PedigreeNode dog={mothersMothersMother} />
            </div>
          </div>
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
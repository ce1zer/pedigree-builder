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

// Pedigree Node Component - Matches SVG design
interface PedigreeNodeProps {
  dog: Dog | null;
  size?: 'large' | 'medium' | 'small';
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, size = 'medium' }) => {
  // Size classes - proportional to container size
  // 1st gen: 100%, 2nd gen: 50%, 3rd gen: 25%
  const sizeClasses = {
    large: 'w-full h-full',      // 1st generation - fills 100% of container
    medium: 'w-full h-full',     // 2nd generation - fills 50% container (which is 50% of 1st gen)
    small: 'w-full h-full'       // 3rd generation - fills 25% container (which is 25% of 1st gen)
  };

  // Image sizes - always square, scale proportionally
  // Use aspect-square to ensure square images
  const imageSizeClasses = {
    large: 'w-1/3 aspect-square',        // Square image, 1/3 width of tile
    medium: 'w-1/3 aspect-square',      // Square image, 1/3 width of tile
    small: 'w-1/3 aspect-square'        // Square image, 1/3 width of tile
  };

  const textSizeClasses = {
    large: {
      kennel: 'text-sm',
      name: 'text-lg'
    },
    medium: {
      kennel: 'text-xs',
      name: 'text-sm'
    },
    small: {
      kennel: 'text-[10px]',
      name: 'text-xs'
    }
  };

  const isUnknown = !dog;
  const borderColor = isUnknown ? 'border-gray-600' : 'border-blue-500';
  const bgColor = isUnknown ? 'bg-neutral-800' : 'bg-neutral-900';

  return (
    <div className={`${sizeClasses[size]} ${bgColor} ${borderColor} border-2 rounded flex items-center p-3 gap-3`}>
      {/* Square Image */}
      <div className={`${imageSizeClasses[size]} rounded overflow-hidden flex-shrink-0`}>
        {dog?.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.dog_name || 'Unknown'}
            className="w-full h-full object-cover aspect-square"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center aspect-square">
            <User className="w-1/2 h-1/2 text-gray-500" />
          </div>
        )}
      </div>
      
      {/* Dog Info - Vertical Layout */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className={`${textSizeClasses[size].kennel} text-white text-opacity-70 uppercase font-medium tracking-wider leading-tight`}>
          {isUnknown ? 'UNKNOWN' : (dog.primary_kennel || '')}
        </p>
        {dog ? (
          <Link 
            href={`/dogs/${dog.id}`}
            className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight hover:text-blue-400 transition-colors block truncate mt-1`}
          >
            {dog.dog_name}
          </Link>
        ) : (
          <p className={`${textSizeClasses[size].name} text-gray-600 uppercase font-bold tracking-wide leading-tight mt-1`}>
            UNKNOWN
          </p>
        )}
      </div>
    </div>
  );
};

// Main Dog Display Component (Top Center)
interface MainDogDisplayProps {
  dog: Dog;
}

const MainDogDisplay: React.FC<MainDogDisplayProps> = ({ dog }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      {/* Main Dog Name - Large */}
      <h2 className="text-6xl font-bold text-white uppercase mb-2 tracking-wide">
        {dog.dog_name}
      </h2>
      {/* Kennel Name */}
      <p className="text-xl text-white text-opacity-70 uppercase font-medium tracking-wider">
        {dog.primary_kennel}
      </p>
    </div>
  );
};

// Pedigree Connector Component - White horizontal lines
interface PedigreeConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  horizontal?: boolean;
}

const PedigreeConnector: React.FC<PedigreeConnectorProps> = ({ from, to, horizontal = true }) => {
  if (horizontal) {
    const width = to.x - from.x;
    return (
      <div 
        className="absolute bg-white h-[2px]"
        style={{
          left: `${from.x}px`,
          top: `${from.y}px`,
          width: `${width}px`
        }}
      />
    );
  }
  // Vertical connector
  const height = to.y - from.y;
  return (
    <div 
      className="absolute bg-white w-[2px]"
      style={{
        left: `${from.x}px`,
        top: `${from.y}px`,
        height: `${height}px`
      }}
    />
  );
};

// Pedigree Tree Component - Father's Lineage Only (Top Half)
interface PedigreeTreeProps {
  generations: PedigreeGeneration[];
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ generations }) => {
  // Extract dogs from each generation - only father's side
  const parents = generations[1]?.dogs || [null, null];
  const grandparents = generations[2]?.dogs || [null, null, null, null];
  const greatGrandparents = generations[3]?.dogs || [null, null, null, null, null, null, null, null];

  // Father's lineage only
  const father = parents[0]; // 1st generation
  
  // 2nd Generation: Father's parents
  const fatherFather = grandparents[0]; // Father's Father
  const fatherMother = grandparents[1]; // Father's Mother
  
  // 3rd Generation: 4 great-grandparents from father's side
  const ffFather = greatGrandparents[0]; // Father's Father's Father
  const ffMother = greatGrandparents[1]; // Father's Father's Mother
  const fmFather = greatGrandparents[2]; // Father's Mother's Father
  const fmMother = greatGrandparents[3]; // Father's Mother's Mother

  return (
    <div className="bg-arbor rounded-lg p-8 w-full">
      <h2 className="text-xl font-semibold text-white mb-8">3-Generation Pedigree (Father's Lineage)</h2>
      
      {/* Generation Labels */}
      <div className="grid grid-cols-3 gap-x-8 mb-8">
        <div className="text-center">
          <p className="text-sm text-white uppercase font-bold tracking-wider">1st generation</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-white uppercase font-bold tracking-wider">2nd generation</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-white uppercase font-bold tracking-wider">3rd generation</p>
        </div>
      </div>

      {/* Pedigree Tree Layout - 3 Column Grid with Height Proportions */}
      <div className="grid grid-cols-3 gap-x-8 w-full" style={{ height: '300px' }}>
        {/* Column 1: Father (1st Generation) - 100% height */}
        <div className="flex flex-col h-full">
          <div className="relative h-full flex items-center justify-center">
            <PedigreeNode dog={father} size="large" />
            {/* Connection lines to 2nd generation - horizontal white lines */}
            <div className="absolute top-1/4 left-full w-8 h-[2px] bg-white z-10"></div>
            <div className="absolute top-3/4 left-full w-8 h-[2px] bg-white z-10"></div>
          </div>
        </div>

        {/* Column 2: Grandparents (2nd Generation) - 2 containers of 50% height each */}
        <div className="flex flex-col h-full">
          {/* Father's Father - 50% height */}
          <div className="relative h-1/2 flex items-center justify-center">
            <PedigreeNode dog={fatherFather} size="medium" />
            {/* Connection lines to 3rd generation */}
            <div className="absolute top-1/4 left-full w-8 h-[2px] bg-white z-10"></div>
            <div className="absolute top-3/4 left-full w-8 h-[2px] bg-white z-10"></div>
          </div>
          
          {/* Father's Mother - 50% height */}
          <div className="relative h-1/2 flex items-center justify-center">
            <PedigreeNode dog={fatherMother} size="medium" />
            {/* Connection lines to 3rd generation */}
            <div className="absolute top-1/4 left-full w-8 h-[2px] bg-white z-10"></div>
            <div className="absolute top-3/4 left-full w-8 h-[2px] bg-white z-10"></div>
          </div>
        </div>

        {/* Column 3: Great-grandparents (3rd Generation) - 4 containers of 25% height each */}
        <div className="flex flex-col h-full">
          {/* Father's Father's Father - 25% height */}
          <div className="relative h-1/4 flex items-center justify-center">
            <PedigreeNode dog={ffFather} size="small" />
          </div>
          
          {/* Father's Father's Mother - 25% height */}
          <div className="relative h-1/4 flex items-center justify-center">
            <PedigreeNode dog={ffMother} size="small" />
          </div>
          
          {/* Father's Mother's Father - 25% height */}
          <div className="relative h-1/4 flex items-center justify-center">
            <PedigreeNode dog={fmFather} size="small" />
          </div>
          
          {/* Father's Mother's Mother - 25% height */}
          <div className="relative h-1/4 flex items-center justify-center">
            <PedigreeNode dog={fmMother} size="small" />
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
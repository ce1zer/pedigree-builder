'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Users, TreePine } from 'lucide-react';
import { Dog, DogFormData } from '@/types';
import { dogsApi } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const DogProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<DogFormData>();

  const selectedGender = watch('gender');

  useEffect(() => {
    if (id) {
      loadDog();
      loadAvailableDogs();
    }
  }, [id]);

  const loadDog = async () => {
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
  };

  const loadAvailableDogs = async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        const filtered = response.data.filter(d => d.id !== id);
        setAvailableDogs(filtered);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleUpdate = async (data: DogFormData) => {
    try {
      const response = await dogsApi.update(id!, data);
      
      if (response.success) {
        toast.success('Dog profile updated successfully!');
        setIsEditing(false);
        loadDog(); // Reload dog data
      } else {
        toast.error(response.error || 'Error updating dog profile');
      }
    } catch (error) {
      toast.error('Error updating dog profile');
    }
  };

  const handleGeneratePedigree = async () => {
    try {
      const response = await fetch('/api/pedigree/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rootDogId: id,
          maxGenerations: 5
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // For now, just show the pedigree data in console
        // In a real implementation, you'd navigate to a pedigree viewer page
        console.log('Generated pedigree:', result.data);
        toast.success('Pedigree generated successfully! Check console for data.');
      } else {
        toast.error(result.error || 'Error generating pedigree');
      }
    } catch (error) {
      toast.error('Error generating pedigree');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dog Not Found</h2>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-spotify-ghost p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">{dog.dog_name}</h1>
            <p className="text-gray-400 mt-2 text-lg">{dog.primary_kennel}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGeneratePedigree}
            className="btn-spotify-primary inline-flex items-center space-x-2"
          >
            <TreePine className="h-4 w-4" />
            <span>Pedigree</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-spotify-secondary inline-flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo and Basic Info */}
            <div className="card-spotify">
              <div className="flex items-start space-x-6">
                {dog.image_url ? (
                  <img
                    src={dog.image_url}
                    alt={dog.dog_name}
                    className="h-32 w-32 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 bg-gray-800 rounded-xl flex items-center justify-center">
                    <Users className="h-16 w-16 text-gray-500" />
                  </div>
                )}
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-gray-400">Secondary Kennel</label>
                        <p className="text-lg text-white">{dog.secondary_kennel}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Parents */}
            <div className="card-spotify">
              <h2 className="text-xl font-semibold text-white mb-6">Parents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father */}
                <div>
                  <label className="text-sm font-semibold text-gray-400 mb-3 block">Father</label>
                  {dog.father ? (
                    <div className="p-4 bg-gray-800 rounded-xl">
                      <p className="font-semibold text-white">{dog.father.dog_name}</p>
                      <p className="text-sm text-gray-400">{dog.father.primary_kennel}</p>
                      <Link href={`/dogs/${dog.father.id}`} className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block">
                        View Father's Profile →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No father assigned</p>
                  )}
                </div>

                {/* Mother */}
                <div>
                  <label className="text-sm font-semibold text-gray-400 mb-3 block">Mother</label>
                  {dog.mother ? (
                    <div className="p-4 bg-gray-800 rounded-xl">
                      <p className="font-semibold text-white">{dog.mother.dog_name}</p>
                      <p className="text-sm text-gray-400">{dog.mother.primary_kennel}</p>
                      <Link href={`/dogs/${dog.mother.id}`} className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block">
                        View Mother's Profile →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No mother assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-spotify">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleGeneratePedigree}
                  className="w-full btn-spotify-primary inline-flex items-center justify-center space-x-2"
                >
                  <TreePine className="h-4 w-4" />
                  <span>View Pedigree</span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full btn-spotify-secondary inline-flex items-center justify-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

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
        </div>
      )}
    </div>
  );
};

export default DogProfile;
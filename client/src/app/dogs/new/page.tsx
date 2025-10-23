'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Camera, Save } from 'lucide-react';
import { DogFormData, Dog } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';

const AddDog: React.FC = () => {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DogFormData>({
    defaultValues: {
      dog_name: '',
      primary_kennel: '',
      secondary_kennel: '',
      gender: 'male',
      father_id: '',
      mother_id: '',
    },
  });

  const selectedGender = watch('gender');

  useEffect(() => {
    loadAvailableDogs();
  }, []);

  const loadAvailableDogs = async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        setAvailableDogs(response.data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('photo', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: DogFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await dogsApi.create(data);
      
      if (response.success && response.data) {
        toast.success(`${data.dog_name} has been successfully added!`);
        router.push(`/dogs/${response.data.id}`);
      } else {
        toast.error(response.error || 'Error creating dog');
      }
    } catch (error) {
      toast.error('Error creating dog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="btn-spotify-ghost p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-white">Add New Dog</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Add a new dog profile to your database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Photo Upload */}
        <div className="card-spotify">
          <h2 className="text-xl font-semibold text-white mb-6">Photo</h2>
          
          <div className="flex items-center space-x-6">
            {/* Photo Preview */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-xl object-cover"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-500" />
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <div className="flex-1">
              <label className="btn-spotify-secondary inline-flex items-center space-x-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-400 mt-3">
                JPG, PNG or GIF. Maximum 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card-spotify">
          <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
          
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
                placeholder="e.g. Max, Luna, Buddy"
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
                placeholder="e.g. Golden Kennels"
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
                placeholder="e.g. Sunshine Farms (optional)"
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
          </div>
        </div>

        {/* Parent Selection */}
        <div className="card-spotify">
          <h2 className="text-xl font-semibold text-white mb-6">Parents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-spotify-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-spotify-primary inline-flex items-center space-x-2"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Adding...' : 'Add Dog'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDog;
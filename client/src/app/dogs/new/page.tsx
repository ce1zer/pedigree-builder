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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Dog</h1>
          <p className="text-gray-600 mt-1">
            Add a new dog profile to your database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo</h2>
          
          <div className="flex items-center space-x-6">
            {/* Photo Preview */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <div className="flex-1">
              <label className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG or GIF. Maximum 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dog Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dog Name *
              </label>
              <input
                type="text"
                {...register('dog_name', { 
                  required: 'Dog name is required',
                  minLength: { value: 2, message: 'Dog name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Max, Luna, Buddy"
              />
              {errors.dog_name && (
                <p className="mt-1 text-sm text-red-600">{errors.dog_name.message}</p>
              )}
            </div>

            {/* Primary Kennel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Kennel *
              </label>
              <input
                type="text"
                {...register('primary_kennel', { 
                  required: 'Primary kennel is required',
                  minLength: { value: 2, message: 'Primary kennel must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Golden Kennels"
              />
              {errors.primary_kennel && (
                <p className="mt-1 text-sm text-red-600">{errors.primary_kennel.message}</p>
              )}
            </div>

            {/* Secondary Kennel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Kennel
              </label>
              <input
                type="text"
                {...register('secondary_kennel')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Sunshine Farms (optional)"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parent Selection */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Father */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father
              </label>
              <select
                {...register('father_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother
              </label>
              <select
                {...register('mother_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors space-x-2"
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
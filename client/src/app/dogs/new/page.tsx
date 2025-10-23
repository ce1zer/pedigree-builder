'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Camera, Save } from 'lucide-react';
import { DogFormData, Dog, Gender } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const PHOTO_SIZE = 'h-24 w-24';
const CAMERA_ICON_SIZE = 'h-8 w-8';

// Form validation rules
const VALIDATION_RULES = {
  dog_name: {
    required: 'Dog name is required',
    minLength: { value: 2, message: 'Dog name must be at least 2 characters' }
  },
  primary_kennel: {
    required: 'Primary kennel is required',
    minLength: { value: 2, message: 'Primary kennel must be at least 2 characters' }
  },
  gender: {
    required: 'Gender is required'
  }
} as const;

// Photo upload component
interface PhotoUploadProps {
  photoPreview: string | null;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photoPreview, onPhotoChange }) => (
  <div className="card-spotify">
    <h2 className="text-xl font-semibold text-white mb-6">Photo</h2>
    
    <div className="flex items-center space-x-6">
      {/* Photo Preview */}
      <div className="flex-shrink-0">
        {photoPreview ? (
          <img
            src={photoPreview}
            alt="Preview"
            className={`${PHOTO_SIZE} rounded-xl object-cover`}
          />
        ) : (
          <div className={`${PHOTO_SIZE} bg-gray-800 rounded-xl flex items-center justify-center`}>
            <Camera className={`${CAMERA_ICON_SIZE} text-gray-500`} />
          </div>
        )}
      </div>
      
      {/* Upload Button */}
      <div className="flex-1">
        <label className="btn-spotify-secondary inline-flex items-center space-x-2 cursor-pointer">
          <Upload className={SMALL_ICON_SIZE} />
          <span>Upload Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="hidden"
          />
        </label>
        <p className="text-sm text-gray-400 mt-3">
          JPG, PNG or GIF. Maximum 5MB.
        </p>
      </div>
    </div>
  </div>
);

// Form field component
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, children, error }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-300 mb-3">
      {label} {required && '*'}
    </label>
    {children}
    {error && (
      <p className="mt-2 text-sm text-red-400">{error}</p>
    )}
  </div>
);

// Parent selection component
interface ParentSelectionProps {
  availableDogs: Dog[];
  register: any;
}

const ParentSelection: React.FC<ParentSelectionProps> = ({ availableDogs, register }) => {
  const maleDogs = availableDogs.filter(dog => dog.gender === 'male');
  const femaleDogs = availableDogs.filter(dog => dog.gender === 'female');

  return (
    <div className="card-spotify">
      <h2 className="text-xl font-semibold text-white mb-6">Parents</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Father Selection */}
        <FormField label="Father">
          <select
            {...register('father_id')}
            className="input-spotify w-full"
          >
            <option value="">No father selected</option>
            {maleDogs.map(dog => (
              <option key={dog.id} value={dog.id}>
                {dog.dog_name} ({dog.primary_kennel})
              </option>
            ))}
          </select>
        </FormField>

        {/* Mother Selection */}
        <FormField label="Mother">
          <select
            {...register('mother_id')}
            className="input-spotify w-full"
          >
            <option value="">No mother selected</option>
            {femaleDogs.map(dog => (
              <option key={dog.id} value={dog.id}>
                {dog.dog_name} ({dog.primary_kennel})
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
};

// Main AddDog component
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

  // Load available dogs for parent selection
  const loadAvailableDogs = useCallback(async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        setAvailableDogs(response.data);
      }
    } catch (error) {
      // Silent fail - parent selection is optional
      console.warn('Failed to load available dogs for parent selection');
    }
  }, []);

  // Handle photo file selection
  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [setValue]);

  // Handle form submission
  const onSubmit = useCallback(async (data: DogFormData) => {
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
      console.error('Error creating dog:', error);
      toast.error('Error creating dog');
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  // Load available dogs on component mount
  useEffect(() => {
    loadAvailableDogs();
  }, [loadAvailableDogs]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="btn-spotify-ghost p-2"
        >
          <ArrowLeft className={ICON_SIZE} />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-white">Add New Dog</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Add a new dog profile to your database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Photo Upload Section */}
        <PhotoUpload 
          photoPreview={photoPreview} 
          onPhotoChange={handlePhotoChange} 
        />

        {/* Basic Information Section */}
        <div className="card-spotify">
          <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dog Name */}
            <div className="md:col-span-2">
              <FormField 
                label="Dog Name" 
                required 
                error={errors.dog_name?.message}
              >
                <input
                  type="text"
                  {...register('dog_name', VALIDATION_RULES.dog_name)}
                  className="input-spotify w-full"
                  placeholder="e.g. Max, Luna, Buddy"
                />
              </FormField>
            </div>

            {/* Primary Kennel */}
            <FormField 
              label="Primary Kennel" 
              required 
              error={errors.primary_kennel?.message}
            >
              <input
                type="text"
                {...register('primary_kennel', VALIDATION_RULES.primary_kennel)}
                className="input-spotify w-full"
                placeholder="e.g. Golden Kennels"
              />
            </FormField>

            {/* Secondary Kennel */}
            <FormField label="Secondary Kennel">
              <input
                type="text"
                {...register('secondary_kennel')}
                className="input-spotify w-full"
                placeholder="e.g. Sunshine Farms (optional)"
              />
            </FormField>

            {/* Gender */}
            <FormField 
              label="Gender" 
              required 
              error={errors.gender?.message}
            >
              <select
                {...register('gender', VALIDATION_RULES.gender)}
                className="input-spotify w-full"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Parent Selection Section */}
        <ParentSelection 
          availableDogs={availableDogs} 
          register={register} 
        />

        {/* Action Buttons */}
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
            <Save className={SMALL_ICON_SIZE} />
            <span>{isSubmitting ? 'Adding...' : 'Add Dog'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDog;
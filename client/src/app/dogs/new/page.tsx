'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Camera, Save, ChevronDown, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { DogFormData, Dog } from '@/types';
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

// Helper function to create image from blob
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

// Helper function to get cropped image blob
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
};

// Photo upload component with cropping
interface PhotoUploadProps {
  photoPreview: string | null;
  onPhotoChange: (file: File) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photoPreview, onPhotoChange }) => {
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = 4 / 3; // 4:3 aspect ratio

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImage], 'cropped-image.jpg', { type: 'image/jpeg' });
      onPhotoChange(file);
      setShowCrop(false);
      setImageSrc(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Error cropping image');
    }
  };

  const handleCancelCrop = () => {
    setShowCrop(false);
    setImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-400 mt-3">
              JPG, PNG or GIF. Maximum 5MB. Crop to 4:3 aspect ratio.
            </p>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCrop && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Crop Image (4:3 aspect ratio)</h3>
            
            <div className="relative w-full" style={{ height: '400px', background: '#1a1a1a' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  },
                }}
              />
            </div>

            <div className="mt-4 flex items-center space-x-4">
              <label className="text-white text-sm">
                Zoom:
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="ml-2 w-32"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={handleCancelCrop}
                className="btn-spotify-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                className="btn-spotify-primary"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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

// Searchable Dropdown Component
interface SearchableDropdownProps {
  options: Dog[];
  value: Dog | null;
  onChange: (dog: Dog | null) => void;
  placeholder: string;
  label: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(dog =>
    dog.dog_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dog.primary_kennel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (dog: Dog) => {
    onChange(dog);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-300 mb-3">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-spotify w-full text-left flex items-center justify-between pr-8"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value ? `${value.dog_name} (${value.primary_kennel})` : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search by name or kennel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm">No dogs found</div>
              ) : (
                filteredOptions.map((dog) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => handleSelect(dog)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      value?.id === dog.id ? 'bg-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-white font-medium">{dog.dog_name}</div>
                    <div className="text-sm text-gray-400">{dog.primary_kennel}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Parent selection component
interface ParentSelectionProps {
  availableDogs: Dog[];
  fatherValue: Dog | null;
  motherValue: Dog | null;
  onFatherChange: (dog: Dog | null) => void;
  onMotherChange: (dog: Dog | null) => void;
}

const ParentSelection: React.FC<ParentSelectionProps> = ({ 
  availableDogs, 
  fatherValue, 
  motherValue,
  onFatherChange,
  onMotherChange
}) => {
  const maleDogs = availableDogs.filter(dog => dog.gender === 'male');
  const femaleDogs = availableDogs.filter(dog => dog.gender === 'female');

  return (
    <div className="card-spotify">
      <h2 className="text-xl font-semibold text-white mb-6">Parents</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Father Selection */}
        <SearchableDropdown
          options={maleDogs}
          value={fatherValue}
          onChange={onFatherChange}
          placeholder="No father selected"
          label="Father"
        />

        {/* Mother Selection */}
        <SearchableDropdown
          options={femaleDogs}
          value={motherValue}
          onChange={onMotherChange}
          placeholder="No mother selected"
          label="Mother"
        />
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
  const [selectedFather, setSelectedFather] = useState<Dog | null>(null);
  const [selectedMother, setSelectedMother] = useState<Dog | null>(null);

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

  // Handle photo file selection (now receives cropped file)
  const handlePhotoChange = useCallback((file: File) => {
    setValue('photo', file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [setValue]);

  // Handle form submission
  const onSubmit = useCallback(async (data: DogFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Submitting dog data:', data);
      const response = await dogsApi.create(data);
      console.log('API response:', response);
      
      if (response.success && response.data) {
        toast.success(`${data.dog_name} has been successfully added!`);
        router.push(`/dogs/${response.data.id}`);
      } else {
        console.error('API error response:', response);
        toast.error(response.error || 'Error creating dog');
      }
    } catch (error: any) {
      console.error('Error creating dog:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || error.message || 'Error creating dog');
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
          fatherValue={selectedFather}
          motherValue={selectedMother}
          onFatherChange={(dog) => {
            setSelectedFather(dog);
            setValue('father_id', dog?.id || '');
          }}
          onMotherChange={(dog) => {
            setSelectedMother(dog);
            setValue('mother_id', dog?.id || '');
          }}
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
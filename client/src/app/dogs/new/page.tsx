'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Camera, Save } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { DogFormData, Dog, Kennel } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';
import { CreatableSelect } from '@/components/CreatableSelect';
import { DogSearchableDropdown } from '@/components/DogSearchableDropdown';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const PHOTO_SIZE = 'h-20 w-20';
const CAMERA_ICON_SIZE = 'h-7 w-7';

// Form validation rules
const VALIDATION_RULES = {
  dog_name: {
    required: 'Dog name is required',
    minLength: { value: 2, message: 'Dog name must be at least 2 characters' }
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

// Inline photo upload component (for use within form card)
interface PhotoUploadInlineProps {
  photoPreview: string | null;
  onPhotoChange: (file: File) => void;
}

const PhotoUploadInline: React.FC<PhotoUploadInlineProps> = ({ photoPreview, onPhotoChange }) => {
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = 4 / 3;

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
      <FormField label="Photo">
        <div className="flex items-center space-x-4">
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
          <div className="flex-1">
            <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
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
            <p className="text-xs text-gray-400 mt-2">
              JPG, PNG or GIF. Maximum 5MB. Crop to 4:3 aspect ratio.
            </p>
          </div>
        </div>
      </FormField>

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
                type="button"
                onClick={handleCancelCrop}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrop}
                className="btn-primary"
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

// Photo upload component with cropping (standalone version - kept for backward compatibility)
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
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-3">Photo</h2>
        
        <div className="flex items-center space-x-4">
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
            <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
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
            <p className="text-xs text-gray-400 mt-2">
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
                type="button"
                onClick={handleCancelCrop}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrop}
                className="btn-primary"
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
    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
      {label} {required && '*'}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-400">{error}</p>
    )}
  </div>
);

type ParentRole = 'father' | 'mother';

interface QuickCreateParentModalProps {
  open: boolean;
  role: ParentRole;
  initialName: string;
  onClose: () => void;
  onCreated: (dog: Dog) => void;
}

const QuickCreateParentModal: React.FC<QuickCreateParentModalProps> = ({
  open,
  role,
  initialName,
  onClose,
  onCreated,
}) => {
  const gender: DogFormData['gender'] = role === 'father' ? 'male' : 'female';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPrimaryKennel, setSelectedPrimaryKennel] = useState<Kennel | null>(null);
  const [selectedSecondaryKennel, setSelectedSecondaryKennel] = useState<Kennel | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DogFormData>({
    defaultValues: {
      dog_name: initialName,
      champion: 'none',
      primary_kennel_id: undefined,
      secondary_kennel_id: undefined,
      gender,
      father_id: '',
      mother_id: '',
      photo: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      dog_name: initialName,
      champion: 'none',
      primary_kennel_id: undefined,
      secondary_kennel_id: undefined,
      gender,
      father_id: '',
      mother_id: '',
      photo: undefined,
    });
    setPhotoPreview(null);
    setSelectedPrimaryKennel(null);
    setSelectedSecondaryKennel(null);
  }, [open, initialName, gender, reset]);

  const handlePhotoChange = useCallback((file: File) => {
    setValue('photo', file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [setValue]);

  const submit = useCallback(async (data: DogFormData) => {
    try {
      setIsSubmitting(true);
      // Ensure gender is locked to the expected parent role.
      data.gender = gender;
      data.father_id = '';
      data.mother_id = '';

      const response = await dogsApi.create(data);
      if (response.success && response.data) {
        toast.success(`${data.dog_name} has been successfully added!`);
        onCreated(response.data);
        onClose();
      } else {
        toast.error(response.error || 'Error creating dog');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Error creating dog');
    } finally {
      setIsSubmitting(false);
    }
  }, [gender, onClose, onCreated]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Add {role === 'father' ? 'Father' : 'Mother'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          This is a quick-create form (no parents here). After saving, it will be selected automatically.
        </p>

        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <FormField label="Dog Name" required error={errors.dog_name?.message}>
            <input
              type="text"
              {...register('dog_name', VALIDATION_RULES.dog_name)}
              className="input w-full"
              placeholder="e.g. Dexter"
              disabled={isSubmitting}
            />
          </FormField>

          {/* Kennels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CreatableSelect
              value={selectedPrimaryKennel}
              onChange={(kennel) => {
                setSelectedPrimaryKennel(kennel);
                setValue('primary_kennel_id', kennel?.id || undefined);
              }}
              placeholder="Select or type to create primary kennel..."
              label="Primary Kennel"
            />

            <CreatableSelect
              value={selectedSecondaryKennel}
              onChange={(kennel) => {
                setSelectedSecondaryKennel(kennel);
                setValue('secondary_kennel_id', kennel?.id || undefined);
              }}
              placeholder="Select or type to create secondary kennel..."
              label="Secondary Kennel"
            />
          </div>

          {/* Champion */}
          <FormField label="Champion" error={errors.champion?.message}>
            <select
              {...register('champion')}
              className="input w-full"
              defaultValue="none"
              disabled={isSubmitting}
            >
              <option value="none">None</option>
              <option value="ch">Ch.</option>
              <option value="dual_ch">Dual Ch.</option>
              <option value="gr_ch">Gr. Ch.</option>
              <option value="dual_gr_ch">Dual Gr. Ch.</option>
              <option value="nw_gr_ch">NW. Gr. Ch.</option>
              <option value="inw_gr_ch">INW. Gr. Ch.</option>
            </select>
          </FormField>

          {/* Gender (locked) */}
          <FormField label="Gender (locked)">
            <input
              type="text"
              value={gender === 'male' ? 'Male' : 'Female'}
              readOnly
              className="input w-full opacity-80"
            />
          </FormField>

          {/* Photo */}
          <PhotoUploadInline photoPreview={photoPreview} onPhotoChange={handlePhotoChange} />

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add dog'}
            </button>
          </div>
        </form>
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
  onCreateFather: (name: string) => void;
  onCreateMother: (name: string) => void;
}

const ParentSelection: React.FC<ParentSelectionProps> = ({ 
  availableDogs, 
  fatherValue, 
  motherValue,
  onFatherChange,
  onMotherChange,
  onCreateFather,
  onCreateMother
}) => {
  const maleDogs = availableDogs.filter(dog => dog.gender === 'male');
  const femaleDogs = availableDogs.filter(dog => dog.gender === 'female');

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-3">Parents</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Father Selection */}
        <DogSearchableDropdown
          options={maleDogs}
          value={fatherValue}
          onChange={onFatherChange}
          placeholder="No father selected"
          label="Father"
          onCreateRequested={onCreateFather}
        />

        {/* Mother Selection */}
        <DogSearchableDropdown
          options={femaleDogs}
          value={motherValue}
          onChange={onMotherChange}
          placeholder="No mother selected"
          label="Mother"
          onCreateRequested={onCreateMother}
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
  const [addAnother, setAddAnother] = useState(true);
  const [creatingParent, setCreatingParent] = useState<{ role: ParentRole; initialName: string } | null>(null);

  const DEFAULT_DOG_FORM: DogFormData = {
    dog_name: '',
    champion: 'none',
    primary_kennel_id: undefined,
    secondary_kennel_id: undefined,
    gender: 'male',
    father_id: '',
    mother_id: '',
    photo: undefined,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<DogFormData>({
    defaultValues: DEFAULT_DOG_FORM,
  });

  const selectedGender = watch('gender');
  const [selectedFather, setSelectedFather] = useState<Dog | null>(null);
  const [selectedMother, setSelectedMother] = useState<Dog | null>(null);
  const [selectedPrimaryKennel, setSelectedPrimaryKennel] = useState<Kennel | null>(null);
  const [selectedSecondaryKennel, setSelectedSecondaryKennel] = useState<Kennel | null>(null);

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
      
      const response = await dogsApi.create(data);
      
      if (response.success && response.data) {
        const newDog = response.data;
        toast.success(`${data.dog_name} has been successfully added!`);
        
        // Optimistically add new dog to available dogs list immediately
        setAvailableDogs(prev => {
          // Check if dog already exists (shouldn't, but prevent duplicates)
          const exists = prev.some(d => d.id === newDog.id);
          if (exists) return prev;
          return [...prev, newDog];
        });
        
        // Dispatch event with new dog data for Layout search
        window.dispatchEvent(new CustomEvent('dog-created', { 
          detail: { newDog } 
        }));
        
        // Also refresh available dogs list in background (for any missed updates)
        loadAvailableDogs().catch(err => {
          console.warn('Background refresh failed, but dog is already added:', err);
        });
        
        if (addAnother) {
          // Reset form and stay on page
          reset(DEFAULT_DOG_FORM);
          setPhotoPreview(null);
          setSelectedFather(null);
          setSelectedMother(null);
          setSelectedPrimaryKennel(null);
          setSelectedSecondaryKennel(null);
          window.scrollTo(0, 0);
        } else {
          router.push(`/dogs/${response.data.id}`);
        }
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
  }, [router, addAnother, reset, DEFAULT_DOG_FORM, loadAvailableDogs]);

  // Load available dogs on component mount
  useEffect(() => {
    loadAvailableDogs();
  }, [loadAvailableDogs]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="btn-ghost p-2"
        >
          <ArrowLeft className={ICON_SIZE} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Dog</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card space-y-6">
          {/* Dog Name */}
          <FormField 
            label="Dog Name" 
            required 
            error={errors.dog_name?.message}
          >
            <input
              type="text"
              {...register('dog_name', VALIDATION_RULES.dog_name)}
              className="input w-full"
              placeholder="e.g. Max, Luna, Buddy"
            />
          </FormField>

          {/* Kennels - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Kennel */}
            <CreatableSelect
              value={selectedPrimaryKennel}
              onChange={(kennel) => {
                setSelectedPrimaryKennel(kennel);
                setValue('primary_kennel_id', kennel?.id || undefined);
              }}
              placeholder="Select or type to create primary kennel..."
              label="Primary Kennel"
            />

            {/* Secondary Kennel */}
            <CreatableSelect
              value={selectedSecondaryKennel}
              onChange={(kennel) => {
                setSelectedSecondaryKennel(kennel);
                setValue('secondary_kennel_id', kennel?.id || undefined);
              }}
              placeholder="Select or type to create secondary kennel..."
              label="Secondary Kennel"
            />
          </div>

          {/* Champion */}
          <FormField 
            label="Champion" 
            error={errors.champion?.message}
          >
            <select
              {...register('champion')}
              className="input w-full"
              defaultValue="none"
            >
              <option value="none">None</option>
              <option value="ch">Ch.</option>
              <option value="dual_ch">Dual Ch.</option>
              <option value="gr_ch">Gr. Ch.</option>
              <option value="dual_gr_ch">Dual Gr. Ch.</option>
              <option value="nw_gr_ch">NW. Gr. Ch.</option>
              <option value="inw_gr_ch">INW. Gr. Ch.</option>
            </select>
          </FormField>

          {/* Gender */}
          <FormField 
            label="Gender" 
            required 
            error={errors.gender?.message}
          >
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="male" 
                  {...register('gender', VALIDATION_RULES.gender)} 
                  className="custom-radio" 
                />
                <span className="text-white">Male</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="female" 
                  {...register('gender', VALIDATION_RULES.gender)} 
                  className="custom-radio" 
                />
                <span className="text-white">Female</span>
              </label>
            </div>
          </FormField>

          {/* Photo */}
          <PhotoUploadInline 
            photoPreview={photoPreview} 
            onPhotoChange={handlePhotoChange} 
          />

          {/* Parents - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Father Selection */}
            <DogSearchableDropdown
              options={availableDogs.filter(d => d.gender === 'male')}
              value={selectedFather}
              onChange={(dog) => {
                setSelectedFather(dog);
                setValue('father_id', dog?.id || '');
              }}
              placeholder="No father selected"
              label="Father"
              onCreateRequested={(name) => setCreatingParent({ role: 'father', initialName: name })}
            />

            {/* Mother Selection */}
            <DogSearchableDropdown
              options={availableDogs.filter(d => d.gender === 'female')}
              value={selectedMother}
              onChange={(dog) => {
                setSelectedMother(dog);
                setValue('mother_id', dog?.id || '');
              }}
              placeholder="No mother selected"
              label="Mother"
              onCreateRequested={(name) => setCreatingParent({ role: 'mother', initialName: name })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addAnother}
                onChange={(e) => setAddAnother(e.target.checked)}
                className="custom-checkbox"
              />
              <span className="text-white text-sm">Add another dog</span>
            </label>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary inline-flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Save className={SMALL_ICON_SIZE} />
                <span>{isSubmitting ? 'Adding...' : 'Add Dog'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <QuickCreateParentModal
        open={!!creatingParent}
        role={creatingParent?.role || 'father'}
        initialName={creatingParent?.initialName || ''}
        onClose={() => setCreatingParent(null)}
        onCreated={(newDog) => {
          setAvailableDogs((prev) => {
            const exists = prev.some((d) => d.id === newDog.id);
            return exists ? prev : [...prev, newDog];
          });

          if (creatingParent?.role === 'father') {
            setSelectedFather(newDog);
            setValue('father_id', newDog.id || '');
          } else {
            setSelectedMother(newDog);
            setValue('mother_id', newDog.id || '');
          }
        }}
      />
    </div>
  );
};

export default AddDog;
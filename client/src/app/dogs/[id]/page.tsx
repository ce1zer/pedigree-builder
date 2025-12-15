'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Users, TreePine, Download, Upload, Camera, Trash2, ChevronDown, X, Save } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Dog, DogFormData, Kennel } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { CreatableSelect } from '@/components/CreatableSelect';
import { formatDogDisplayName } from '@/utils/dogNameFormatter';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const PHOTO_SIZE = 'h-32 w-32';
const USER_ICON_SIZE = 'h-16 w-16';
const CAMERA_ICON_SIZE = 'h-8 w-8';

// Helper function to get image URL (used for display)
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return url;
};

// Placeholder SVG component (inline for html2canvas compatibility)
const PlaceholderSVG: React.FC<{ className?: string }> = ({ className = "w-3/4 h-3/4 object-contain opacity-60" }) => {
  return (
    <svg 
      viewBox="0 0 156.5 131" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M116.51.46c-.03,1.6-.25,3.52.97,4.76.23.23,5.5,3.02,5.83,3.07,1.4.23,5.23-.81,7.08-.44.71-2.49,2.47-4.43,4.56-5.9-1.1,6.77,3.18,6.02,6.31,9.14,1.55,1.55,2.39,4.14,3.91,5.81,1.16,1.27,3.95,2.38,3.69,4.11l-1.44,2.59c2.9,1.79,5.99.86,7.91,4.56.96,1.85-.03,10.35-.82,12.51-.55,1.52-1.81,2.16-2.32,3.16-.98,1.9-.03,3.04-2.42,4.55-5.35,3.38-8.95,1.11-14.03,1.92-1.78.28-3.51,1.85-5.74,2.24-4.96.86-6.91-2.31-5.78,4.73s5.48,8.82,1.71,17.1c-1.35,2.95-6.66,7.61-6.83,8.12-.88,2.56-.85,6.54-2.07,9.89-2.89,7.94-9.34,13.69-7.94,23.36.66,4.57,4.58,3.71,6.66,6.79,4.91,7.3-8.06,5.94-11.97,4.49-4.49-1.67-3.03-4.95-3.92-8.53-.65-2.63-2.71-3.19-1.55-6.96.26-.86,2.26-3.17,2.26-3.71v-10.71c-3.45,1.68-7.45,2.19-11.24,2.01-2.7-.12-8.58-2.15-9.93-2.02-1.26.12-4.49,4.71-4.99,5.99-1.07,2.75-1.28,15.49-.14,18.06,1.27,2.83,5.42,4.5,4.3,8.27-3.18.61-13.87,2.36-15.83-.23-.56-.75-1.46-4.46-1.45-5.44.02-1.85,2.12-5.04,1.86-5.9-.19-.61-1.39-.91-1.9-1.63-1.11-1.57-2.43-6.99-3.61-9.35s-5.91-8.3-5.78-10.44c.08-1.3,1.42-3.1.85-4.8-1.7-.17-.88,2.08-2.2,3.02-2.63,1.87-6.88-.79-8.51-3.02-5.27,7.71-15.67,5.23-20.59,12.78-.96,1.47-1.47,3.58-2.57,4.9-1.91,2.29-7.58,4.64-5.73,8.7.89,1.96,3.64,1.75,4.96,5,2.39,5.9-3.52,4.77-7.96,4.47-5.02-.34-8.04-.39-9-5.95-1.6-9.26,3.04-9.68,6.2-16.28,1.44-3.02,1.69-6.83,3.28-9.68.77-1.38,2.12-2.18,2.64-3.34.91-2.03,1.04-6.75,1.88-9.58,1.98-6.71,6.48-13.19,12.05-17.35,1.4-1.05,3.62-1.74,4.68-2.79,1.41-1.4,2.06-4.63,3.96-6.5,2.43-2.38,4.72-1.28,4.45-5.91-.39-6.59-7.66-6.63-10.66-11.3-1.12-1.74-1.9-4.03-.29-5.72.83-.72,1,.15,1.42.6,1.29,1.37,2.24,2.94,3.9,4.07,5.17,3.5,13.72,2.55,13.63,11.04,5.45-1.51,12.88-.72,17.94-3.23,2.81-1.4,5.54-6.33,8.5-8.44,2.13-1.52,6.38-2.16,7.31-2.91s3.59-5.38,4.86-6.84c5.52-6.34,12.11-12.03,20.23-14.65L116.01.46h.5Z" 
        fill="#717179"
      />
    </svg>
  );
};

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
    if (!imageSrc || !croppedAreaPixels) {
      console.warn('Cannot crop: missing imageSrc or croppedAreaPixels', { imageSrc: !!imageSrc, croppedAreaPixels: !!croppedAreaPixels });
      return;
    }

    try {
      // Get cropped image as Blob
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Verify the blob is valid
      if (croppedImageBlob.size === 0) {
        throw new Error('Cropped image is empty');
      }
      
      // Create a File object from the blob (this will be saved as photo.jpg)
      const file = new File([croppedImageBlob], 'photo.jpg', { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Verify the file is valid
      if (file.size === 0) {
        throw new Error('Cropped image file is empty');
      }
      
      // Pass the cropped file to the parent component
      onPhotoChange(file);
      
      // Reset crop state
      setShowCrop(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Image cropped successfully! Ready to save.');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Error cropping image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCancelCrop = () => {
    setShowCrop(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cropping existing photo
  const handleCropExisting = async () => {
    if (!photoPreview) return;
    
    try {
      // If it's already a data URL, use it directly
      if (photoPreview.startsWith('data:')) {
        setImageSrc(photoPreview);
        setShowCrop(true);
        return;
      }
      
      // Otherwise, fetch the image and convert to data URL
      // Add cache busting to ensure we get the latest version
      const urlWithCacheBust = photoPreview.includes('?') 
        ? `${photoPreview}&_crop=${Date.now()}` 
        : `${photoPreview}?_crop=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBust, {
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Fetched image is empty');
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageSrc(dataUrl);
        setShowCrop(true);
      };
      reader.onerror = () => {
        throw new Error('Failed to read image');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading existing photo:', error);
      toast.error('Error loading photo for cropping: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <>
      <div className="card">
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
          
          {/* Upload and Crop Buttons */}
          <div className="flex-1 space-y-3">
            <div className="flex space-x-3">
              <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
                <Upload className={SMALL_ICON_SIZE} />
                <span>Upload New Photo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleCropExisting}
                  className="btn-secondary inline-flex items-center space-x-2"
                >
                  <Edit className={SMALL_ICON_SIZE} />
                  <span>Crop Photo</span>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-400">
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
  imageCacheBuster: number;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({ dog, imageCacheBuster }) => (
  <div className="card">
    <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
    
    <div className="flex items-start space-x-6">
      {/* Profile Image */}
      <div className="flex-shrink-0">
        {getImageUrl(dog.image_url) ? (
          <img
            src={`${getImageUrl(dog.image_url)!}?t=${imageCacheBuster}`}
            alt={dog.dog_name}
            className={`${PHOTO_SIZE} rounded-xl object-cover`}
            key={`${dog.image_url}-${imageCacheBuster}`} // Force re-render when image changes
          />
        ) : (
          <div className={`${PHOTO_SIZE} bg-gray-800 rounded-xl flex items-center justify-center`}>
            <PlaceholderSVG />
          </div>
        )}
      </div>
      
      {/* Dog Information */}
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-gray-400">Dog Name</label>
            <p className="text-lg text-white font-medium">{formatDogDisplayName(dog)}</p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Gender</label>
            <p className="text-lg text-white">
              {dog.gender === 'male' ? 'Male' : 'Female'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Primary Kennel</label>
            <p className="text-lg text-white">
              {typeof dog.primary_kennel === 'object' && dog.primary_kennel?.name 
                ? dog.primary_kennel.name 
                : (typeof dog.primary_kennel === 'string' ? dog.primary_kennel : dog.primary_kennel_name || 'N/A')}
            </p>
          </div>
          
          {(dog.secondary_kennel || dog.secondary_kennel_name) && (
            <div>
              <label className="text-sm font-semibold text-gray-400">Secondary Kennel</label>
              <p className="text-lg text-white">
                {typeof dog.secondary_kennel === 'object' && dog.secondary_kennel?.name 
                  ? dog.secondary_kennel.name 
                  : (typeof dog.secondary_kennel === 'string' ? dog.secondary_kennel : dog.secondary_kennel_name || '')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(dog => {
    const primaryKennelName = typeof dog.primary_kennel === 'object' && dog.primary_kennel?.name 
      ? dog.primary_kennel.name 
      : (typeof dog.primary_kennel === 'string' ? dog.primary_kennel : dog.primary_kennel_name || '');
    return (
      dog.dog_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primaryKennelName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Reset selected index when filtered options change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredOptions.length, searchTerm]);

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
      <label className="block text-sm font-semibold text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input w-full text-left flex items-center justify-between pr-8"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value ? `${value.dog_name}${(() => {
              const kennelName = typeof value.primary_kennel === 'object' && value.primary_kennel?.name 
                ? value.primary_kennel.name 
                : (typeof value.primary_kennel === 'string' ? value.primary_kennel : value.primary_kennel_name || '');
              return kennelName ? ` (${kennelName})` : '';
            })()}` : placeholder}
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
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or kennel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => 
                      prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0 && selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
                      handleSelect(filteredOptions[selectedIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring-color)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm">No dogs found</div>
              ) : (
                filteredOptions.map((dog, index) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => handleSelect(dog)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-700 ring-2 ring-[color:var(--ring-color)] ring-inset'
                        : ''
                    } ${
                      value?.id === dog.id ? 'bg-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-white font-medium">{dog.dog_name}</div>
                    {(() => {
                      const kennelName = typeof dog.primary_kennel === 'object' && dog.primary_kennel?.name 
                        ? dog.primary_kennel.name 
                        : (typeof dog.primary_kennel === 'string' ? dog.primary_kennel : dog.primary_kennel_name || '');
                      return kennelName ? (
                        <div className="text-sm text-gray-400">{kennelName}</div>
                      ) : null;
                    })()}
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

// Pedigree Node Component - Matches SVG design
interface PedigreeNodeProps {
  dog: Dog | null;
  size?: 'large' | 'medium' | 'small';
  imageCacheBuster?: number;
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, size = 'medium', imageCacheBuster = 0 }) => {
  // Size classes - proportional to container size
  // 1st gen: 100%, 2nd gen: 50%, 3rd gen: 25%
  const sizeClasses = {
    large: 'w-full h-full',      // 1st generation - fills 100% of container
    medium: 'w-full h-full',     // 2nd generation - fills 50% container (which is 50% of 1st gen)
    small: 'w-full h-full'       // 3rd generation - fills 25% container (which is 25% of 1st gen)
  };

  // Image sizes - 4:3 aspect ratio, scale proportionally
  // Use aspect-[4/3] to ensure 4:3 images
  const imageSizeClasses = {
    large: 'w-2/3 aspect-[4/3]',        // 4:3 image, 2/3 width of tile (bigger for 1st generation)
    medium: 'w-[35%] aspect-[4/3]',      // 4:3 image, 35% width of tile (30% smaller than 50% for 2nd gen)
    small: 'w-1/4 aspect-[4/3]'         // Smaller 4:3 image for 3rd gen, 1/4 width of tile
  };

  const textSizeClasses = {
    large: {
      kennel: 'text-[16.5pt]',
      name: 'text-[19.5pt]'
    },
    medium: {
      kennel: 'text-[14pt]',
      name: 'text-[15.5pt]'
    },
    small: {
      kennel: 'text-[10.75pt]',
      name: 'text-[13pt]'
    }
  };

  const isUnknown = !dog;
  const imageBorderColor = 'border-white';

  // For large size (1st generation), use vertical layout (image on top, text below)
  // For medium and small sizes (2nd and 3rd generation), use horizontal layout (image left, text right)
  const isVerticalLayout = size === 'large';
  // Increase gap for large size (1st gen) by 50%: gap-[7.5px] (7.5px) -> gap-[11.25px] (11.25px)
  const gapClass = size === 'large' ? 'gap-[11.25px]' : 'gap-3';
  
  return (
    <div className={`${sizeClasses[size]} flex ${isVerticalLayout ? 'flex-col items-center justify-center' : 'items-center'} ${gapClass}`}>
      {/* Square Image with Border - Clickable if dog exists */}
      {dog ? (
        <Link 
          href={`/dogs/${dog.id}`} 
          className={`${imageSizeClasses[size]} overflow-hidden ${isVerticalLayout ? 'flex-shrink-0' : 'flex-shrink-0'} ${imageBorderColor} border-2 hover:underline block`}
        >
          {getImageUrl(dog?.image_url) ? (
            <img
              src={`${getImageUrl(dog.image_url)!}?t=${imageCacheBuster}`}
              alt={dog.dog_name || 'Unknown'}
              className="w-full h-full object-cover aspect-[4/3]"
              key={`${dog.image_url}-${imageCacheBuster}`} // Force re-render when image changes
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center aspect-[4/3]">
              <PlaceholderSVG />
            </div>
          )}
        </Link>
      ) : (
        <div className={`${imageSizeClasses[size]} overflow-hidden ${isVerticalLayout ? 'flex-shrink-0' : 'flex-shrink-0'} ${imageBorderColor} border-2`}>
          <div className="w-full h-full bg-gray-800 flex items-center justify-center aspect-[4/3]">
            <PlaceholderSVG />
          </div>
        </div>
      )}
      
      {/* Dog Info - Vertical Layout for text content */}
      <div className={`${isVerticalLayout ? 'w-full' : 'flex-1'} min-w-0 flex flex-col ${isVerticalLayout ? 'items-center text-center' : 'justify-center'}`}>
        <p className={`${textSizeClasses[size].kennel} text-[#717179] uppercase tracking-wider leading-tight font-bebas-neue`}>
            {isUnknown ? 'UNKNOWN' : (() => {
              const championPrefix = dog?.champion === 'ch' ? 'Ch. ' 
                : dog?.champion === 'dual_ch' ? 'Dual Ch. '
                : dog?.champion === 'gr_ch' ? 'Gr. Ch. '
                : dog?.champion === 'dual_gr_ch' ? 'Dual Gr. Ch. '
                : dog?.champion === 'nw_gr_ch' ? 'NW. Gr. Ch. '
                : dog?.champion === 'inw_gr_ch' ? 'INW. Gr. Ch. '
                : '';
              const kennelName = typeof dog.primary_kennel === 'object' && dog.primary_kennel?.name 
                ? dog.primary_kennel.name 
                : (typeof dog.primary_kennel === 'string' ? dog.primary_kennel : dog.primary_kennel_name || '');
              return championPrefix + kennelName;
            })()}
        </p>
        {dog ? (
          <Link 
            href={`/dogs/${dog.id}`}
            className={`${textSizeClasses[size].name} text-white uppercase tracking-wide leading-tight hover:text-[color:var(--ring-color)] hover:underline block truncate mt-[2px] font-bebas-neue`}
          >
            {dog.dog_name}
          </Link>
        ) : (
          <p className={`${textSizeClasses[size].name} text-white uppercase tracking-wide leading-tight mt-[2px] font-bebas-neue`}>
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
      <h2 className="text-6xl font-bold text-white uppercase mb-2 tracking-wide font-bebas-neue">
        {formatDogDisplayName(dog)}
      </h2>
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
  imageCacheBuster: number;
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ generations, imageCacheBuster }) => {
  const exportPedigreeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Extract dogs from each generation - both father's and mother's side
  const parents = generations[1]?.dogs || [null, null];
  const grandparents = generations[2]?.dogs || [null, null, null, null];
  const greatGrandparents = generations[3]?.dogs || [null, null, null, null, null, null, null, null];

  // 1st Generation: Parents
  const father = parents[0]; // Father
  const mother = parents[1]; // Mother
  
  // 2nd Generation: Parents' parents
  const fatherFather = grandparents[0]; // Father's Father
  const fatherMother = grandparents[1]; // Father's Mother
  const motherFather = grandparents[2]; // Mother's Father
  const motherMother = grandparents[3]; // Mother's Mother
  
  // 3rd Generation: 8 great-grandparents (4 from father's side, 4 from mother's side)
  const ffFather = greatGrandparents[0]; // Father's Father's Father
  const ffMother = greatGrandparents[1]; // Father's Father's Mother
  const fmFather = greatGrandparents[2]; // Father's Mother's Father
  const fmMother = greatGrandparents[3]; // Father's Mother's Mother
  const mfFather = greatGrandparents[4]; // Mother's Father's Father
  const mfMother = greatGrandparents[5]; // Mother's Father's Mother
  const mmFather = greatGrandparents[6]; // Mother's Mother's Father
  const mmMother = greatGrandparents[7]; // Mother's Mother's Mother

  const PedigreeTreeContent = () => (
    <>
      {/* Generation Labels */}
      <div className="grid grid-cols-3 gap-x-8 mb-8">
        <div className="text-center">
          <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">1st generation</p>
        </div>
        <div className="text-center">
          <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">2nd generation</p>
        </div>
        <div className="text-center">
          <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">3rd generation</p>
        </div>
      </div>

      {/* Pedigree Tree Layout - 3 Column Grid with Height Proportions */}
      <div className="grid grid-cols-3 gap-x-[0.2rem] w-full items-start">
        {/* Column 1: Parents (1st Generation) */}
        <div className="flex flex-col relative" style={{ height: '100%' }}>
          <div className="relative" style={{ height: '50%' }}>
            <div className="h-full w-full flex items-center justify-center">
              <PedigreeNode dog={father} size="large" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '50%' }}>
            <div className="h-full w-full flex items-center justify-center">
              <PedigreeNode dog={mother} size="large" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
        </div>

        {/* Column 2: Grandparents (2nd Generation) */}
        <div className="flex flex-col relative" style={{ height: '100%' }}>
          <div className="relative" style={{ height: '25%' }}>
            <div className="h-full flex items-center justify-center">
              <PedigreeNode dog={fatherFather} size="medium" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '25%' }}>
            <div className="h-full flex items-center justify-center">
              <PedigreeNode dog={fatherMother} size="medium" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '25%' }}>
            <div className="h-full flex items-center justify-center">
              <PedigreeNode dog={motherFather} size="medium" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '25%' }}>
            <div className="h-full flex items-center justify-center">
              <PedigreeNode dog={motherMother} size="medium" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
        </div>

        {/* Column 3: Great-grandparents (3rd Generation) */}
        <div className="flex flex-col" style={{ height: '100%' }}>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={ffFather} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={ffMother} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={fmFather} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={fmMother} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={mfFather} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={mfMother} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={mmFather} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
          <div className="relative" style={{ height: '12.5%' }}>
            <div className="h-full flex items-center justify-center py-1">
              <PedigreeNode dog={mmMother} size="small" imageCacheBuster={imageCacheBuster} />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Export pedigree to PNG
  const handleExportToPNG = useCallback(async () => {
    if (!exportPedigreeRef.current) {
      toast.error('Unable to export pedigree');
      return;
    }

    try {
      setIsExporting(true);
      
      // Create a completely isolated clone with only RGB colors
      const createIsolatedClone = (original: HTMLElement): HTMLElement => {
        const clone = original.cloneNode(true) as HTMLElement;
        
        // Remove all classes to prevent stylesheet parsing
        const removeClasses = (el: Element) => {
          el.removeAttribute('class');
          Array.from(el.children).forEach(removeClasses);
        };
        removeClasses(clone);
        
        // Helper to find corresponding original element
        const findOriginalElement = (cloneEl: Element, originalRoot: HTMLElement): HTMLElement | null => {
          // Build a path to find the element
          const path: number[] = [];
          let current: Element | null = cloneEl;
          while (current && current !== clone) {
            const parent: Element | null = current.parentElement;
            if (parent) {
              const index = Array.from(parent.children).indexOf(current);
              path.unshift(index);
            }
            current = parent;
          }
          
          // Navigate to the same element in original
          let originalEl: Element | null = originalRoot;
          for (const index of path) {
            if (originalEl && originalEl.children[index]) {
              originalEl = originalEl.children[index];
            } else {
              return null;
            }
          }
          return originalEl as HTMLElement;
        };
        
        // Apply simple RGB styles to all elements
        const applyRGBStyles = (cloneEl: HTMLElement, originalRoot: HTMLElement) => {
          const originalEl = findOriginalElement(cloneEl, originalRoot);
          if (!originalEl) return;
          
          // Start with inline styles from original (these contain important layout info like height: '100%')
          const existingInlineStyle = cloneEl.getAttribute('style') || '';
          const inlineStyleMap = new Map<string, string>();
          if (existingInlineStyle) {
            existingInlineStyle.split(';').forEach(decl => {
              const [prop, value] = decl.split(':').map(s => s.trim());
              if (prop && value) {
                inlineStyleMap.set(prop, value);
              }
            });
          }
          
          const computed = window.getComputedStyle(originalEl);
          
          // Get all layout properties
          const display = computed.display;
          const flexDirection = computed.flexDirection;
          const flexWrap = computed.flexWrap;
          const alignItems = computed.alignItems;
          const alignContent = computed.alignContent;
          const justifyContent = computed.justifyContent;
          const flexBasis = computed.flexBasis;
          const flexGrow = computed.flexGrow;
          const flexShrink = computed.flexShrink;
          const width = computed.width;
          const height = computed.height;
          const minWidth = computed.minWidth;
          const maxWidth = computed.maxWidth;
          const minHeight = computed.minHeight;
          const maxHeight = computed.maxHeight;
          const padding = computed.padding;
          const paddingTop = computed.paddingTop;
          const paddingRight = computed.paddingRight;
          const paddingBottom = computed.paddingBottom;
          const paddingLeft = computed.paddingLeft;
          const margin = computed.margin;
          const marginTop = computed.marginTop;
          const marginRight = computed.marginRight;
          const marginBottom = computed.marginBottom;
          const marginLeft = computed.marginLeft;
          const gap = computed.gap; // Includes updated spacing: gap-[11.25px] for 1st gen
          const columnGap = computed.columnGap;
          const rowGap = computed.rowGap;
          const gridTemplateColumns = computed.gridTemplateColumns;
          const gridTemplateRows = computed.gridTemplateRows;
          const gridColumn = computed.gridColumn;
          const gridRow = computed.gridRow;
          const gridColumnStart = computed.gridColumnStart;
          const gridColumnEnd = computed.gridColumnEnd;
          const gridRowStart = computed.gridRowStart;
          const gridRowEnd = computed.gridRowEnd;
          const position = computed.position;
          const top = computed.top;
          const left = computed.left;
          const right = computed.right;
          const bottom = computed.bottom;
          const zIndex = computed.zIndex;
          const borderRadius = computed.borderRadius;
          const borderWidth = computed.borderWidth;
          const borderStyle = computed.borderStyle;
          const fontSize = computed.fontSize;
          const fontFamily = computed.fontFamily;
          const fontWeight = computed.fontWeight;
          const textAlign = computed.textAlign;
          const textTransform = computed.textTransform;
          const aspectRatio = computed.aspectRatio;
          const boxSizing = computed.boxSizing;
          const overflow = computed.overflow;
          const overflowX = computed.overflowX;
          const overflowY = computed.overflowY;
          const objectFit = computed.objectFit;
          const objectPosition = computed.objectPosition;
          const lineHeight = computed.lineHeight;
          const letterSpacing = computed.letterSpacing;
          const whiteSpace = computed.whiteSpace;
          const textOverflow = computed.textOverflow;
          const textDecoration = computed.textDecoration;
          const textDecorationLine = computed.textDecorationLine;
          const verticalAlign = computed.verticalAlign;
          const visibility = computed.visibility;
          const opacity = computed.opacity;
          
          // Helper to set style only if not already in inline styles (preserve inline styles)
          const setStyleIfNotInline = (prop: string, value: string) => {
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (!inlineStyleMap.has(prop) && !inlineStyleMap.has(camelProp)) {
              cloneEl.style.setProperty(prop, value);
            }
          };
          
          // Apply all layout styles (but preserve inline styles)
          if (display) setStyleIfNotInline('display', display);
          if (flexDirection) setStyleIfNotInline('flex-direction', flexDirection);
          if (flexWrap) setStyleIfNotInline('flex-wrap', flexWrap);
          if (alignItems) setStyleIfNotInline('align-items', alignItems);
          if (alignContent) setStyleIfNotInline('align-content', alignContent);
          if (justifyContent) setStyleIfNotInline('justify-content', justifyContent);
          if (flexBasis) setStyleIfNotInline('flex-basis', flexBasis);
          if (flexGrow) setStyleIfNotInline('flex-grow', flexGrow);
          if (flexShrink) setStyleIfNotInline('flex-shrink', flexShrink);
          if (width) setStyleIfNotInline('width', width);
          if (height) setStyleIfNotInline('height', height);
          if (minWidth) setStyleIfNotInline('min-width', minWidth);
          if (maxWidth) setStyleIfNotInline('max-width', maxWidth);
          if (minHeight) setStyleIfNotInline('min-height', minHeight);
          if (maxHeight) setStyleIfNotInline('max-height', maxHeight);
          if (padding) setStyleIfNotInline('padding', padding);
          if (paddingTop) setStyleIfNotInline('padding-top', paddingTop);
          if (paddingRight) setStyleIfNotInline('padding-right', paddingRight);
          if (paddingBottom) setStyleIfNotInline('padding-bottom', paddingBottom);
          if (paddingLeft) setStyleIfNotInline('padding-left', paddingLeft);
          if (margin) setStyleIfNotInline('margin', margin);
          if (marginTop) setStyleIfNotInline('margin-top', marginTop); // Includes updated spacing: mt-[2px] for kennel-dog name spacing
          if (marginRight) setStyleIfNotInline('margin-right', marginRight);
          if (marginBottom) setStyleIfNotInline('margin-bottom', marginBottom);
          if (marginLeft) setStyleIfNotInline('margin-left', marginLeft);
          // Reduce gap by 50% for 1st generation (large size) flex containers in export
          if (gap) {
            // Check if this is a 1st generation container (flex-direction: column with gap around 11.25px)
            const isFirstGenContainer = flexDirection === 'column';
            if (isFirstGenContainer) {
              const reduceGap = (value: string): string => {
                if (!value || value === '0' || value === '0px') return value;
                // Try to parse as pixel value
                const pxMatch = value.match(/^([\d.]+)px$/);
                if (pxMatch) {
                  const num = parseFloat(pxMatch[1]);
                  // If gap is around 11.25px (1st generation: 10.5-12px range, but not exactly 12px for 3rd gen)
                  // Target specifically 1st generation gap of 11.25px
                  if (num >= 10.5 && num < 12) {
                    return `${num * 0.5}px`;
                  }
                }
                // Try to parse as rem/em and convert (assuming 16px base)
                const remMatch = value.match(/^([\d.]+)(rem|em)$/);
                if (remMatch) {
                  const num = parseFloat(remMatch[1]);
                  const unit = remMatch[2];
                  const pxEquivalent = num * 16;
                  // If equivalent to 1st generation gap (10.5-12px, but not 12px), reduce by 50%
                  if (pxEquivalent >= 10.5 && pxEquivalent < 12) {
                    return `${num * 0.5}${unit}`;
                  }
                }
                return value;
              };
              const reducedGap = reduceGap(gap);
              if (reducedGap !== gap) {
                cloneEl.style.setProperty('gap', reducedGap);
              } else {
                setStyleIfNotInline('gap', gap);
              }
            } else {
              setStyleIfNotInline('gap', gap);
            }
          }
          if (columnGap) setStyleIfNotInline('column-gap', columnGap);
          if (rowGap) setStyleIfNotInline('row-gap', rowGap);
          if (gridTemplateColumns) setStyleIfNotInline('grid-template-columns', gridTemplateColumns);
          if (gridTemplateRows) setStyleIfNotInline('grid-template-rows', gridTemplateRows);
          if (gridColumn) setStyleIfNotInline('grid-column', gridColumn);
          if (gridRow) setStyleIfNotInline('grid-row', gridRow);
          if (gridColumnStart) setStyleIfNotInline('grid-column-start', gridColumnStart);
          if (gridColumnEnd) setStyleIfNotInline('grid-column-end', gridColumnEnd);
          if (gridRowStart) setStyleIfNotInline('grid-row-start', gridRowStart);
          if (gridRowEnd) setStyleIfNotInline('grid-row-end', gridRowEnd);
          if (position) setStyleIfNotInline('position', position);
          if (top) setStyleIfNotInline('top', top);
          if (left) setStyleIfNotInline('left', left);
          if (right) setStyleIfNotInline('right', right);
          if (bottom) setStyleIfNotInline('bottom', bottom);
          if (zIndex) setStyleIfNotInline('z-index', zIndex);
          if (borderRadius) setStyleIfNotInline('border-radius', borderRadius);
          if (borderWidth) setStyleIfNotInline('border-width', borderWidth);
          if (borderStyle) setStyleIfNotInline('border-style', borderStyle);
          if (fontSize) setStyleIfNotInline('font-size', fontSize);
          if (fontFamily) setStyleIfNotInline('font-family', fontFamily);
          if (textAlign) setStyleIfNotInline('text-align', textAlign);
          if (textTransform) setStyleIfNotInline('text-transform', textTransform);
          if (aspectRatio) setStyleIfNotInline('aspect-ratio', aspectRatio);
          if (boxSizing) setStyleIfNotInline('box-sizing', boxSizing);
          if (overflow) setStyleIfNotInline('overflow', overflow);
          if (overflowX) setStyleIfNotInline('overflow-x', overflowX);
          if (overflowY) setStyleIfNotInline('overflow-y', overflowY);
          if (objectFit) setStyleIfNotInline('object-fit', objectFit);
          if (objectPosition) setStyleIfNotInline('object-position', objectPosition);
          if (lineHeight) setStyleIfNotInline('line-height', lineHeight);
          if (letterSpacing) setStyleIfNotInline('letter-spacing', letterSpacing);
          if (textDecoration) setStyleIfNotInline('text-decoration', textDecoration);
          if (textDecorationLine) setStyleIfNotInline('text-decoration-line', textDecorationLine);
          if (verticalAlign) setStyleIfNotInline('vertical-align', verticalAlign);
          if (visibility) setStyleIfNotInline('visibility', visibility);
          if (opacity) setStyleIfNotInline('opacity', opacity);
          
          // Force simple RGB colors - don't care about exact colors
          const tagName = cloneEl.tagName.toLowerCase();
          
          // Force regular font weight for all pedigree tree text
          if (tagName === 'p' || tagName === 'a' || tagName === 'span') {
            cloneEl.style.setProperty('font-weight', '400');
          } else if (fontWeight) {
            setStyleIfNotInline('font-weight', fontWeight);
          }
          
          // For images, ensure proper rendering
          if (tagName === 'img') {
            const imgEl = cloneEl as HTMLImageElement;
            const originalImg = originalEl as HTMLImageElement;
            
            // Copy the exact src from the original (with cache busting if present)
            if (originalImg.src) {
              imgEl.src = originalImg.src;
            }
            
            // Ensure images maintain aspect ratio and don't distort
            if (objectFit) {
              cloneEl.style.setProperty('object-fit', objectFit);
            } else {
              cloneEl.style.setProperty('object-fit', 'cover');
            }
            if (objectPosition) {
              cloneEl.style.setProperty('object-position', objectPosition);
            }
            
            // Preserve exact dimensions from computed styles
            const imgWidth = computed.width;
            const imgHeight = computed.height;
            if (imgWidth && imgWidth !== 'auto') {
              cloneEl.style.setProperty('width', imgWidth);
            }
            if (imgHeight && imgHeight !== 'auto') {
              cloneEl.style.setProperty('height', imgHeight);
            }
            
            // Preserve aspect ratio
            if (aspectRatio) {
              cloneEl.style.setProperty('aspect-ratio', aspectRatio);
            }
            
            // Ensure image is visible
            cloneEl.style.setProperty('visibility', 'visible');
            cloneEl.style.setProperty('opacity', '1');
          }
          
          // For text elements, preserve exact layout and alignment
          if (tagName === 'p' || tagName === 'span' || tagName === 'a' || tagName === 'div' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
            // Ensure text is visible
            cloneEl.style.setProperty('visibility', 'visible');
            cloneEl.style.setProperty('opacity', '1');
            
            // Reduce top spacing by 50% for text elements in export
            const reduceTopSpacing = (value: string): string => {
              if (!value || value === '0' || value === '0px') return value;
              const match = value.match(/^([\d.]+)(px|rem|em|pt)$/);
              if (match) {
                const num = parseFloat(match[1]);
                const unit = match[2];
                return `${num * 0.5}${unit}`;
              }
              return value;
            };
            
            // Reduce margin-top by 50%
            if (marginTop && marginTop !== '0px') {
              const reducedMarginTop = reduceTopSpacing(marginTop);
              cloneEl.style.setProperty('margin-top', reducedMarginTop);
            }
            
            // Reduce padding-top by 50%
            if (paddingTop && paddingTop !== '0px') {
              const reducedPaddingTop = reduceTopSpacing(paddingTop);
              cloneEl.style.setProperty('padding-top', reducedPaddingTop);
            }
            
            // Preserve white-space to maintain exact text layout (keep nowrap if set)
            if (whiteSpace) setStyleIfNotInline('white-space', whiteSpace);
            // Preserve text-overflow to maintain exact text behavior
            if (textOverflow) setStyleIfNotInline('text-overflow', textOverflow);
            // Only make overflow visible if it's hidden, but preserve other overflow settings
            if (overflow === 'hidden') {
              cloneEl.style.setProperty('overflow', 'visible');
            } else if (overflow) {
              setStyleIfNotInline('overflow', overflow);
            }
            if (overflowX === 'hidden') {
              cloneEl.style.setProperty('overflow-x', 'visible');
            } else if (overflowX) {
              setStyleIfNotInline('overflow-x', overflowX);
            }
            if (overflowY === 'hidden') {
              cloneEl.style.setProperty('overflow-y', 'visible');
            } else if (overflowY) {
              setStyleIfNotInline('overflow-y', overflowY);
            }
            // Ensure text color is set
            if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
              cloneEl.style.setProperty('color', 'rgb(255, 255, 255)');
            }
          }
          
          // Background colors - make transparent (only images and text should be visible)
          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cloneEl.style.setProperty('background-color', 'transparent');
          }
          
          
          // Border colors - use blue or white
          if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
            // Check if it's a white border for pedigree tiles or connection lines
            const borderStyle = computed.borderStyle;
            if (borderStyle && borderStyle !== 'none') {
              // Use white for pedigree tiles and connection lines
              if (cloneEl.querySelector('img') || cloneEl.textContent?.trim()) {
                cloneEl.style.setProperty('border-color', 'rgb(255, 255, 255)');
              } else {
                cloneEl.style.setProperty('border-color', 'rgb(255, 255, 255)');
              }
            }
          }
          
          // Recursively apply to children
          Array.from(cloneEl.children).forEach((child) => {
            applyRGBStyles(child as HTMLElement, originalRoot);
          });
        };
        
        applyRGBStyles(clone, original);
        return clone;
      };
      
      // Create isolated clone
      const isolatedClone = createIsolatedClone(exportPedigreeRef.current);
      
      // Remove generation labels from export
      // The generation labels are always the first direct child div of the pedigree container
      // Check the first child - if it contains generation label text, remove it
      const firstChild = isolatedClone.firstElementChild;
      if (firstChild) {
        const firstChildText = firstChild.textContent || '';
        if (firstChildText.includes('1st generation') && 
            firstChildText.includes('2nd generation') && 
            firstChildText.includes('3rd generation')) {
          firstChild.remove();
        }
      }
      
      // Wait for all images to load before exporting
      const images = isolatedClone.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        return new Promise<void>((resolve, reject) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn('Image failed to load:', img.src);
              resolve(); // Continue even if image fails
            };
            // Timeout after 5 seconds
            setTimeout(() => {
              console.warn('Image load timeout:', img.src);
              resolve();
            }, 5000);
          }
        });
      });
      
      // Wait for all images to load
      await Promise.all(imagePromises);
      
      // Apply computed styles to the root clone to ensure exact layout match
      const rootComputed = window.getComputedStyle(exportPedigreeRef.current);
      const originalWidth = exportPedigreeRef.current.offsetWidth;
      const originalHeight = exportPedigreeRef.current.offsetHeight;
      
      // Apply all computed styles to root clone for exact match
      isolatedClone.style.width = rootComputed.width;
      isolatedClone.style.height = rootComputed.height;
      isolatedClone.style.maxWidth = rootComputed.maxWidth;
      isolatedClone.style.maxHeight = rootComputed.maxHeight;
      isolatedClone.style.padding = rootComputed.padding;
      isolatedClone.style.margin = rootComputed.margin;
      isolatedClone.style.backgroundColor = 'transparent';
      isolatedClone.style.display = rootComputed.display;
      
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = originalWidth + 'px';
      tempContainer.style.height = originalHeight + 'px';
      tempContainer.style.backgroundColor = 'transparent';
      tempContainer.style.overflow = 'visible';
      
      tempContainer.appendChild(isolatedClone);
      document.body.appendChild(tempContainer);
      
      // Give the browser a moment to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const canvas = await html2canvas(isolatedClone, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: () => false,
          onclone: (clonedDoc) => {
            // Ensure all images in the cloned document are loaded
            const clonedImages = clonedDoc.querySelectorAll('img');
            clonedImages.forEach((img) => {
              const htmlImg = img as HTMLImageElement;
              // Ensure images maintain their aspect ratio
              if (!htmlImg.style.aspectRatio && htmlImg.width && htmlImg.height) {
                htmlImg.style.aspectRatio = `${htmlImg.width} / ${htmlImg.height}`;
              }
            });
            
            // Force regular font weight for all pedigree tree text
            const style = clonedDoc.createElement('style');
            style.textContent = `
              /* Force regular font weight for all pedigree tree text */
              p, a, span {
                font-weight: 400 !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
            // Also directly set font-weight on all text elements in the cloned document
            const allTextElements = clonedDoc.querySelectorAll('p, a, span');
            allTextElements.forEach((el) => {
              (el as HTMLElement).style.setProperty('font-weight', '400', 'important');
            });
          },
        });

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `pedigree-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('Pedigree exported successfully!');
        }, 'image/png');
      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export pedigree');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="card w-full relative">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-white">3-Generation Pedigree</h2>
        <button
          onClick={handleExportToPNG}
          disabled={isExporting}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Exporting...' : 'Export to PNG'}</span>
        </button>
      </div>
      
      {/* On-page tree (restyled via CSS wrapper to match breeding simulator) */}
      <div className="pedigree-screen">
        <PedigreeTreeContent />
      </div>

      {/* Export-only tree (must remain unchanged; used by html2canvas) */}
      <div className="pedigree-export-only" aria-hidden="true">
        <div ref={exportPedigreeRef} data-pedigree-export className="theme-legacy">
          <PedigreeTreeContent />
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [pedigreeGenerations, setPedigreeGenerations] = useState<PedigreeGeneration[]>([]);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageCacheBuster, setImageCacheBuster] = useState<number>(Date.now());

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<DogFormData>();

  const selectedGender = watch('gender');
  const photoFile = watch('photo');
  const [selectedPrimaryKennel, setSelectedPrimaryKennel] = useState<Kennel | null>(null);
  const [selectedSecondaryKennel, setSelectedSecondaryKennel] = useState<Kennel | null>(null);
  const [selectedFather, setSelectedFather] = useState<Dog | null>(null);
  const [selectedMother, setSelectedMother] = useState<Dog | null>(null);

  // Handle photo file selection (now receives cropped file)
  const handlePhotoChange = useCallback((file: File) => {
    setValue('photo', file, { shouldDirty: true, shouldValidate: false });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [setValue]);

  // Load dog data
  const loadDog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getById(id!);
      
      if (response.success && response.data) {
        setDog(response.data);
        setValue('dog_name', response.data.dog_name);
        setValue('champion', response.data.champion || 'none');
        setValue('gender', response.data.gender);
        setValue('father_id', response.data.father_id || '');
        setValue('mother_id', response.data.mother_id || '');
        
        // Set kennel states
        if (response.data.primary_kennel && typeof response.data.primary_kennel === 'object') {
          setSelectedPrimaryKennel(response.data.primary_kennel);
          setValue('primary_kennel_id', response.data.primary_kennel.id);
        } else {
          // Explicitly set to null if no primary kennel
          setSelectedPrimaryKennel(null);
          setValue('primary_kennel_id', undefined);
        }
        if (response.data.secondary_kennel && typeof response.data.secondary_kennel === 'object') {
          setSelectedSecondaryKennel(response.data.secondary_kennel);
          setValue('secondary_kennel_id', response.data.secondary_kennel.id);
        } else {
          // Explicitly set to null if no secondary kennel
          setSelectedSecondaryKennel(null);
          setValue('secondary_kennel_id', undefined);
        }
        
        // Set parent states
        if (response.data.father) {
          setSelectedFather(response.data.father);
        }
        if (response.data.mother) {
          setSelectedMother(response.data.mother);
        }
        
        // Set photo preview if image exists
        if (response.data.image_url) {
          setPhotoPreview(response.data.image_url);
          // Update cache buster to force image refresh
          setImageCacheBuster(Date.now());
        } else {
          setPhotoPreview(null);
        }
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
      
      // Get the photo from the form state (react-hook-form doesn't always include files in data)
      // Try multiple methods to get the photo file
      const currentPhoto = getValues('photo');
      
      // Ensure photo is included if it was set
      // photoFile is already watching 'photo', so use that instead of calling watch again
      const photoToUpload = currentPhoto || photoFile || data.photo;
      
      const formData: DogFormData = {
        ...data,
        photo: photoToUpload,
      };
      
      // Ensure we have a photo file to upload
      if (!formData.photo) {
        console.warn('No photo file found in form data - form will be submitted without photo');
      }
      
      const response = await dogsApi.update(id!, formData);
      
      if (response.success) {
        toast.success('Dog profile updated successfully!');
        setIsEditing(false);
        
        // Clear photo from form after successful update
        setValue('photo', undefined);
        
        // Update cache buster to force image refresh
        setImageCacheBuster(Date.now());
        
        // Update state with response data (single update)
        if (response.data) {
          const updatedDog = response.data;
          
          // Update photo preview with new image URL
          if (updatedDog.image_url) {
            setPhotoPreview(updatedDog.image_url);
          }
          
          // Update dog state once with full response data
          // This will trigger the useEffect to rebuild pedigree automatically
          setDog(updatedDog);
          
          // Update kennel states from response (if kennels are included in response)
          if (updatedDog.primary_kennel && typeof updatedDog.primary_kennel === 'object') {
            setSelectedPrimaryKennel(updatedDog.primary_kennel);
          } else {
            setSelectedPrimaryKennel(null);
          }
          if (updatedDog.secondary_kennel && typeof updatedDog.secondary_kennel === 'object') {
            setSelectedSecondaryKennel(updatedDog.secondary_kennel);
          } else {
            setSelectedSecondaryKennel(null);
          }
        }
      } else {
        toast.error(response.error || 'Error updating dog profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Error updating dog profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, loadDog, loadPedigreeGenerations, photoFile, setValue, getValues]);

  // Handle dog deletion
  const handleDelete = useCallback(async () => {
    if (!dog) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${dog.dog_name}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setIsDeleting(true);
      const response = await dogsApi.delete(id!);
      
      if (response.success) {
        toast.success(`${dog.dog_name} has been deleted successfully`);
        router.push('/');
      } else {
        toast.error(response.error || 'Error deleting dog');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting dog');
    } finally {
      setIsDeleting(false);
    }
  }, [dog, id, router]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Dog not found
  if (!dog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Dog Not Found</h2>
        <Link href="/" className="btn-primary inline-flex items-center space-x-2">
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
            className="btn-ghost p-2"
          >
            <ArrowLeft className={ICON_SIZE} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{formatDogDisplayName(dog)}</h1>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary inline-flex items-center space-x-2"
              disabled={isDeleting}
            >
              <Edit className={SMALL_ICON_SIZE} />
              <span>Edit</span>
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary inline-flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                form="edit-dog-form"
                className="btn-primary inline-flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Save className={SMALL_ICON_SIZE} />
                <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="btn-secondary inline-flex items-center space-x-2 text-red-400 hover:text-red-300"
            disabled={isDeleting || isEditing}
          >
            <Trash2 className={SMALL_ICON_SIZE} />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form id="edit-dog-form" onSubmit={handleSubmit(handleUpdate)} className="space-y-8">
          {/* Photo Upload Section */}
          <PhotoUpload 
            photoPreview={photoPreview} 
            onPhotoChange={handlePhotoChange} 
          />

          <div className="card">
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
                  className="input w-full"
                />
                {errors.dog_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.dog_name.message}</p>
                )}
              </div>

              {/* Kennels - Side by Side */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Champion
                </label>
                <select
                  {...register('champion')}
                  className="input w-full"
                >
                  <option value="none">None</option>
                  <option value="ch">Ch.</option>
                  <option value="dual_ch">Dual Ch.</option>
                  <option value="gr_ch">Gr. Ch.</option>
                  <option value="dual_gr_ch">Dual Gr. Ch.</option>
                  <option value="nw_gr_ch">NW. Gr. Ch.</option>
                  <option value="inw_gr_ch">INW. Gr. Ch.</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Gender *
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value="male" 
                      {...register('gender', { required: 'Gender is required' })} 
                      className="custom-radio" 
                    />
                    <span className="text-white">Male</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value="female" 
                      {...register('gender', { required: 'Gender is required' })} 
                      className="custom-radio" 
                    />
                    <span className="text-white">Female</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-400">{errors.gender.message}</p>
                )}
              </div>

              {/* Parents - Side by Side */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Father Selection */}
                <SearchableDropdown
                  options={availableDogs.filter(d => d.gender === 'male' && d.id !== id)}
                  value={selectedFather}
                  onChange={(dog) => {
                    setSelectedFather(dog);
                    setValue('father_id', dog?.id || '');
                  }}
                  placeholder="No father selected"
                  label="Father"
                />

                {/* Mother Selection */}
                <SearchableDropdown
                  options={availableDogs.filter(d => d.gender === 'female' && d.id !== id)}
                  value={selectedMother}
                  onChange={(dog) => {
                    setSelectedMother(dog);
                    setValue('mother_id', dog?.id || '');
                  }}
                  placeholder="No mother selected"
                  label="Mother"
                />
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-8">
          {/* Basic Information */}
          <BasicInfoCard dog={dog} imageCacheBuster={imageCacheBuster} />

          {/* Pedigree Tree */}
          {pedigreeLoading ? (
            <div className="card">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-gray-400">Loading pedigree...</span>
              </div>
            </div>
          ) : (
            <PedigreeTree generations={pedigreeGenerations} imageCacheBuster={imageCacheBuster} />
          )}

        </div>
      )}
    </div>
  );
};

export default DogProfile;
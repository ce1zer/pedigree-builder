import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera } from 'lucide-react';
import { DogFormData } from '../types';
import { dogsApi } from '../services/api';
import toast from 'react-hot-toast';

const CreateDog: React.FC = () => {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DogFormData>({
    defaultValues: {
      name: '',
      gender: 'male',
      birth_date: '',
      breed: '',
    },
  });

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
        toast.success(`${data.name} is succesvol toegevoegd!`);
        navigate(`/dogs/${response.data.id}`);
      } else {
        toast.error(response.error || 'Fout bij het aanmaken van de hond');
      }
    } catch (error) {
      console.error('Error creating dog:', error);
      toast.error('Fout bij het aanmaken van de hond');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nieuwe Hond Toevoegen</h1>
          <p className="text-gray-600 mt-1">
            Voeg een nieuw hondenprofiel toe aan je database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto</h2>
          
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
              <label className="btn btn-secondary cursor-pointer inline-flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Foto uploaden</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG of GIF. Maximaal 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basisinformatie</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Naam *</label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Naam is verplicht',
                  minLength: { value: 2, message: 'Naam moet minimaal 2 karakters bevatten' }
                })}
                className="input"
                placeholder="Bijv. Max, Luna, Buddy"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Geslacht *</label>
              <select
                {...register('gender', { required: 'Geslacht is verplicht' })}
                className="input"
              >
                <option value="male">Mannetje</option>
                <option value="female">Vrouwtje</option>
              </select>
              {errors.gender && (
                <p className="form-error">{errors.gender.message}</p>
              )}
            </div>

            {/* Birth Date */}
            <div className="form-group">
              <label className="form-label">Geboortedatum *</label>
              <input
                type="date"
                {...register('birth_date', { required: 'Geboortedatum is verplicht' })}
                className="input"
              />
              {errors.birth_date && (
                <p className="form-error">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Breed */}
            <div className="form-group">
              <label className="form-label">Ras *</label>
              <input
                type="text"
                {...register('breed', { 
                  required: 'Ras is verplicht',
                  minLength: { value: 2, message: 'Ras moet minimaal 2 karakters bevatten' }
                })}
                className="input"
                placeholder="Bijv. Golden Retriever, Duitse Herder"
              />
              {errors.breed && (
                <p className="form-error">{errors.breed.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Toevoegen...' : 'Hond Toevoegen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDog;

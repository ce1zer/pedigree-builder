import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, Camera, Save } from 'lucide-react';
import { Dog, DogFormData } from '../types';
import { dogsApi } from '../services/api';
import toast from 'react-hot-toast';

const EditDog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (id) {
      loadDog();
    }
  }, [id]);

  const loadDog = async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getById(id!);
      
      if (response.success && response.data) {
        setDog(response.data);
        
        // Set form values
        setValue('name', response.data.name);
        setValue('gender', response.data.gender);
        setValue('birth_date', response.data.birth_date);
        setValue('breed', response.data.breed);
        
        // Set photo preview if exists
        if (response.data.photo_url) {
          setPhotoPreview(response.data.photo_url);
        }
      } else {
        toast.error(response.error || 'Hond niet gevonden');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading dog:', error);
      toast.error('Fout bij het laden van hondenprofiel');
    } finally {
      setLoading(false);
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
      
      const response = await dogsApi.update(id!, data);
      
      if (response.success && response.data) {
        toast.success(`${data.name} is succesvol bijgewerkt!`);
        navigate(`/dogs/${id}`);
      } else {
        toast.error(response.error || 'Fout bij het bijwerken van de hond');
      }
    } catch (error) {
      console.error('Error updating dog:', error);
      toast.error('Fout bij het bijwerken van de hond');
    } finally {
      setIsSubmitting(false);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Hond niet gevonden</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Terug naar Dashboard
        </button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Bewerk {dog.name}</h1>
          <p className="text-gray-600 mt-1">
            Wijzig de gegevens van dit hondenprofiel
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
                <span>Nieuwe foto uploaden</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG of GIF. Maximaal 5MB. Laat leeg om huidige foto te behouden.
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
            className="btn btn-primary flex items-center space-x-2"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDog;

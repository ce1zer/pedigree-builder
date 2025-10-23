'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, TreePine } from 'lucide-react';
import { Dog, ParentData } from '@/types';
import { dogsApi, pedigreeApi } from '@/services/api';
import toast from 'react-hot-toast';

const DogProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkingParents, setLinkingParents] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [parentData, setParentData] = useState<ParentData>({
    father_id: '',
    mother_id: '',
  });

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
        setParentData({
          father_id: response.data.father?.id || '',
          mother_id: response.data.mother?.id || '',
        });
      } else {
        toast.error(response.error || 'Dog not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading dog:', error);
      toast.error('Error loading dog profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDogs = async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        // Filter out current dog and dogs that would create circular references
        const filtered = response.data.filter(d => 
          d.id !== id && 
          d.gender !== dog?.gender // Can't be same gender as current dog
        );
        setAvailableDogs(filtered);
      }
    } catch (error) {
      console.error('Error loading available dogs:', error);
    }
  };

  const handleLinkParents = async () => {
    try {
      setLinkingParents(true);
      
      const response = await dogsApi.linkParents(id!, parentData);
      
      if (response.success) {
        toast.success('Parents successfully linked!');
        loadDog(); // Reload dog data
      } else {
        toast.error(response.error || 'Error linking parents');
      }
    } catch (error) {
      console.error('Error linking parents:', error);
      toast.error('Error linking parents');
    } finally {
      setLinkingParents(false);
    }
  };

  const handleGeneratePedigree = async () => {
    try {
      const response = await pedigreeApi.generate(id!);
      
      if (response.success && response.data) {
        router.push(`/pedigree/${id}`);
      } else {
        toast.error(response.error || 'Error generating pedigree');
      }
    } catch (error) {
      console.error('Error generating pedigree:', error);
      toast.error('Error generating pedigree');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dog.name}</h1>
            <p className="text-gray-600 mt-1">{dog.breed}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGeneratePedigree}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors space-x-2"
          >
            <TreePine className="h-4 w-4" />
            <span>Pedigree</span>
          </button>
          <Link
            href={`/dogs/${dog.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo and Basic Info */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start space-x-6">
              {dog.photo_url ? (
                <img
                  src={dog.photo_url}
                  alt={dog.name}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-lg text-gray-900">
                      {dog.gender === 'male' ? 'Male' : 'Female'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-lg text-gray-900">{getAge(dog.birth_date)} years old</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Birth Date</label>
                    <p className="text-lg text-gray-900">{formatDate(dog.birth_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Breed</label>
                    <p className="text-lg text-gray-900">{dog.breed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parents */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parents</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Father</label>
                <select
                  value={parentData.father_id}
                  onChange={(e) => setParentData(prev => ({ ...prev, father_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No father selected</option>
                  {availableDogs
                    .filter(d => d.gender === 'male')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.breed})
                      </option>
                    ))}
                </select>
                {dog.father && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">{dog.father.name}</p>
                    <p className="text-sm text-blue-700">{dog.father.breed}</p>
                  </div>
                )}
              </div>

              {/* Mother */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Mother</label>
                <select
                  value={parentData.mother_id}
                  onChange={(e) => setParentData(prev => ({ ...prev, mother_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No mother selected</option>
                  {availableDogs
                    .filter(d => d.gender === 'female')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.breed})
                      </option>
                    ))}
                </select>
                {dog.mother && (
                  <div className="mt-2 p-3 bg-pink-50 rounded-lg">
                    <p className="font-medium text-pink-900">{dog.mother.name}</p>
                    <p className="text-sm text-pink-700">{dog.mother.breed}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleLinkParents}
                disabled={linkingParents}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {linkingParents ? 'Linking...' : 'Link Parents'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleGeneratePedigree}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors space-x-2"
              >
                <TreePine className="h-4 w-4" />
                <span>View Pedigree</span>
              </button>
              <Link
                href={`/dogs/${dog.id}/edit`}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(dog.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-600">Last updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(dog.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DogProfile;

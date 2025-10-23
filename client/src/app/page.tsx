'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Users } from 'lucide-react';
import { Dog } from '../types';
import { dogsApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([]);

  useEffect(() => {
    loadDogs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = dogs.filter(dog =>
        dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDogs(filtered);
    } else {
      setFilteredDogs(dogs);
    }
  }, [searchQuery, dogs]);

  const loadDogs = async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getAll();
      
      if (response.success && response.data) {
        setDogs(response.data);
        setFilteredDogs(response.data);
      } else {
        toast.error(response.error || 'Error loading dogs');
      }
    } catch (error) {
      console.error('Error loading dogs:', error);
      toast.error('Error loading dogs');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dogs Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your dog profiles and pedigrees
          </p>
        </div>
        
        <Link
          href="/dogs/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Dog</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Dogs</p>
              <p className="text-2xl font-bold text-gray-900">{dogs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Male</p>
              <p className="text-2xl font-bold text-gray-900">
                {dogs.filter(dog => dog.gender === 'male').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Female</p>
              <p className="text-2xl font-bold text-gray-900">
                {dogs.filter(dog => dog.gender === 'female').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or breed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Dogs Grid */}
      {filteredDogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No dogs found' : 'No dogs added yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Start by adding your first dog'
            }
          </p>
          {!searchQuery && (
            <Link href="/dogs/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Add First Dog
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDogs.map((dog) => (
            <div key={dog.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {dog.photo_url ? (
                    <img
                      src={dog.photo_url}
                      alt={dog.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {dog.name}
                  </h3>
                  <p className="text-sm text-gray-600">{dog.breed}</p>
                  <p className="text-sm text-gray-500">
                    {dog.gender === 'male' ? 'Male' : 'Female'} • {getAge(dog.birth_date)} years old
                  </p>
                  <p className="text-xs text-gray-400">
                    Born: {formatDate(dog.birth_date)}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/dogs/${dog.id}`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
                <Link
                  href={`/dogs/${dog.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
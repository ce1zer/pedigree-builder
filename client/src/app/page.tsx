'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Users } from 'lucide-react';
import { Dog } from '@/types';
import { dogsApi } from '@/services/api';
import { formatDate, getAge } from '@/utils/helpers';
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
        dog.dog_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dog.primary_kennel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dog.secondary_kennel && dog.secondary_kennel.toLowerCase().includes(searchQuery.toLowerCase()))
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
      toast.error('Error loading dogs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Database</h1>
          <p className="text-gray-400 text-lg">
            Manage your dog profiles and pedigrees
          </p>
        </div>
        
        <Link
          href="/dogs/new"
          className="btn-spotify-primary inline-flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Dog</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-spotify">
          <div className="flex items-center">
            <div className="p-3 bg-gray-800 rounded-xl">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Dogs</p>
              <p className="text-2xl font-bold text-white">{dogs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card-spotify">
          <div className="flex items-center">
            <div className="p-3 bg-gray-800 rounded-xl">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Male</p>
              <p className="text-2xl font-bold text-white">
                {dogs.filter(dog => dog.gender === 'male').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card-spotify">
          <div className="flex items-center">
            <div className="p-3 bg-gray-800 rounded-xl">
              <Users className="h-6 w-6 text-pink-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Female</p>
              <p className="text-2xl font-bold text-white">
                {dogs.filter(dog => dog.gender === 'female').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card-spotify">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or kennel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-spotify w-full pl-12 pr-4"
          />
        </div>
      </div>

      {/* Dogs Grid */}
      {filteredDogs.length === 0 ? (
        <div className="card-spotify-elevated p-12 text-center">
          <Users className="h-16 w-16 text-gray-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">
            {searchQuery ? 'No dogs found' : 'No dogs added yet'}
          </h3>
          <p className="text-gray-400 mb-8 text-lg">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Start by adding your first dog'
            }
          </p>
          {!searchQuery && (
            <Link href="/dogs/new" className="btn-spotify-primary inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add First Dog</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDogs.map((dog) => (
            <div key={dog.id} className="card-spotify group cursor-pointer">
              <div className="flex items-start space-x-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {dog.image_url ? (
                    <img
                      src={dog.image_url}
                      alt={dog.dog_name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                    {dog.dog_name}
                  </h3>
                  <p className="text-sm text-gray-400">{dog.primary_kennel}</p>
                  {dog.secondary_kennel && (
                    <p className="text-sm text-gray-500">{dog.secondary_kennel}</p>
                  )}
                  <p className="text-sm text-gray-400">
                    {dog.gender === 'male' ? 'Male' : 'Female'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(dog.created_at)}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/dogs/${dog.id}`}
                  className="flex-1 btn-spotify-secondary text-center text-sm"
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  View
                </Link>
                <Link
                  href={`/dogs/${dog.id}/edit`}
                  className="flex-1 btn-spotify-secondary text-center text-sm"
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
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
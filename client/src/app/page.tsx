'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Users } from 'lucide-react';
import { Dog } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const router = useRouter();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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

      {/* Search */}
      <div className="card-spotify">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or kennel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-spotify w-full"
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
            <Link 
              key={dog.id} 
              href={`/dogs/${dog.id}`}
              className="card-spotify group cursor-pointer relative"
            >
              {/* Edit Icon - Top Right Corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/dogs/${dog.id}/edit`);
                }}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
              >
                <Edit className="h-4 w-4 text-white" />
              </button>

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
                  <h3 className="text-lg font-semibold text-white truncate group-hover:text-gray-300 transition-colors">
                    {dog.dog_name}
                  </h3>
                  <p className="text-sm text-gray-400">{dog.primary_kennel}</p>
                  {dog.secondary_kennel && (
                    <p className="text-sm text-gray-500">{dog.secondary_kennel}</p>
                  )}
                  <p className="text-sm text-gray-400">
                    {dog.gender === 'male' ? 'Male' : 'Female'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
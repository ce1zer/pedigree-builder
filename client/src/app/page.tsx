'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Users } from 'lucide-react';
import { Dog, Gender } from '@/types';
import { dogsApi } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

// Constants
const LOADING_SPINNER_SIZE = 'h-12 w-12';
const ICON_SIZE = 'h-5 w-5';
const STATS_ICON_SIZE = 'h-6 w-6';

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className={`animate-spin rounded-full ${LOADING_SPINNER_SIZE} border-b-2 border-green-500`}></div>
  </div>
);

// Stats card component
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, iconColor }) => (
  <div className="card-spotify">
    <div className="flex items-center">
      <div className="p-3 bg-gray-800 rounded-xl">
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

// Dog card component
interface DogCardProps {
  dog: Dog;
}

const DogCard: React.FC<DogCardProps> = ({ dog }) => (
  <div className="card-spotify group cursor-pointer">
    <div className="flex items-start space-x-4">
      {/* Dog Photo */}
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
      
      {/* Dog Info */}
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
    
    {/* Action Buttons */}
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
);

// Empty state component
interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery }) => (
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
        <Plus className={ICON_SIZE} />
        <span>Add First Dog</span>
      </Link>
    )}
  </div>
);

// Main Dashboard component
const Dashboard: React.FC = () => {
  // State management
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load dogs from API
  const loadDogs = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading dogs...');
      const response = await dogsApi.getAll();
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('Dogs loaded successfully:', response.data.length);
        setDogs(response.data);
      } else {
        console.error('API Error:', response.error);
        toast.error(response.error || 'Error loading dogs');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Error loading dogs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter dogs based on search query
  const filteredDogs = useMemo(() => {
    if (!searchQuery.trim()) return dogs;
    
    const query = searchQuery.toLowerCase();
    return dogs.filter(dog =>
      dog.dog_name.toLowerCase().includes(query) ||
      dog.primary_kennel.toLowerCase().includes(query) ||
      (dog.secondary_kennel && dog.secondary_kennel.toLowerCase().includes(query))
    );
  }, [dogs, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: dogs.length,
    male: dogs.filter(dog => dog.gender === 'male').length,
    female: dogs.filter(dog => dog.gender === 'female').length,
  }), [dogs]);

  // Load dogs on component mount
  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dogs Dashboard</h1>
          <p className="text-gray-400 text-lg">
            Manage your dog profiles and pedigrees
          </p>
        </div>
        
        <Link
          href="/dogs/new"
          className="btn-spotify-primary inline-flex items-center space-x-2"
        >
          <Plus className={ICON_SIZE} />
          <span>Add Dog</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={<Users className={STATS_ICON_SIZE} />}
          label="Total Dogs"
          value={stats.total}
          iconColor="text-green-500"
        />
        <StatsCard
          icon={<Users className={STATS_ICON_SIZE} />}
          label="Male"
          value={stats.male}
          iconColor="text-blue-400"
        />
        <StatsCard
          icon={<Users className={STATS_ICON_SIZE} />}
          label="Female"
          value={stats.female}
          iconColor="text-pink-400"
        />
      </div>

      {/* Search Section */}
      <div className="card-spotify">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or kennel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-spotify w-full pl-12"
          />
        </div>
      </div>

      {/* Dogs Grid or Empty State */}
      {filteredDogs.length === 0 ? (
        <EmptyState searchQuery={searchQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
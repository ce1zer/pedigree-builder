'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit, Users, Plus, Building2, Save, X, Trash2 } from 'lucide-react';
import { Dog, Kennel } from '@/types';
import { dogsApi, kennelsApi } from '@/services/api';
import toast from 'react-hot-toast';
import { formatDogDisplayName } from '@/utils/dogNameFormatter';

// Helper function to get kennel name from dog (for filtering/search)
const getKennelName = (dog: Dog | null): string => {
  if (!dog) return '';
  if (dog.primary_kennel_name) return dog.primary_kennel_name;
  if (typeof dog.primary_kennel === 'string') return dog.primary_kennel;
  if (dog.primary_kennel && typeof dog.primary_kennel === 'object') {
    const kennel = dog.primary_kennel as { name?: string };
    return kennel.name || '';
  }
  return '';
};

// Kennels View Component
interface KennelsViewProps {
  kennels: Kennel[];
  loading: boolean;
  onRefresh: () => void;
}

const KennelsView: React.FC<KennelsViewProps> = ({ kennels, loading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKennelName, setNewKennelName] = useState('');

  const handleEdit = (kennel: Kennel) => {
    setEditingId(kennel.id);
    setEditName(kennel.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSave = async (id: string) => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast.error('Kennel name must be at least 2 characters long');
      return;
    }

    try {
      setIsSaving(true);
      const response = await kennelsApi.update(id, editName.trim());
      
      if (response.success) {
        toast.success('Kennel updated successfully');
        setEditingId(null);
        setEditName('');
        onRefresh();
      } else {
        toast.error(response.error || 'Error updating kennel');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error updating kennel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(id);
      const response = await kennelsApi.delete(id);
      
      if (response.success) {
        toast.success('Kennel deleted successfully');
        onRefresh();
      } else {
        toast.error(response.error || 'Error deleting kennel');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting kennel');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAdd = async () => {
    if (!newKennelName.trim() || newKennelName.trim().length < 2) {
      toast.error('Kennel name must be at least 2 characters long');
      return;
    }

    try {
      setIsSaving(true);
      const response = await kennelsApi.create(newKennelName.trim());
      
      if (response.success) {
        toast.success('Kennel created successfully');
        setNewKennelName('');
        setShowAddForm(false);
        onRefresh();
      } else {
        toast.error(response.error || 'Error creating kennel');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error creating kennel');
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Add Kennel Form */}
      {showAddForm ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Add New Kennel</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewKennelName('');
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newKennelName}
              onChange={(e) => setNewKennelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                } else if (e.key === 'Escape') {
                  setShowAddForm(false);
                  setNewKennelName('');
                }
              }}
              placeholder="Enter kennel name..."
              className="input flex-1"
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={isSaving}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Adding...' : 'Add'}</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewKennelName('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Kennel</span>
        </button>
      )}

      {/* Kennels List */}
      {kennels.length === 0 ? (
        <div className="card-elevated card-elevated-interactive p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-3">No kennels added yet</h3>
          <p className="text-gray-400 mb-8 text-lg">Start by adding your first kennel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kennels.map((kennel) => (
            <div
              key={kennel.id}
              className="card card-interactive group relative"
            >
              {editingId === kennel.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSave(kennel.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="input w-full"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSave(kennel.id)}
                      disabled={isSaving}
                      className="btn-primary inline-flex items-center space-x-1 flex-1 justify-center"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="btn-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Building2 className="h-8 w-8 text-gray-400 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-white truncate">
                        {kennel.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(kennel)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit kennel"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(kennel.id, kennel.name)}
                        disabled={isDeleting === kennel.id}
                        className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors"
                        title="Delete kennel"
                      >
                        {isDeleting === kennel.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="h-4 w-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Dogs View Component
interface DogsViewProps {
  dogs: Dog[];
  filteredDogs: Dog[];
  loading: boolean;
  searchQuery: string;
}

const DogsView: React.FC<DogsViewProps> = ({ dogs, filteredDogs, loading, searchQuery }) => {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      {filteredDogs.length === 0 ? (
        <div className="card-elevated card-elevated-interactive p-12 text-center">
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
            <Link href="/dogs/new" className="btn-primary inline-flex items-center space-x-2">
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
              className="card card-interactive group cursor-pointer relative"
            >
              {/* Edit Icon - Top Right Corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/dogs/${dog.id}`);
                }}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
              >
                <Edit className="h-4 w-4 text-white" />
              </button>

              <div className="flex items-start space-x-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {dog.image_url ? (
                    <Image
                      src={dog.image_url}
                      alt={dog.dog_name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-cover"
                      loading="lazy"
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
                    {formatDogDisplayName(dog)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {getKennelName(dog) || 'N/A'}
                  </p>
                  {(dog.secondary_kennel || dog.secondary_kennel_name) && (
                    <p className="text-sm text-gray-500">
                      {typeof dog.secondary_kennel === 'object' && dog.secondary_kennel?.name 
                        ? dog.secondary_kennel.name 
                        : (typeof dog.secondary_kennel === 'string' ? dog.secondary_kennel : dog.secondary_kennel_name || '')}
                    </p>
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
    </>
  );
};

// Memoize the components to prevent unnecessary re-renders
const MemoizedKennelsView = React.memo(KennelsView);
const MemoizedDogsView = React.memo(DogsView);

const DashboardContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'dogs' | 'kennels'>('dogs');
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [loading, setLoading] = useState(true);
  const [kennelsLoading, setKennelsLoading] = useState(false);

  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    loadDogs();
    loadKennels();
  }, []);

  // Listen for dog creation events to optimistically add new dog
  useEffect(() => {
    const handleDogCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ newDog: Dog }>;
      const newDog = customEvent.detail?.newDog;
      
      if (newDog) {
        // Optimistically add new dog immediately
        setDogs(prev => {
          // Check if dog already exists (prevent duplicates)
          const exists = prev.some(d => d.id === newDog.id);
          if (exists) return prev;
          return [...prev, newDog];
        });
        
        // Also refresh in background to ensure we have latest data
        loadDogs().catch(err => {
          console.warn('Background refresh failed, but dog is already added:', err);
        });
      }
    };

    window.addEventListener('dog-created', handleDogCreated);
    return () => {
      window.removeEventListener('dog-created', handleDogCreated);
    };
  }, []);

  // Optimize filtering with useMemo instead of useEffect
  const filteredDogs = useMemo(() => {
    if (!searchQuery.trim()) return dogs;
    
    const query = searchQuery.toLowerCase();
    return dogs.filter(dog => {
      const primaryKennelName = getKennelName(dog);
      const secondaryKennelName = typeof dog.secondary_kennel === 'object' && dog.secondary_kennel?.name 
        ? dog.secondary_kennel.name 
        : (typeof dog.secondary_kennel === 'string' ? dog.secondary_kennel : dog.secondary_kennel_name || '');
      return (
        dog.dog_name?.toLowerCase().includes(query) ||
        primaryKennelName.toLowerCase().includes(query) ||
        secondaryKennelName.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, dogs]);

  const loadDogs = async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getAll();
      
      if (response.success && response.data) {
        setDogs(response.data);
      } else {
        toast.error(response.error || 'Error loading dogs');
      }
    } catch (error) {
      toast.error('Error loading dogs');
    } finally {
      setLoading(false);
    }
  };

  const loadKennels = async () => {
    try {
      setKennelsLoading(true);
      const response = await kennelsApi.getAll();
      
      if (response.success && response.data) {
        setKennels(response.data);
      } else {
        toast.error(response.error || 'Error loading kennels');
      }
    } catch (error) {
      toast.error('Error loading kennels');
    } finally {
      setKennelsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Database{' '}
            {view === 'dogs' && dogs.length > 0 && (
              <span className="text-gray-400">({dogs.length})</span>
            )}
            {view === 'kennels' && kennels.length > 0 && (
              <span className="text-gray-400">({kennels.length})</span>
            )}
          </h1>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView('dogs')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all border border-transparent ${
              view === 'dogs'
                ? 'bg-[var(--primary)] text-[color:var(--primary-foreground)]'
                : 'text-gray-300 hover:text-white hover:bg-[var(--button-secondary-hover-bg)] hover:border-[var(--button-secondary-hover-border)]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Dogs</span>
            </div>
          </button>
          <button
            onClick={() => setView('kennels')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all border border-transparent ${
              view === 'kennels'
                ? 'bg-[var(--primary)] text-[color:var(--primary-foreground)]'
                : 'text-gray-300 hover:text-white hover:bg-[var(--button-secondary-hover-bg)] hover:border-[var(--button-secondary-hover-border)]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Kennels</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'dogs' ? (
        <MemoizedDogsView
          dogs={dogs}
          filteredDogs={filteredDogs}
          loading={loading}
          searchQuery={searchQuery}
        />
      ) : (
        <MemoizedKennelsView
          kennels={kennels}
          loading={kennelsLoading}
          onRefresh={loadKennels}
        />
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
};

export default Dashboard;

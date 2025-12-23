'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Database, Plus, GitBranch, Search, X, LogOut } from 'lucide-react';
import { Dog } from '@/types';
import { dogsApi } from '@/services/api';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { getKennelName } from '@/utils/dogNameFormatter';

// Constants
const SMALL_ICON_SIZE = 'h-4 w-4';

// Navigation item interface
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Navigation items configuration (without Add Dog - it's now in the header)
const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Database',
    icon: <Database className={SMALL_ICON_SIZE} />
  },
  {
    href: '/breeding-simulator',
    label: 'Breeding Simulator',
    icon: <GitBranch className={SMALL_ICON_SIZE} />
  }
];

// Navigation link component
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive }) => (
  <Link
    href={item.href}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-[var(--nav-active-bg)] text-[color:var(--text-primary)]'
        : 'text-[color:var(--text-secondary)] hover:text-[color:var(--nav-hover-fg)] hover:bg-[var(--nav-hover-bg)]'
    }`}
  >
    {item.icon}
    <span>{item.label}</span>
  </Link>
);

// Search Bar Component (separated to use useSearchParams)
const SearchBar: React.FC<{ pathname: string }> = ({ pathname }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Function to load dogs (can be called manually or automatically)
  const loadDogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        setDogs(response.data);
      }
    } catch (error) {
      console.error('Failed to load dogs for search:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all dogs for autocomplete (lazy load - only when user starts typing)
  useEffect(() => {
    // Only load dogs when user starts typing (lazy load)
    if (searchQuery.trim().length === 0) {
      return;
    }
    
    // Debounce the API call to avoid loading on every keystroke
    const timeoutId = setTimeout(async () => {
      if (dogs.length === 0) { // Only load if not already loaded
        await loadDogs();
      }
    }, 300); // Wait 300ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, dogs.length, loadDogs]);

  // Listen for dog creation events to optimistically add new dog
  useEffect(() => {
    const handleDogCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ newDog: Dog }>;
      const newDog = customEvent.detail?.newDog;
      
      if (newDog) {
        // Optimistically add new dog immediately if list is already loaded
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
      } else {
        // Fallback: if no dog data, refresh the list
        if (dogs.length > 0) {
          loadDogs();
        }
      }
    };

    window.addEventListener('dog-created', handleDogCreated);
    return () => {
      window.removeEventListener('dog-created', handleDogCreated);
    };
  }, [dogs.length, loadDogs]);

  // Filter dogs based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = dogs.filter(dog => {
        const primaryKennelName = getKennelName(dog);
        const query = searchQuery.toLowerCase();
        return (
          dog.dog_name?.toLowerCase().includes(query) ||
          primaryKennelName.toLowerCase().includes(query)
        );
      });
      setFilteredDogs(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setFilteredDogs([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, dogs]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredDogs.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDogs.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredDogs.length) {
          handleDogSelect(filteredDogs[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSearchQuery('');
        break;
    }
  };

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  // Handle dog selection from suggestions
  const handleDogSelect = (dog: Dog) => {
    router.push(`/dogs/${dog.id}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  // Clear search
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setShowSuggestions(false);
    if (pathname === '/') {
      router.push('/');
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by name or kennel"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredDogs.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="input w-full pl-4 pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-10">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredDogs.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--popover-bg)] border border-[color:var(--popover-border)] rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredDogs.map((dog, index) => {
            const kennelName = getKennelName(dog);
            return (
              <button
                key={dog.id}
                type="button"
                onClick={() => handleDogSelect(dog)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                  index === selectedIndex
                    ? 'bg-gray-700 ring-2 ring-[color:var(--ring-color)] ring-inset'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {dog.image_url ? (
                    <img
                      src={dog.image_url}
                      alt={dog.dog_name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{dog.dog_name}</div>
                    {kennelName && (
                      <div className="text-sm text-gray-400 truncate">{kennelName}</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Header component
const Header: React.FC<{ pathname: string }> = ({ pathname }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Also sign out from Supabase client-side
      await supabase.auth.signOut();
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Signed out successfully');
        router.push('/login');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to sign out');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-[var(--header-bg)] border-b border-[color:var(--header-border)] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16 gap-4">
          {/* Left: Navigation */}
          <nav className="flex space-x-2">
            {NAV_ITEMS.map((item) => (
              <NavLink 
                key={item.href} 
                item={item} 
                isActive={isActive(item.href)} 
              />
            ))}
          </nav>

          {/* Center: Search Bar */}
          <div className="flex justify-center">
            <Suspense fallback={<div className="w-full max-w-md h-10 bg-gray-800 rounded-lg animate-pulse" />}>
              <SearchBar pathname={pathname} />
            </Suspense>
          </div>

          {/* Right: Add Dog Button and Logout */}
          <div className="flex justify-end items-center space-x-2">
            <Link
              href="/dogs/new"
              className="border-2 border-[color:var(--cta-border)] text-[color:var(--cta-fg)] hover:bg-[var(--cta-hover-bg)] hover:text-[color:var(--cta-hover-fg)] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center space-x-2"
            >
              <Plus className={SMALL_ICON_SIZE} />
              <span>Add Dog</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--nav-hover-bg)] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sign out"
            >
              <LogOut className={SMALL_ICON_SIZE} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Main layout component
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Apply the neutral theme globally. Export-sensitive DOM subtrees explicitly opt into
  // `.theme-legacy` at the component level to keep PNG exports unchanged.
  const themeClass = 'theme-neutral';
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className={`min-h-screen ${themeClass} bg-[var(--background)]`}>
      {!isLoginPage && <Header pathname={pathname} />}
      
      <main className={`max-w-7xl mx-auto px-6 lg:px-8 ${isLoginPage ? 'py-0' : 'py-8'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;

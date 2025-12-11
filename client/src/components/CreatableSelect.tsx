'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Kennel } from '@/types';
import axios from 'axios';

interface CreatableSelectProps {
  value: Kennel | null;
  onChange: (kennel: Kennel | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select or type to create...',
  label,
  error,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [filteredKennels, setFilteredKennels] = useState<Kennel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false); // Track if a selection was just made

  // Load all kennels on mount
  useEffect(() => {
    const loadKennels = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/kennels');
        if (response.data.success) {
          setKennels(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load kennels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKennels();
  }, []);

  // Filter kennels based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredKennels(kennels);
      setSelectedIndex(-1);
      return;
    }

    const filtered = kennels.filter(kennel =>
      kennel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredKennels(filtered);
    setSelectedIndex(-1);
  }, [searchTerm, kennels]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredKennels.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredKennels.length > 0 && selectedIndex >= 0 && selectedIndex < filteredKennels.length) {
          handleSelect(filteredKennels[selectedIndex]);
        } else if (searchTerm.trim()) {
          handleCreateKennel(searchTerm.trim());
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Handle selecting an existing kennel
  const handleSelect = (kennel: Kennel) => {
    justSelectedRef.current = true; // Mark that a selection was made
    onChange(kennel);
    setIsOpen(false);
    setSearchTerm('');
    // Reset the flag after a short delay
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 300);
  };

  // Handle creating a new kennel
  const handleCreateKennel = async (name: string) => {
    if (!name.trim() || name.trim().length < 2) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/kennels', { name: name.trim() });
      
      if (response.data.success) {
        const newKennel = response.data.data;
        setKennels(prev => [...prev, newKennel]);
        justSelectedRef.current = true; // Mark that a selection was made
        onChange(newKennel);
        setIsOpen(false);
        setSearchTerm('');
        // Reset the flag after a short delay
        setTimeout(() => {
          justSelectedRef.current = false;
        }, 300);
      }
    } catch (error: any) {
      console.error('Failed to create kennel:', error);
      // If kennel already exists, try to find and select it
      if (error.response?.status === 400 || error.response?.status === 409) {
        const existingKennel = kennels.find(
          k => k.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (existingKennel) {
          handleSelect(existingKennel);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  // Handle input blur - create kennel if search term doesn't match
  const handleInputBlur = () => {
    // Delay to allow click events to fire first
    setTimeout(() => {
      // Don't create kennel if a selection was just made or dropdown is still open
      if (justSelectedRef.current || isOpen) {
        return;
      }
      
      if (searchTerm.trim() && !value) {
        const matchingKennel = kennels.find(
          k => k.name.toLowerCase() === searchTerm.trim().toLowerCase()
        );
        if (!matchingKennel) {
          handleCreateKennel(searchTerm.trim());
        }
      }
    }, 200);
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const displayValue = value ? value.name : searchTerm;

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`input-spotify w-full pr-10 ${
              error ? 'border-red-500' : ''
            }`}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-4 py-2 text-gray-400 text-sm">Loading...</div>
            ) : filteredKennels.length > 0 ? (
              <div>
                {filteredKennels.map((kennel, index) => (
                  <button
                    key={kennel.id}
                    type="button"
                    onClick={() => handleSelect(kennel)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-700 ring-2 ring-[#3ecf8e] ring-inset'
                        : ''
                    } ${
                      value?.id === kennel.id ? 'bg-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-white">{kennel.name}</div>
                  </button>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <button
                type="button"
                onClick={() => handleCreateKennel(searchTerm.trim())}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                  selectedIndex === filteredKennels.length
                    ? 'bg-gray-700 ring-2 ring-[#3ecf8e] ring-inset'
                    : ''
                }`}
              >
                <div className="text-white">
                  Create "{searchTerm.trim()}"
                </div>
              </button>
            ) : (
              <div className="px-4 py-2 text-gray-400 text-sm">No kennels found</div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};


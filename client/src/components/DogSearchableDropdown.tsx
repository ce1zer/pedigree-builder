'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Dog } from '@/types';
import { formatDogDisplayName, getKennelName } from '@/utils/dogNameFormatter';

interface DogSearchableDropdownProps {
  options: Dog[];
  value: Dog | null;
  onChange: (dog: Dog | null) => void;
  placeholder: string;
  label: string;
}

export const DogSearchableDropdown: React.FC<DogSearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options;

    return options.filter((dog) => {
      const searchable = formatDogDisplayName(dog).toLowerCase();
      return (
        searchable.includes(query)
      );
    });
  }, [options, searchTerm]);

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (!isOpen) return;
    // Wait one tick for the input to mount
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [isOpen]);

  const handleSelect = (dog: Dog) => {
    onChange(dog);
    close();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleTriggerKeyDown}
          className="input w-full text-left flex items-center justify-between pr-8"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value
              ? `${value.dog_name}${(() => {
                  const kennelName = getKennelName(value);
                  return kennelName ? ` (${kennelName})` : '';
                })()}`
              : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {value && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full bottom-full mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or kennel..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring-color)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm">No dogs found</div>
              ) : (
                filteredOptions.map((dog, index) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => handleSelect(dog)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-700 ring-2 ring-[color:var(--ring-color)] ring-inset'
                        : ''
                    } ${
                      value?.id === dog.id ? 'bg-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-white font-medium">{dog.dog_name}</div>
                    {(() => {
                      const kennelName = getKennelName(dog);
                      return kennelName ? (
                        <div className="text-sm text-gray-400">{kennelName}</div>
                      ) : null;
                    })()}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



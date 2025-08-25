'use client';

import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ name: string; count?: number; avgPrice?: number; totalUsage?: number }>;
  isLoading?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export function SearchableDropdown({
  label,
  placeholder,
  value,
  onChange,
  options,
  isLoading = false,
  error,
  required = false,
  className = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection
  const handleOptionClick = (optionName: string) => {
    const newValue = value.includes(optionName)
      ? value.filter(v => v !== optionName)
      : [...value, optionName];
    onChange(newValue);
    setSearchTerm('');
  };

  // Handle input change for manual entry
  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);

    // If user types and presses enter, add as new value
    if (inputValue && !options.some(opt => opt.name.toLowerCase() === inputValue.toLowerCase())) {
      // Allow manual entry - this will be handled by the parent component
    }
  };

  // Handle key press for manual entry
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      const trimmedTerm = searchTerm.trim();
      if (!value.includes(trimmedTerm)) {
        onChange([...value, trimmedTerm]);
      }
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div
          className={`w-full px-3 py-2 border rounded-md cursor-pointer ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'focus:border-blue-500'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 min-h-6">
              {value.length > 0 ? (
                value.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {item}
                    <button
                      type="button"
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                      onClick={e => {
                        e.stopPropagation();
                        handleOptionClick(item);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search or type to add..."
                  value={searchTerm}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options list */}
            <div className="py-1">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option.name}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 flex items-center justify-between ${
                      value.includes(option.name) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleOptionClick(option.name)}
                  >
                    <span className="flex-1">{option.name}</span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {option.count && <span>({option.count})</span>}
                      {value.includes(option.name) && (
                        <CheckIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No results found. Press Enter to add "{searchTerm}"
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Reusable SuggestionCombobox component
 * - A11y: ARIA combobox pattern
 * - Keyboard: Up/Down/Enter/Escape navigation
 * - Pure UI: controlled value + external suggestions
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, type InputProps } from './Input';

export type SuggestionItem = {
  text: string;
  type?: string;
  subtype?: string;
  metadata?: Record<string, unknown>;
};

export interface SuggestionComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: SuggestionItem) => void;
  suggestions: SuggestionItem[];
  loading?: boolean;
  placeholder?: string;
  label?: string;
  id?: string;
  minChars?: number;
  highlightQuery?: string;
  groupByType?: boolean;
  className?: string;
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'id' | 'placeholder'>;
}

export const SuggestionCombobox: React.FC<SuggestionComboboxProps> = ({
  value,
  onChange,
  onSelect,
  suggestions,
  loading,
  placeholder = 'Search…',
  label = 'Search',
  id = 'search',
  minChars = 2,
  highlightQuery,
  groupByType = true,
  className,
  inputProps,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if ((value?.length || 0) >= minChars) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }, [value, minChars]);

  const highlight = useCallback(
    (text: string) => {
      const q = (highlightQuery ?? value).trim();
      if (!q) return text;
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return text;
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + q.length);
      const after = text.slice(idx + q.length);
      return (
        <>
          {before}
          <mark className="bg-yellow-100 text-gray-900">{match}</mark>
          {after}
        </>
      );
    },
    [highlightQuery, value]
  );

  const grouped = useMemo(() => {
    if (!groupByType) return { all: suggestions } as Record<string, SuggestionItem[]>;
    const order = ['recent', 'product', 'content', 'customer', 'tag'];
    const map: Record<string, SuggestionItem[]> = {};
    suggestions.forEach(s => {
      const t = (s.type || 'other').toLowerCase();
      if (!map[t]) map[t] = [];
      map[t].push(s);
    });
    const sorted: Record<string, SuggestionItem[]> = {};
    order.forEach(t => {
      if (map[t]?.length) sorted[t] = map[t];
    });
    Object.keys(map)
      .filter(k => !order.includes(k))
      .forEach(k => (sorted[k] = map[k]));
    return sorted;
  }, [suggestions, groupByType]);

  // Flatten for index navigation
  const flat: SuggestionItem[] = useMemo(() => Object.values(grouped).flat(), [grouped]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flat.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const item = flat[idx];
      if (item) {
        onSelect?.(item);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const headerLabel = (t: string) => {
    switch (t) {
      case 'recent':
        return 'Recent searches';
      case 'product':
        return 'Products';
      case 'content':
        return 'Content';
      case 'customer':
        return 'Customers';
      case 'tag':
        return 'Tags';
      default:
        return t;
    }
  };

  let runningIndex = -1;

  return (
    <div ref={containerRef} className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-suggestions`}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        ref={inputRef}
        onFocus={() => {
          if ((value?.length || 0) >= minChars) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        {...inputProps}
      />

      {isOpen && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border border-gray-200 bg-white shadow-md"
        >
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Loading…</li>}
          {!loading && flat.length === 0 && value.length >= minChars && (
            <li className="px-3 py-2 text-sm text-gray-500">No suggestions</li>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <React.Fragment key={`group-${type}`}>
              {groupByType && (
                <li className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-100">
                  {headerLabel(type)}
                </li>
              )}
              {items.map((s, idx) => {
                runningIndex += 1;
                const isActive = runningIndex === activeIndex;
                return (
                  <li
                    key={`${type}-${s.text}-${idx}`}
                    role="option"
                    aria-selected={isActive}
                    id={`${id}-option-${runningIndex}`}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                      isActive ? 'bg-blue-50' : 'bg-white'
                    } hover:bg-blue-50`}
                    onMouseEnter={() => setActiveIndex(runningIndex)}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      onSelect?.(s);
                      setIsOpen(false);
                      inputRef.current?.focus();
                    }}
                  >
                    <span className="truncate text-sm text-gray-900">{highlight(s.text)}</span>
                    {s.type && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                        {s.type}
                      </span>
                    )}
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestionCombobox;


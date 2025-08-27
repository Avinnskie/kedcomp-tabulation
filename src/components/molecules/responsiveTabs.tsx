'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  current: string;
  onChange: (val: string) => void;
}

export const ResponsiveTabs = ({ tabs, current, onChange }: ResponsiveTabsProps) => {
  return (
    <div className="w-full mb-4">
      {/* Mobile: Dropdown */}
      <div className="block sm:hidden">
        <select 
          value={current} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {tabs.map(tab => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Desktop: Tab buttons */}
      <div className="hidden sm:flex overflow-x-auto scrollbar-hide space-x-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.value}
            className={cn(
              'flex-shrink-0 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm font-medium',
              current === tab.value
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-neutral-600 hover:text-blue-600 hover:border-gray-300'
            )}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

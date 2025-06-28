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
    <div className="flex overflow-x-auto whitespace-nowrap space-x-2 border-b mb-4">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={cn(
            'px-4 py-2 border-b-2 transition-colors',
            current === tab.value
              ? 'border-blue-500 text-blue-600 font-semibold'
              : 'border-transparent text-neutral-600 hover:text-blue-600'
          )}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

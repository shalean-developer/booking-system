'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type FilterPeriod = 'Today' | '7 days' | 'Last 10 days' | '30 days' | '90 days' | 'Month';

interface FilterPeriodContextType {
  selectedPeriod: FilterPeriod;
  setSelectedPeriod: (period: FilterPeriod) => void;
}

const FilterPeriodContext = createContext<FilterPeriodContextType | undefined>(undefined);

export const FilterPeriodProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('Today');

  return (
    <FilterPeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
      {children}
    </FilterPeriodContext.Provider>
  );
};

export const useFilterPeriod = () => {
  const context = useContext(FilterPeriodContext);
  if (context === undefined) {
    throw new Error('useFilterPeriod must be used within a FilterPeriodProvider');
  }
  return context;
};


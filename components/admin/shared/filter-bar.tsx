'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClear?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClear,
  actions,
  className,
}: FilterBarProps) {
  const hasActiveFilters = searchValue || Object.values(filterValues).some((v) => v && v !== 'all');

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {onSearchChange && (
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {filters.map((filter) => (
            <div key={filter.key} className="w-full sm:w-auto">
              {filter.type === 'select' && filter.options && (
                <Select
                  value={filterValues[filter.key] || 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      onFilterChange?.(filter.key, '');
                    } else {
                      onFilterChange?.(filter.key, value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filter.type === 'text' && (
                <Input
                  placeholder={filter.placeholder || filter.label}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                  className="w-full sm:w-[180px]"
                />
              )}
              {filter.type === 'date' && (
                <Input
                  type="date"
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                  className="w-full sm:w-[180px]"
                />
              )}
            </div>
          ))}

          {hasActiveFilters && onClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}


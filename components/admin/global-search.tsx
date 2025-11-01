'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Calendar, User, Briefcase, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'booking' | 'customer' | 'cleaner' | 'application';
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.ok) {
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, isOpen]);

  const handleResultClick = (result: SearchResult) => {
    let path = '';
    switch (result.type) {
      case 'booking':
        path = '/admin#bookings';
        break;
      case 'customer':
        path = '/admin#customers';
        break;
      case 'cleaner':
        path = '/admin#cleaners';
        break;
      case 'application':
        path = '/admin#applications';
        break;
    }
    router.push(path);
    setIsOpen(false);
    setQuery('');
    
    // Dispatch event to highlight the result
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('admin-highlight-item', { 
        detail: { type: result.type, id: result.id } 
      }));
    }, 200);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'cleaner':
        return <Briefcase className="h-4 w-4" />;
      case 'application':
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'booking':
        return 'Booking';
      case 'customer':
        return 'Customer';
      case 'cleaner':
        return 'Cleaner';
      case 'application':
        return 'Application';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Search className="h-4 w-4 mr-2" />
        Search
        <kbd className="ml-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Global Search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Search bookings, customers, cleaners..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!isSearching && query && results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{result.subtitle}</p>
                        {result.metadata && (
                          <p className="text-xs text-gray-500 mt-1">{result.metadata}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Start typing to search...</p>
                <p className="text-xs mt-2">Search across bookings, customers, cleaners, and applications</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}





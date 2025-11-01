'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, BookmarkCheck, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  section: string;
}

export function SavedFilters({ section, currentFilters, onApplyFilter }: {
  section: string;
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
}) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const stored = localStorage.getItem(`admin-saved-filters-${section}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSave = () => {
    if (!filterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      section,
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(`admin-saved-filters-${section}`, JSON.stringify(updated));
    setFilterName('');
    setShowSaveDialog(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem(`admin-saved-filters-${section}`, JSON.stringify(updated));
  };

  const handleApply = (filter: SavedFilter) => {
    onApplyFilter(filter.filters);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Filters
            {savedFilters.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedFilters.length === 0 ? (
            <DropdownMenuItem disabled>No saved filters</DropdownMenuItem>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between"
                onSelect={() => handleApply(filter)}
              >
                <span className="flex-1">{filter.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(filter.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowSaveDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="e.g., Pending Bookings This Week"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





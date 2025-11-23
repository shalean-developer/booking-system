'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string | ((props: { sortable?: boolean }) => React.ReactNode);
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  enableSelection?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  enableSelection = false,
  onSelectionChange,
  pageSize = 10,
  currentPage = 1,
  totalPages = 1,
  total,
  onPageChange,
  className,
  emptyMessage = 'No results.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery && searchKey) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const value = (item as any)[searchKey];
        return value && String(value).toLowerCase().includes(query);
      });
    }

    if (sortColumn) {
      const column = columns.find((col) => col.id === sortColumn);
      if (column && column.sortable) {
        result.sort((a, b) => {
          const aValue = typeof column.accessor === 'function' 
            ? column.accessor(a) 
            : (a as any)[column.accessor];
          const bValue = typeof column.accessor === 'function' 
            ? column.accessor(b) 
            : (b as any)[column.accessor];
          
          if (aValue === bValue) return 0;
          const comparison = aValue > bValue ? 1 : -1;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, searchQuery, searchKey, sortColumn, sortDirection, columns]);

  const handleSelectRow = (row: T) => {
    if (!row.id) return;
    const newSelected = new Set(selectedRows);
    if (newSelected.has(row.id)) {
      newSelected.delete(row.id);
    } else {
      newSelected.add(row.id);
    }
    setSelectedRows(newSelected);
    
    if (onSelectionChange) {
      const selected = data.filter((item) => item.id && newSelected.has(item.id));
      onSelectionChange(selected);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      const allIds = new Set(filteredData.map((row) => row.id).filter(Boolean) as string[]);
      setSelectedRows(allIds);
      if (onSelectionChange) {
        onSelectionChange(filteredData);
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {searchKey && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {enableSelection && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(column.sortable && 'cursor-pointer hover:bg-muted/50', column.className)}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    {typeof column.header === 'function' 
                      ? column.header({ sortable: column.sortable })
                      : column.header}
                    {column.sortable && (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  data-state={row.id && selectedRows.has(row.id) ? 'selected' : undefined}
                  className={cn(
                    row.id && selectedRows.has(row.id) && 'bg-muted/50',
                    enableSelection && 'cursor-pointer'
                  )}
                  onClick={() => enableSelection && handleSelectRow(row)}
                >
                  {enableSelection && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={row.id ? selectedRows.has(row.id) : false}
                        onChange={() => handleSelectRow(row)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : String((row as any)[column.accessor] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0)} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {enableSelection && selectedRows.size > 0 && (
            <span>
              {selectedRows.size} of {filteredData.length} row(s) selected.
            </span>
          )}
          {total !== undefined && (
            <span className="ml-4">
              Showing {filteredData.length} of {total} results
            </span>
          )}
        </div>
        {onPageChange && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


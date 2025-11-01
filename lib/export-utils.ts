/**
 * Utility functions for exporting data to CSV
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string; format?: (value: any) => string }>,
  options: ExportOptions = {}
): string {
  const { includeHeaders = true } = options;

  // Generate headers
  const headers = columns.map(col => col.label);

  // Generate rows
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',')
  );

  // Combine headers and rows
  if (includeHeaders) {
    return [headers.join(','), ...rows].join('\n');
  }
  return rows.join('\n');
}

/**
 * Trigger CSV download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for CSV (convert cents to rands)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return (value / 100).toFixed(2);
}

/**
 * Format date for CSV
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format date-time for CSV
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString();
}

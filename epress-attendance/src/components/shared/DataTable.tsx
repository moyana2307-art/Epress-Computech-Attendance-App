import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  searchable?: boolean;
  searchKeys?: string[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  title?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, keyExtractor, searchable = true,
  searchKeys, emptyMessage = 'No data found', onRowClick, title,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = data.filter((item) => {
    if (!search) return true;
    const keys = searchKeys || columns.map((c) => c.key);
    return keys.some((key) =>
      String(item[key] || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="rounded-xl bg-white border border-border-light overflow-hidden">
      {(searchable || title) && (
        <div className="p-4 border-b border-border-light flex items-center justify-between gap-4">
          {title && <h3 className="text-sm font-semibold text-text font-heading">{title}</h3>}
          {searchable && (
            <div className="relative max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-background border border-border-light text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light bg-background/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-text select-none'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-background/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-text">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

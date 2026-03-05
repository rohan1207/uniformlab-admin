import { Search, Filter, Columns, ArrowUpDown } from 'lucide-react';

export function DataTable({
  columns,
  rows,
  renderRow,
  searchPlaceholder = 'Search',
  onSearch,
  filterTabs,
  activeFilter,
  onFilterChange,
  pagination,
  selectable,
  selectedIds,
  onSelectAll,
  onSelectOne,
}) {
  return (
    <div className="px-3 md:px-6 pb-8">
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
        {filterTabs?.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange?.(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === tab.id ? 'bg-gray-200 text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Add filter">
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
          />
        </div>
        <button type="button" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Filter">
          <Filter size={18} />
        </button>
        <button type="button" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Columns">
          <Columns size={18} />
        </button>
        <button type="button" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Sort">
          <ArrowUpDown size={18} />
        </button>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {selectable && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds?.length === rows?.length && rows?.length > 0}
                      onChange={(e) => onSelectAll?.(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                    {col.label}
                    {col.sortable && <span className="ml-1 text-gray-400">↓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                  {renderRow(row, idx)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pagination && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>1–{rows?.length ?? 0} of {pagination.total ?? rows?.length ?? 0}</span>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button type="button" className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

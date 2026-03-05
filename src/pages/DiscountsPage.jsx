import { useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

const mockDiscounts = [
  { id: 'd1', code: 'WELCOME10', type: 'Percentage', value: '10%', usage: 45, limit: 100 },
  { id: 'd2', code: 'FLAT50', type: 'Fixed', value: '₹50', usage: 120, limit: 500 },
];

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
  { key: 'usage', label: 'Usage' },
  { key: 'limit', label: 'Limit' },
];

export default function DiscountsPage() {
  const renderRow = (row) => (
    <>
      <td className="px-4 py-3 font-mono font-medium text-gray-900">{row.code}</td>
      <td className="px-4 py-3 text-gray-600">{row.type}</td>
      <td className="px-4 py-3">{row.value}</td>
      <td className="px-4 py-3">{row.usage}</td>
      <td className="px-4 py-3">{row.limit}</td>
    </>
  );

  return (
    <>
      <PageHeader
        title="Discounts"
        actions={
          <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
            <Plus size={16} /> Create discount
          </button>
        }
      />
      <DataTable columns={columns} rows={mockDiscounts} renderRow={(row) => renderRow(row)} pagination={{ total: mockDiscounts.length }} />
    </>
  );
}

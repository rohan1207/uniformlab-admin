import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { mockDrafts } from '@/data/mockAdmin';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const columns = [
  { key: 'id', label: 'Draft' },
  { key: 'updated', label: 'Last updated' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total' },
];

export default function OrdersDraftsPage() {
  const renderRow = (row) => (
    <>
      <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
      <td className="px-4 py-3 text-gray-600">{row.updated}</td>
      <td className="px-4 py-3">{row.customer}</td>
      <td className="px-4 py-3">{row.total}</td>
    </>
  );

  return (
    <>
      <PageHeader
        title="Drafts"
        actions={
          <Link
            to="/orders/create"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} /> Create order
          </Link>
        }
      />
      <DataTable columns={columns} rows={mockDrafts} renderRow={(row) => renderRow(row)} pagination={{ total: mockDrafts.length }} />
    </>
  );
}

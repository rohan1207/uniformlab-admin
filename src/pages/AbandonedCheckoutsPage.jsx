import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { mockAbandoned } from '@/data/mockAdmin';

const columns = [
  { key: 'id', label: 'Checkout' },
  { key: 'email', label: 'Email' },
  { key: 'cartTotal', label: 'Cart total' },
  { key: 'recovered', label: 'Recovered' },
];

export default function AbandonedCheckoutsPage() {
  const renderRow = (row) => (
    <>
      <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
      <td className="px-4 py-3">{row.email}</td>
      <td className="px-4 py-3">{row.cartTotal}</td>
      <td className="px-4 py-3">{row.recovered ? 'Yes' : 'No'}</td>
    </>
  );

  return (
    <>
      <PageHeader title="Abandoned checkouts" />
      <DataTable columns={columns} rows={mockAbandoned} renderRow={(row) => renderRow(row)} pagination={{ total: mockAbandoned.length }} />
    </>
  );
}

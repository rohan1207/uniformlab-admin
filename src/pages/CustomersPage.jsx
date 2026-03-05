import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const columns = [
  { key: 'name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'orders', label: 'Orders' },
  { key: 'totalSpent', label: 'Total spent' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        let token;
        try {
          if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem('uniformlab_admin_auth');
            token = raw ? JSON.parse(raw).token : null;
          }
        } catch {
          token = null;
        }
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/admin/orders`, { headers });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data?.error?.message || 'Failed to load customers');
        }

        const byKey = new Map();
        (data || []).forEach((o) => {
          const email = (o.customerEmail || '').toLowerCase();
          const phone = (o.customerPhone || '').trim();
          const name = o.customerName || '';
          const key = email || phone || name || o._id;
          if (!key) return;
          const existing =
            byKey.get(key) || {
              id: key,
              name: name || '(No name)',
              email: email || '—',
              orders: 0,
              totalSpentNumber: 0,
            };
          existing.orders += 1;
          if (o.paymentStatus === 'Paid') {
            existing.totalSpentNumber += Number(o.totalAmount || 0);
          }
          byKey.set(key, existing);
        });

        const list = Array.from(byKey.values()).map((c) => ({
          ...c,
          totalSpent: `₹${c.totalSpentNumber}`,
        }));

        setRows(list);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || 'Failed to load customers');
      }
    }
    load();
  }, []);

  const filtered = rows.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  });

  const renderRow = (row) => (
    <>
      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
      <td className="px-4 py-3 text-gray-600">{row.email}</td>
      <td className="px-4 py-3">{row.orders}</td>
      <td className="px-4 py-3">{row.totalSpent}</td>
    </>
  );

  return (
    <>
      <PageHeader
        title="Customers"
        actions={
          <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
            <Plus size={16} /> Add customer
          </button>
        }
      />
      <DataTable
        columns={columns}
        rows={filtered}
        renderRow={(row) => renderRow(row)}
        searchPlaceholder="Search customers"
        onSearch={setSearch}
        pagination={{ total: filtered.length }}
      />
      {error && (
        <div className="px-6 pb-4 text-sm text-red-600">{error}</div>
      )}
    </>
  );
}

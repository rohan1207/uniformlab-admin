import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Truck, Star, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function DeliveryPartnersPage() {
  const { token } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};

  const loadPartners = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/delivery-partners`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to load delivery partners');
      setPartners(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message || 'Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this delivery partner?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/delivery-partners/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete partner');
      loadPartners();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err.message || 'Could not delete partner');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/delivery-partners/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to update partner');
      loadPartners();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err.message || 'Could not update partner');
    }
  };

  return (
    <>
      <PageHeader
        title="Delivery partners"
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} /> Add partner
          </button>
        }
      />
      <div className="px-3 md:px-6 pb-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Default</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck size={18} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.phone}</td>
                  <td className="px-4 py-3">
                    {p.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium">
                        <Star size={12} /> Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(p._id)}
                        className="px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Set default
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Default partner is auto-assigned when a new order is created. You can manage partners here or via the API.
        </p>
      </div>

      {showModal && (
        <PartnerModal
          partner={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(null);
            loadPartners();
          }}
        />
      )}
    </>
  );
}

function PartnerModal({ partner, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    phone: partner?.phone || '',
    isDefault: partner?.isDefault || false,
    notes: partner?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const rawAuth = typeof window !== 'undefined' ? window.localStorage.getItem('uniformlab_admin_auth') : null;
  let token;
  try {
    token = rawAuth ? JSON.parse(rawAuth).token : null;
  } catch {
    token = null;
  }

  const headers = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    try {
      setSaving(true);
      const url = partner
        ? `${API_BASE}/api/admin/delivery-partners/${partner._id}`
        : `${API_BASE}/api/admin/delivery-partners`;
      const method = partner ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          isDefault: !!formData.isDefault,
          notes: formData.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Could not save delivery partner');
      }
      onSaved();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err.message || 'Could not save delivery partner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {partner ? 'Edit delivery partner' : 'Add delivery partner'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Partner name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span>Set as default delivery partner</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              placeholder="Any specific details about this partner"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-70"
            >
              {saving ? 'Saving…' : partner ? 'Save changes' : 'Add partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Plus, Edit2, Trash2, School, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Default classes (Nursery to 12) – admin can edit
const DEFAULT_CLASSES = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];
const DEFAULT_CLASSES_STR = DEFAULT_CLASSES.join(', ');

function generateSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const columns = [
  { key: 'name', label: 'School Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'classes', label: 'Classes' },
  { key: 'categories', label: 'Categories' },
  { key: 'products', label: 'Products' },
  { key: 'actions', label: 'Actions' },
];

export default function SchoolsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [schools, setSchools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');

      const headers = { Authorization: `Bearer ${token}` };

      const [schoolsRes, categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/schools`, { headers }),
        fetch(`${API_BASE}/api/admin/categories`, { headers }),
        fetch(`${API_BASE}/api/admin/products`, { headers }),
      ]);
      const [schoolsData, categoriesData, productsData] = await Promise.all([
        schoolsRes.json(),
        categoriesRes.json(),
        productsRes.json(),
      ]);
      if (!schoolsRes.ok || !categoriesRes.ok || !productsRes.ok) {
        throw new Error(
          schoolsData?.error?.message ||
            categoriesData?.error?.message ||
            productsData?.error?.message ||
            'Failed to load schools'
        );
      }
      setSchools(schoolsData);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const categoryCounts = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const key = c.school;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [categories]);

  const productCounts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const key = p.school;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [products]);

  const rows = useMemo(
    () =>
      schools.map((s) => ({
        id: s._id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl,
        logoPublicId: s.logoPublicId,
        classes: s.classes && s.classes.length ? s.classes : DEFAULT_CLASSES,
        tags: s.tags || [],
        categoriesCount: categoryCounts[s._id] || 0,
        productsCount: productCounts[s._id] || 0,
      })),
    [schools, categoryCounts, productCounts]
  );

  const filtered = rows.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this school? This will also delete all its products.')) {
      fetch(`${API_BASE}/api/admin/schools/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete school');
        })
        .then(() => reload())
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
          alert(err.message || 'Could not delete school');
        });
    }
  };

  const renderRow = (row) => (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <School size={18} className="text-gray-400" />
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 font-mono text-sm">{row.slug}</td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {row.classes.length} classes
      </td>
      <td className="px-4 py-3 text-gray-600">{row.categoriesCount}</td>
      <td className="px-4 py-3 text-gray-600">{row.productsCount}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSchool(row);
              setShowAddModal(true);
            }}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </>
  );

  return (
    <>
      <PageHeader
        title="Schools"
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingSchool(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} /> Add School
          </button>
        }
      />
      {error && (
        <div className="mt-4 mx-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <DataTable
        columns={columns}
        rows={filtered}
        renderRow={(row) => renderRow(row)}
        searchPlaceholder="Search schools"
        onSearch={setSearch}
        pagination={{ total: filtered.length }}
      />

      {/* Add/Edit School Modal */}
      {showAddModal && (
        <SchoolModal
          school={editingSchool}
          token={token}
          onClose={() => {
            setShowAddModal(false);
            setEditingSchool(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingSchool(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function SchoolModal({ school, token, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: school?.name || '',
    board: school?.level || '',
    imageUrl: school?.imageUrl || '',
    imagePublicId: school?.imagePublicId || '',
    logoUrl: school?.logoUrl || '',
    logoPublicId: school?.logoPublicId || '',
    classes: school?.classes?.length ? school.classes.join(', ') : DEFAULT_CLASSES_STR,
    tags: Array.isArray(school?.tags) ? school.tags.join(', ') : (school?.tags || ''),
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageDeleting, setImageDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classes = formData.classes.split(',').map((c) => c.trim()).filter(Boolean);
    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: formData.name,
      level: formData.board || undefined,
      imageUrl: formData.imageUrl || undefined,
      imagePublicId: formData.imagePublicId || undefined,
      logoUrl: formData.logoUrl || undefined,
      logoPublicId: formData.logoPublicId || undefined,
      classes,
      tags,
    };

    const token = window.localStorage.getItem('uniformlab_admin_auth');
    let authHeader = {};
    try {
      const parsed = JSON.parse(token || '{}');
      if (parsed.token) {
        authHeader = { Authorization: `Bearer ${parsed.token}` };
      }
    } catch {
      // ignore
    }

    try {
      const base = API_BASE;
      const url = school
        ? `${base}/api/admin/schools/${school.id || school._id}`
        : `${base}/api/admin/schools`;
      const method = school ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Could not save school');
      }
      onSaved();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err.message || 'Could not save school');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {school ? 'Edit School' : 'Add New School'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Vidya Pratishthan's Nanded City Public School"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Board / Curriculum</label>
            <select
              value={formData.board}
              onChange={(e) => setFormData({ ...formData, board: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="">— Select board —</option>
              <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
              <option value="ICSE">ICSE (Indian Certificate of Secondary Education)</option>
              <option value="ISC">ISC (Indian School Certificate – Class 11-12)</option>
              <option value="IGCSE">IGCSE (Cambridge International – O Level)</option>
              <option value="IB">IB (International Baccalaureate)</option>
              <option value="Cambridge A Level">Cambridge A Level</option>
              <option value="State Board">State Board (General)</option>
              <option value="Maharashtra SSC">Maharashtra SSC Board</option>
              <option value="Maharashtra HSC">Maharashtra HSC Board</option>
              <option value="Gujarat Board (GSEB)">Gujarat Board (GSEB)</option>
              <option value="Rajasthan Board (RBSE)">Rajasthan Board (RBSE)</option>
              <option value="UP Board (UPMSP)">UP Board (UPMSP)</option>
              <option value="MP Board (MPBSE)">MP Board (MPBSE)</option>
              <option value="Karnataka SSLC">Karnataka SSLC Board</option>
              <option value="Tamil Nadu Board">Tamil Nadu Board (TN)</option>
              <option value="Kerala Board">Kerala Board (SCERT)</option>
              <option value="NIOS">NIOS (National Institute of Open Schooling)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the curriculum / board this school follows.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">School Image</label>
            {formData.imageUrl ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative inline-block">
                  <img
                    src={formData.imageUrl}
                    alt="School"
                    className="w-24 h-24 object-cover border border-gray-200 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (imageDeleting) return;
                      const schoolId = school?.id || school?._id;
                      setImageDeleting(true);
                      try {
                        if (schoolId) {
                          const res = await fetch(`${API_BASE}/api/admin/schools/${schoolId}/image`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error('Failed to delete school image');
                        } else if (formData.imagePublicId) {
                          const res = await fetch(`${API_BASE}/api/admin/upload/asset`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ publicId: formData.imagePublicId }),
                          });
                          if (!res.ok) throw new Error('Failed to delete image from storage');
                        }
                        setFormData((f) => ({ ...f, imageUrl: '', imagePublicId: '' }));
                      } catch (err) {
                        // eslint-disable-next-line no-console
                        console.error(err);
                        alert(err.message || 'Could not delete school image');
                      } finally {
                        setImageDeleting(false);
                      }
                    }}
                    disabled={imageDeleting}
                    className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow border-0 cursor-pointer disabled:opacity-60"
                    title="Remove school image (deletes from Cloudinary and clears here)"
                    aria-label="Remove school image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">Click trash to remove school image from storage</span>
              </div>
            ) : null}
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Upload size={16} />
                {imageUploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={imageUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    e.target.value = '';
                    setImageUploading(true);
                    try {
                      const slug = (school?.slug || (formData.name && generateSlug(formData.name)) || 'school').trim();
                      const fd = new FormData();
                      fd.append('file', file);
                      const schoolId = school?.id || school?._id;
                      if (schoolId) {
                        fd.append('schoolId', schoolId);
                      } else {
                        fd.append('schoolSlug', slug);
                      }
                      const res = await fetch(`${API_BASE}/api/admin/upload/school-image`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || !data.url) throw new Error(data?.error?.message || 'Upload failed');
                      setFormData((f) => ({ ...f, imageUrl: data.url, imagePublicId: data.publicId || '' }));
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error(err);
                      alert(err.message || 'Could not upload school image');
                    } finally {
                      setImageUploading(false);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">Uploaded to Cloudinary under schools/&lt;slug&gt;/image.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
            {formData.logoUrl ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative inline-block">
                  <img
                    src={formData.logoUrl}
                    alt="School logo"
                    className="w-20 h-20 object-contain border border-gray-200 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (logoDeleting) return;
                      const schoolId = school?.id || school?._id;
                      setLogoDeleting(true);
                      try {
                        if (schoolId) {
                          const res = await fetch(`${API_BASE}/api/admin/schools/${schoolId}/logo`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error('Failed to delete logo');
                        } else if (formData.logoPublicId) {
                          const res = await fetch(`${API_BASE}/api/admin/upload/asset`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ publicId: formData.logoPublicId }),
                          });
                          if (!res.ok) throw new Error('Failed to delete logo from storage');
                        }
                        setFormData((f) => ({ ...f, logoUrl: '', logoPublicId: '' }));
                      } catch (err) {
                        console.error(err);
                        alert(err.message || 'Could not delete logo');
                      } finally {
                        setLogoDeleting(false);
                      }
                    }}
                    disabled={logoDeleting}
                    className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow border-0 cursor-pointer disabled:opacity-60"
                    title="Remove logo (deletes from Cloudinary and clears here)"
                    aria-label="Remove logo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">Click trash to remove logo from storage</span>
              </div>
            ) : null}
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Upload size={16} />
                {logoUploading ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    e.target.value = '';
                    setLogoUploading(true);
                    try {
                      const slug = (school?.slug || (formData.name && generateSlug(formData.name)) || 'school').trim();
                      const fd = new FormData();
                      fd.append('file', file);
                      const schoolId = school?.id || school?._id;
                      if (schoolId) {
                        fd.append('schoolId', schoolId);
                      } else {
                        fd.append('schoolSlug', slug);
                      }
                      const res = await fetch(`${API_BASE}/api/admin/upload/school-logo`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(data?.error?.message || 'Upload failed');
                      setFormData((f) => ({ ...f, logoUrl: data.url, logoPublicId: data.publicId }));
                    } catch (err) {
                      console.error(err);
                      alert(err.message || 'Could not upload logo');
                    } finally {
                      setLogoUploading(false);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">Select an image from your device. Stored in Cloudinary (schools / school name / logo).</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classes</label>
            <input
              type="text"
              required
              value={formData.classes}
              onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={DEFAULT_CLASSES_STR}
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated. Default: Nursery to 12 — edit as needed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., CBSE, ICSE, Pune (comma-separated)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              {school ? 'Update School' : 'Add School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


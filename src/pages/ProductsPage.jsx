import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Plus, Edit2, Trash2, Package, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');

        const headers = {
          Authorization: `Bearer ${token}`,
        };

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
              'Failed to load products'
          );
        }

        setSchools(schoolsData);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const schoolMap = useMemo(
    () => Object.fromEntries(schools.map((s) => [s._id, s])),
    [schools]
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c._id, c])),
    [categories]
  );

  // Normalised rows for table view
  const allProducts = useMemo(
    () =>
      products.map((p) => {
        const school = schoolMap[p.school];
        const category = categoryMap[p.category];
        const colorNames = (p.colors || []).map((c) => c.name).filter(Boolean);
        return {
          id: p._id,
          name: p.name,
          price: p.price,
          sizes: p.sizes || [],
          colors: colorNames,
          hasColorVariants: colorNames.length > 1,
          schoolId: p.school,
          schoolName: school?.name || '—',
          categoryId: p.category,
          categoryName: category?.name || '—',
        };
      }),
    [products, schoolMap, categoryMap]
  );

  const filtered = allProducts.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.schoolName.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = selectedSchool === 'all' || p.schoolId === selectedSchool;
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesSchool && matchesCategory;
  });

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product? Its images will be removed from Cloudinary.')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Failed to delete product');
      }
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete product');
    }
  };

  const fetchAll = async () => {
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
            'Failed to load'
        );
      }
      setSchools(schoolsData);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const uniqueSchools = useMemo(
    () => schools.map((s) => ({ id: s._id, name: s.name })),
    [schools]
  );

  const uniqueCategories = useMemo(() => {
    const seen = new Map();
    allProducts.forEach((p) => {
      if (!seen.has(p.categoryId)) {
        seen.set(p.categoryId, { id: p.categoryId, name: p.categoryName });
      }
    });
    return Array.from(seen.values());
  }, [allProducts]);

  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'school', label: 'School' },
    { key: 'category', label: 'Category' },
    { key: 'sizes', label: 'Sizes' },
    { key: 'colors', label: 'Colors' },
    { key: 'price', label: 'Price' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderRow = (row) => (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">{row.name}</span>
          {row.hasColorVariants && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">Variants</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">{row.schoolName}</td>
      <td className="px-4 py-3 text-gray-600 text-sm">{row.categoryName}</td>
      <td className="px-4 py-3 text-gray-600 text-sm">{row.sizes?.join(', ') || '—'}</td>
      <td className="px-4 py-3">
        {row.colors && row.colors.length > 0 ? (
          <div className="flex items-center gap-1">
            {row.colors.slice(0, 3).map((color, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                {color}
              </span>
            ))}
            {row.colors.length > 3 && <span className="text-xs text-gray-500">+{row.colors.length - 3}</span>}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 font-medium">₹{row.price}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/products/edit/${row.id}`)}
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
        title="Products"
        actions={
          <button
            type="button"
            onClick={() => navigate('/products/add')}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mx-3 md:mx-6 bg-white rounded-lg border border-gray-200 p-3 md:p-4 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Filter size={16} /> Filters
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Schools</option>
            {uniqueSchools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        renderRow={(row) => renderRow(row)}
        searchPlaceholder="Search products by name or school"
        onSearch={setSearch}
        pagination={{ total: filtered.length }}
        loading={loading}
      />
    </>
  );
}

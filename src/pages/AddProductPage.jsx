import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function slugify(value, fallback = "") {
  const source = value || fallback || "";
  return String(source)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SIZE_TYPES = {
  numeric: "Numeric (clothes 18–46)",
  letter: "Letter (S, M, L, XL)",
  shoe: "Shoe (Indian/UK number – e.g. 6, 7, 8, 9, 10)",
};
const SIZES_BY_TYPE = {
  numeric: [
    "18",
    "20",
    "22",
    "24",
    "26",
    "28",
    "30",
    "32",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",
  ],
  letter: ["XS", "S", "M", "L", "XL", "XXL"],
  // Indian/UK shoe sizes – familiar to parents (kids’ school shoes)
  shoe: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
  ],
};
const MAX_IMAGES_PER_SLOT = 4;

const DEFAULT_COLORS = [
  { name: "No color", hex: "#f3f4f6" },
  { name: "White", hex: "#ffffff" },
  { name: "Navy", hex: "#0f172a" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Red", hex: "#dc2626" },
  { name: "Green", hex: "#16a34a" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Charcoal", hex: "#36454f" },
  { name: "Light Blue", hex: "#add8e6" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Brown", hex: "#a52a2a" },
  { name: "Pink", hex: "#ffc0cb" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#ffa500" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Khakki", hex: "#c3b091" },
  { name: "Maroon", hex: "#800000" },
  { name: "Bottle Green", hex: "#006a4e" },
  { name: "Lavender", hex: "#ae80ef" },
];

const EMPTY_VARIANT = {
  sizeLabel: "",
  code: "",
  saleRate: "",
  mrp: "",
  purchaseRate: "",
};

export default function AddProductPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { schoolId, id: productId } = useParams();
  const isEditMode = Boolean(productId);
  const [schools, setSchools] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(schoolId || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]); // multi-category
  const [selectedGrade, setSelectedGrade] = useState(""); // string class from school.classes
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [recommendFilterSchool, setRecommendFilterSchool] = useState("");
  const [recommendFilterCategory, setRecommendFilterCategory] = useState("");
  const [recommendDropdownOpen, setRecommendDropdownOpen] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "UNISEX",
    variants: [EMPTY_VARIANT],
    sizeType: "none",
    sizes: [],
    colors: [],
    manualOutOfStock: false,
    // Map { [colorName]: true } meaning that specific color is out of stock
    outOfStockByColor: {},
    images: [],
    hasColorVariants: false,
    imagesByColor: {},
    description: "",
    features: [],
    tags: "",
    recommendedProductIds: [],
  });

  // Load schools, products, categories for dropdowns
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/api/admin/schools`, { headers }).then((r) => r.json()),
      fetch(`${API_BASE}/api/admin/products`, { headers }).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE}/api/admin/categories`, { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([schoolsData, productsData, categoriesData]) => {
        if (Array.isArray(schoolsData)) setSchools(schoolsData);
        if (Array.isArray(productsData)) setAllProducts(productsData);
        if (Array.isArray(categoriesData)) setAllCategories(categoriesData);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingSchools(false));
  }, [token]);

  // Edit mode: fetch product and pre-fill form
  useEffect(() => {
    if (!productId || !token) return;
    let cancelled = false;
    setLoadingProduct(true);
    fetch(`${API_BASE}/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((product) => {
        if (cancelled || !product || product.error) return;
        const schoolIdVal = String(product.school?._id ?? product.school ?? "");
        // Multi-category: prefer categories array (populated or raw IDs), fall back to single category
        // Always normalize to plain strings to ensure .includes() comparisons work
        const toStr = (v) => String(v?._id ?? v ?? "").trim();
        const catIds = (
          Array.isArray(product.categories) && product.categories.length
            ? product.categories.map(toStr)
            : product.category
              ? [toStr(product.category)]
              : []
        ).filter(Boolean);
        // Grade: prefer gradeLabel string, fall back to grade.name from ObjectId ref
        const gradeStr = product.gradeLabel || product.grade?.name || "";
        setSelectedSchool(schoolIdVal);
        setSelectedCategoryIds(catIds);
        setSelectedGrade(gradeStr);
        const sizeTypeForm =
          product.sizeType === "alpha"
            ? "letter"
            : product.sizeType || "numeric";
        const main = product.mainImageUrl ? [product.mainImageUrl] : [];
        const gallery = product.galleryImageUrls || [];
        const images = [...main, ...gallery];
        let imagesByColor = {};
        if (product.imagesByColor) {
          if (product.imagesByColor instanceof Map) {
            product.imagesByColor.forEach((urls, key) => {
              imagesByColor[key] = urls || [];
            });
          } else {
            imagesByColor = { ...product.imagesByColor };
          }
        }

        // Manual stock per color (Map/Object) -> plain object for the form
        let outOfStockByColor = {};
        if (product.outOfStockByColor) {
          if (product.outOfStockByColor instanceof Map) {
            product.outOfStockByColor.forEach((v, key) => {
              outOfStockByColor[key] = v === true;
            });
          } else if (typeof product.outOfStockByColor === "object") {
            outOfStockByColor = { ...product.outOfStockByColor };
          }
        }
        const variantsFromProduct =
          Array.isArray(product.variants) && product.variants.length
            ? product.variants.map((v) => ({
                sizeLabel: v.sizeLabel || "",
                code: v.code || "",
                saleRate: v.saleRate != null ? String(v.saleRate) : "",
                mrp: v.mrp != null ? String(v.mrp) : "",
                purchaseRate:
                  v.purchaseRate != null ? String(v.purchaseRate) : "",
              }))
            : [EMPTY_VARIANT];

        const genderForm = product.variants?.[0]?.gender || "UNISEX";

        setFormData({
          name: product.name || "",
          gender: genderForm,
          variants: variantsFromProduct,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          sizeType: sizeTypeForm,
          colors: Array.isArray(product.colors) ? product.colors : [],
          images,
          hasColorVariants:
            Array.isArray(product.colors) && product.colors.length > 0,
          imagesByColor,
          manualOutOfStock: product.manualOutOfStock === true,
          outOfStockByColor,
          description: product.description || "",
          features: Array.isArray(product.features) ? product.features : [],
          tags: Array.isArray(product.tags)
            ? product.tags.join(", ")
            : product.tags || "",
          recommendedProductIds: [],
        });
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingProduct(false));
    return () => {
      cancelled = true;
    };
  }, [productId, token]);

  // Keep sizes array in sync with variants (for filters/frontend compatibility)
  useEffect(() => {
    const labels = formData.variants
      .map((v) => (v.sizeLabel || "").trim())
      .filter(Boolean);
    const unique = [...new Set(labels)];
    setFormData((prev) => ({ ...prev, sizes: unique }));
  }, [formData.variants]);

  const handleColorToggle = (color) => {
    const exists = formData.colors.some((c) => c.name === color.name);
    const nextColors = exists
      ? formData.colors.filter((c) => c.name !== color.name)
      : [...formData.colors, color];

    const nextOutOfStockByColor = { ...(formData.outOfStockByColor || {}) };
    if (exists) {
      delete nextOutOfStockByColor[color.name];
    }

    setFormData({
      ...formData,
      colors: nextColors,
      hasColorVariants: nextColors.length > 0,
      outOfStockByColor: nextOutOfStockByColor,
    });
  };

  const currentSizeOptions = SIZES_BY_TYPE[formData.sizeType] || [];

  const handleImageUpload = async (e, colorName = null) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!token) {
      alert("Not authenticated.");
      return;
    }

    // Clear file input so same file can be selected again after upload
    e.target.value = "";

    const category = allCategories.find(
      (c) => c._id === selectedCategoryIds[0],
    );
    const categorySlug = slugify(category?.slug || category?.name, "category");
    const productName = formData.name || "product";

    const uploadedUrls = [];
    const existingCount = colorName
      ? (formData.imagesByColor[colorName] || []).length
      : formData.images.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);
        fd.append("schoolId", selectedSchool || "");
        fd.append("categorySlug", categorySlug || "");
        fd.append("productName", productName);
        if (colorName) {
          fd.append("colorName", colorName);
        }
        fd.append("imageIndex", String(existingCount + i));

        const res = await fetch(`${API_BASE}/api/admin/upload/product-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          throw new Error(data?.error?.message || "Failed to upload image");
        }
        uploadedUrls.push(data.url);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Image upload error:", err);
      alert(err.message || "Could not upload one or more images");
      return;
    }

    if (!uploadedUrls.length) return;

    // Use functional setState to avoid stale closure overwriting parallel uploads
    if (colorName) {
      setFormData((prev) => {
        const existing = prev.imagesByColor[colorName] || [];
        const combined = [...existing, ...uploadedUrls].slice(
          0,
          MAX_IMAGES_PER_SLOT,
        );
        return {
          ...prev,
          imagesByColor: { ...prev.imagesByColor, [colorName]: combined },
        };
      });
    } else {
      setFormData((prev) => {
        const combined = [...prev.images, ...uploadedUrls].slice(
          0,
          MAX_IMAGES_PER_SLOT,
        );
        return { ...prev, images: combined };
      });
    }
  };

  const removeImage = (index, colorName = null) => {
    if (colorName) {
      const newImages = [...(formData.imagesByColor[colorName] || [])];
      newImages.splice(index, 1);
      setFormData({
        ...formData,
        imagesByColor: { ...formData.imagesByColor, [colorName]: newImages },
      });
    } else {
      setFormData({
        ...formData,
        images: formData.images.filter((_, i) => i !== index),
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !token) return;
    const name = newCategoryName.trim();
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error?.message || "Failed to create category");
      setAllCategories((prev) => [...prev, data]);
      setSelectedCategoryIds((prev) => [...prev, data._id]);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not add category");
    }
  };

  // Grade is now sourced from the selected school's classes array — no API call needed.

  const handleFeatureKeyDown = (e) => {
    if (e.key === "Enter" && featureInput.trim()) {
      e.preventDefault();
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const suggestNextVariant = (variants) => {
    const prev = variants[variants.length - 1];
    if (!prev) return { ...EMPTY_VARIANT };

    const next = { ...EMPTY_VARIANT };

    // Size: if numeric, step by +2 (24 → 26)
    const sizeNum = parseInt(String(prev.sizeLabel).trim(), 10);
    if (!Number.isNaN(sizeNum)) {
      next.sizeLabel = String(sizeNum + 2);
    }

    // Code: increment trailing number if present (2131 → 2132)
    const codeStr = String(prev.code || "");
    const codeMatch = codeStr.match(/(\d+)$/);
    if (codeMatch) {
      const baseNum = parseInt(codeMatch[1], 10);
      if (!Number.isNaN(baseNum)) {
        const inc = String(baseNum + 1).padStart(codeMatch[1].length, "0");
        next.code = codeStr.replace(/(\d+)$/, inc);
      }
    }

    // Price: if numeric, bump by +10 (430 → 440). Admin can adjust.
    const saleNum = Number(prev.saleRate);
    if (Number.isFinite(saleNum)) {
      next.saleRate = String(saleNum + 10);
    }
    const mrpNum = Number(prev.mrp);
    if (Number.isFinite(mrpNum)) {
      next.mrp = String(mrpNum + 10);
    }

    return next;
  };

  const addVariantRow = () => {
    setFormData((prev) => {
      const existing =
        prev.variants && prev.variants.length ? prev.variants : [EMPTY_VARIANT];
      const suggested = suggestNextVariant(existing);
      return {
        ...prev,
        variants: [...existing, suggested],
      };
    });
  };

  const handleVariantKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx === formData.variants.length - 1) {
        addVariantRow();
      }
    }
  };

  const handleRecommendToggle = (productId) => {
    setFormData({
      ...formData,
      recommendedProductIds: formData.recommendedProductIds.includes(productId)
        ? formData.recommendedProductIds.filter((id) => id !== productId)
        : [...formData.recommendedProductIds, productId],
    });
  };

  const recommendProductsList = useMemo(() => {
    return allProducts.map((p) => ({
      id: p._id,
      name: p.name,
      schoolId: p.school,
      schoolName: schools.find((s) => s._id === p.school)?.name || "—",
      categoryId: p.category, // primary category for filtering
      categoryName:
        allCategories.find((c) => c._id === p.category)?.name || "—",
      price: p.price,
    }));
  }, [allProducts, schools, allCategories]);

  const recommendSchoolOptions = useMemo(
    () => [
      { value: "", label: "All schools" },
      ...schools.map((s) => ({ value: s._id, label: s.name })),
    ],
    [schools],
  );

  const recommendCategoryOptions = useMemo(() => {
    const catIds = [...new Set(recommendProductsList.map((p) => p.categoryId))];
    return [
      { value: "", label: "All categories" },
      ...catIds.map((id) => ({
        value: id,
        label: allCategories.find((c) => c._id === id)?.name || id,
      })),
    ];
  }, [allCategories, recommendProductsList]);

  const filteredRecommendProducts = useMemo(() => {
    return recommendProductsList.filter((p) => {
      if (recommendFilterSchool && p.schoolId !== recommendFilterSchool)
        return false;
      if (recommendFilterCategory && p.categoryId !== recommendFilterCategory)
        return false;
      return true;
    });
  }, [recommendProductsList, recommendFilterSchool, recommendFilterCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) {
      alert("Please select a school.");
      return;
    }
    if (!selectedCategoryIds.length) {
      alert("Please select at least one grade.");
      return;
    }
    if (!formData.name.trim()) {
      alert("Please enter a valid product name.");
      return;
    }
    const cleanVariants = (formData.variants || []).filter(
      (v) => v && v.sizeLabel && v.code && v.saleRate !== "",
    );
    if (!cleanVariants.length) {
      alert("Please add at least one size row with size, code and price.");
      return;
    }
    if (!token) {
      alert("Not authenticated.");
      return;
    }

    const sizeTypeForApi = "none";

    // Only persist image URLs that are real URLs (avoid blob: preview URLs)
    const safeImages = (formData.images || []).filter((url) =>
      /^https?:\/\//i.test(url),
    );
    const safeImagesByColor = {};
    Object.entries(formData.imagesByColor || {}).forEach(
      ([colorName, urls]) => {
        const safe = (urls || []).filter((url) => /^https?:\/\//i.test(url));
        if (safe.length) {
          safeImagesByColor[colorName] = safe;
        }
      },
    );

    const payload = {
      schoolId: selectedSchool,
      categoryIds: selectedCategoryIds, // multi-category array
      categoryId: selectedCategoryIds[0], // primary for backward compat
      gradeLabel: selectedGrade || undefined, // string class from school.classes
      name: formData.name.trim(),
      description: formData.description || undefined,
      features: Array.isArray(formData.features)
        ? formData.features.filter((f) => f && String(f).trim())
        : undefined,
      gender: formData.gender || "UNISEX",
      sizeType: sizeTypeForApi,
      sizes: formData.sizes,
      variants: cleanVariants.map((v) => ({
        code: v.code.trim(),
        sizeLabel: v.sizeLabel.trim(),
        gender: formData.gender || "UNISEX",
        colorName: (formData.colors && formData.colors[0]?.name) || "",
        saleRate: Number(v.saleRate),
        mrp: v.mrp ? Number(v.mrp) : undefined,
        purchaseRate: v.purchaseRate ? Number(v.purchaseRate) : undefined,
      })),
      colors: formData.colors,
      mainImageUrl: safeImages[0],
      galleryImageUrls: safeImages.slice(1),
      imagesByColor: safeImagesByColor,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isActive: true,
      manualOutOfStock: !!formData.manualOutOfStock,
      outOfStockByColor: formData.outOfStockByColor || {},
    };

    try {
      setSaving(true);
      const url = productId
        ? `${API_BASE}/api/admin/products/${productId}`
        : `${API_BASE}/api/admin/products`;
      const method = productId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save product");
      }
      navigate("/products");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mb-2">
        <button
          onClick={() => navigate("/products")}
          className="bg-gray-100 hover:bg-gray-200 rounded-lg p-2 mr-2"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? "Edit Product" : "Add Product"}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-3 md:px-6">
        {isEditMode && loadingProduct ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            Loading product…
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-6"
          >
            {/* School Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School *
              </label>
              <select
                required
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedCategoryIds([]);
                  setSelectedGrade("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection — multi-select checkboxes */}
            {selectedSchool &&
              (() => {
                const schoolClasses =
                  schools.find((s) => s._id === selectedSchool)?.classes || [];
                return (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categories *
                        {selectedCategoryIds.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            ({selectedCategoryIds.length} selected)
                          </span>
                        )}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Select the category(s) this product belongs to.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {allCategories.map((cat) => {
                          const checked = selectedCategoryIds.includes(cat._id);
                          return (
                            <label
                              key={cat._id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                                checked
                                  ? "bg-gray-900 text-white border-gray-900"
                                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() =>
                                  setSelectedCategoryIds((prev) =>
                                    prev.includes(cat._id)
                                      ? prev.filter((id) => id !== cat._id)
                                      : [...prev, cat._id],
                                  )
                                }
                              />
                              {checked && <span className="text-xs">✓</span>}
                              {cat.name}
                            </label>
                          );
                        })}
                      </div>
                      {!showNewCategory ? (
                        <button
                          type="button"
                          onClick={() => setShowNewCategory(true)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                        >
                          <Plus size={14} /> New category
                        </button>
                      ) : (
                        <div className="flex gap-2 flex-wrap items-center mt-1">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name"
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategory(false);
                              setNewCategoryName("");
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., White Shirt (Unisex)"
              />
            </div>

            {/* Product-level Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                >
                  <option value="UNISEX">Unisex</option>
                  <option value="BOYS">Boys</option>
                  <option value="GIRLS">Girls</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Applies to all sizes for this product.
                </p>
              </div>
            </div>

            {/* Size & Price variants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizes & prices *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add one row per size/code. Image is shared for all sizes. Gender
                & colour are set at product level.
              </p>
              <div className="space-y-2">
                {formData.variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Size label
                      </label>
                      <input
                        type="text"
                        value={v.sizeLabel}
                        onChange={(e) => {
                          const variants = [...formData.variants];
                          variants[idx] = {
                            ...variants[idx],
                            sizeLabel: e.target.value,
                          };
                          setFormData({ ...formData, variants });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g. 18, 32*42, CUSTOM"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unique code
                      </label>
                      <input
                        type="text"
                        value={v.code}
                        onChange={(e) => {
                          const variants = [...formData.variants];
                          variants[idx] = {
                            ...variants[idx],
                            code: e.target.value,
                          };
                          setFormData({ ...formData, variants });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        placeholder="SKU / Excel code"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Sale price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.saleRate}
                        onChange={(e) => {
                          const variants = [...formData.variants];
                          variants[idx] = {
                            ...variants[idx],
                            saleRate: e.target.value,
                          };
                          setFormData({ ...formData, variants });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          MRP (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.mrp}
                          onChange={(e) => {
                            const variants = [...formData.variants];
                            variants[idx] = {
                              ...variants[idx],
                              mrp: e.target.value,
                            };
                            setFormData({ ...formData, variants });
                          }}
                          onKeyDown={(e) => handleVariantKeyDown(e, idx)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const variants = formData.variants.filter(
                            (_, i) => i !== idx,
                          );
                          setFormData({
                            ...formData,
                            variants: variants.length
                              ? variants
                              : [EMPTY_VARIANT],
                          });
                        }}
                        className="self-end mb-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="mt-3 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                + Add size row
              </button>
            </div>

            {/* Use color variants? (optional – e.g. belt, tie may not need color) */}
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasColorVariants}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      hasColorVariants: !formData.hasColorVariants,
                      colors: formData.hasColorVariants ? [] : formData.colors,
                      outOfStockByColor: formData.hasColorVariants ? {} : formData.outOfStockByColor,
                      imagesByColor: formData.hasColorVariants
                        ? {}
                        : formData.imagesByColor,
                    })
                  }
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm font-medium text-gray-700">
                  This product has color variants
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Turn off for items like belt, tie where color is not needed.
              </p>
            </div>

          {/* Whole product availability (manual override) */}
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.manualOutOfStock}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    manualOutOfStock: !prev.manualOutOfStock,
                  }))
                }
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">
                Whole product: Out of stock
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, this product will be disabled for all colors and the
              customer will be able to request a “Notify me” update.
            </p>
          </div>

            {/* Colors (only when hasColorVariants) */}
            {formData.hasColorVariants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorToggle(color)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        formData.colors.some((c) => c.name === color.name)
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
                {formData.colors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {formData.colors.map((c) => c.name).join(", ")}
                  </p>
                )}

                {formData.colors.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color availability
                    </label>
                    <div className="space-y-2">
                      {formData.colors.map((color) => {
                        const isOut = formData.outOfStockByColor?.[color.name] === true;
                        return (
                          <label
                            key={color.name}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-sm font-semibold text-gray-800">
                                {color.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {isOut ? "Out of stock" : "In stock"}
                              </span>
                              <input
                                type="checkbox"
                                checked={isOut}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    outOfStockByColor: {
                                      ...(prev.outOfStockByColor || {}),
                                      [color.name]: !isOut,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product images – when no color variants (max 4) */}
            {!formData.hasColorVariants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product images (max {MAX_IMAGES_PER_SLOT})
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-90 hover:opacity-100 shadow"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < MAX_IMAGES_PER_SLOT && (
                    <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="text-center p-4">
                        <Upload
                          size={20}
                          className="mx-auto text-gray-400 mb-1"
                        />
                        <span className="text-xs text-gray-500">
                          Add (max {MAX_IMAGES_PER_SLOT})
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Images by color (max 4 per color) */}
            {formData.hasColorVariants && formData.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Images by color (max {MAX_IMAGES_PER_SLOT} per color)
                </label>
                <div className="space-y-4">
                  {formData.colors.map((color) => {
                    const imgs = formData.imagesByColor[color.name] || [];
                    return (
                      <div
                        key={color.name}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="w-5 h-5 rounded border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-medium text-gray-900">
                            {color.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {imgs.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img}
                                alt={`${color.name} ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(idx, color.name)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-90 hover:opacity-100 shadow"
                                title="Remove image"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          {imgs.length < MAX_IMAGES_PER_SLOT && (
                            <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleImageUpload(e, color.name)
                                }
                                className="hidden"
                              />
                              <div className="text-center p-4">
                                <ImageIcon
                                  size={20}
                                  className="mx-auto text-gray-400 mb-1"
                                />
                                <span className="text-xs text-gray-500">
                                  Add
                                </span>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Product description"
              />
            </div>

            {/* Features – one per line, press Enter to add */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={handleFeatureKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-2"
                placeholder="Type a feature and press Enter to add"
              />
              {formData.features.length > 0 && (
                <ul className="space-y-1">
                  {formData.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="flex-1">{f}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Comma-separated, e.g. bestseller, new"
              />
            </div>

            {/* Recommended products – dropdown with filter by school & category, multiple select */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended products
              </label>
              <p className="text-xs text-gray-500 mb-2">
                When this product is in cart, these will show as
                recommendations. Select from the product list (filter by
                school/category).
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.recommendedProductIds.map((id) => {
                  const p = recommendProductsList.find((x) => x.id === id);
                  return p ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200"
                    >
                      {p.name} <span className="text-gray-500">₹{p.price}</span>
                      <button
                        type="button"
                        onClick={() => handleRecommendToggle(id)}
                        className="p-0.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setRecommendDropdownOpen(!recommendDropdownOpen)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-500">Add products from list…</span>
                  <span className="text-gray-400">
                    {recommendDropdownOpen ? "▲" : "▼"}
                  </span>
                </button>
                {recommendDropdownOpen && (
                  <>
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      <div className="p-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2">
                        <select
                          value={recommendFilterSchool}
                          onChange={(e) =>
                            setRecommendFilterSchool(e.target.value)
                          }
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          {recommendSchoolOptions.map((opt) => (
                            <option key={opt.value || "all"} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={recommendFilterCategory}
                          onChange={(e) =>
                            setRecommendFilterCategory(e.target.value)
                          }
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          {recommendCategoryOptions.map((opt) => (
                            <option key={opt.value || "all"} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {filteredRecommendProducts.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No products match the filters.
                          </p>
                        ) : (
                          filteredRecommendProducts.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={formData.recommendedProductIds.includes(
                                  p.id,
                                )}
                                onChange={() => handleRecommendToggle(p.id)}
                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <span className="font-medium text-gray-900">
                                {p.name}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {p.schoolName} · {p.categoryName}
                              </span>
                              <span className="text-gray-600 ml-auto">
                                ₹{p.price}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <div
                      className="fixed inset-0 z-[5]"
                      onClick={() => setRecommendDropdownOpen(false)}
                      aria-hidden="true"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                Save Product
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

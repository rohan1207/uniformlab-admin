import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshCw, ChevronDown, ChevronUp, Save } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const STATUS_COLORS = {
  Pending: { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  Reviewed: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  Approved: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  Rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

function getToken() {
  try {
    const raw = window.localStorage.getItem("uniformlab_admin_auth");
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function ExchangeRow({ req, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [remark, setRemark] = useState(req.adminRemark || "");
  const [status, setStatus] = useState(req.status || "Pending");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const addr = req.customerAddress || {};
  const addrStr = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE}/api/admin/exchange-requests/${req._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ adminRemark: remark, status }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Save failed");
      setSaveMsg("Saved!");
      onUpdate(data);
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (err) {
      setSaveMsg(err.message || "Error saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      {/* ── Row summary (always visible) ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm min-w-0">
          <div className="truncate">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Order
            </p>
            <p className="font-semibold text-gray-900 text-xs truncate">
              {req.orderUniqueId || req.order?.uniqueOrderId || "—"}
            </p>
          </div>
          <div className="truncate">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Customer
            </p>
            <p className="font-semibold text-gray-900 text-xs truncate">
              {req.customerName || "—"}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {req.customerPhone || req.customerEmail || ""}
            </p>
          </div>
          <div className="truncate hidden md:block">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Item
            </p>
            <p className="text-xs text-gray-700 truncate">
              {req.itemName || "—"}
            </p>
            <p className="text-[10px] text-gray-500">
              {[
                req.itemSize && `Size: ${req.itemSize}`,
                req.itemColor && req.itemColor,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Status
            </p>
            <StatusBadge status={req.status} />
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Date
            </p>
            <p className="text-xs text-gray-600">
              {req.createdAt
                ? new Date(req.createdAt).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp
            size={15}
            strokeWidth={2}
            className="text-gray-400 shrink-0"
          />
        ) : (
          <ChevronDown
            size={15}
            strokeWidth={2}
            className="text-gray-400 shrink-0"
          />
        )}
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer info */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Customer
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {req.customerName}
              </p>
              <p className="text-xs text-gray-600">{req.customerEmail}</p>
              <p className="text-xs text-gray-600">{req.customerPhone}</p>
              {addrStr && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {addrStr}
                </p>
              )}
            </div>

            {/* Item info */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Item to Exchange
              </p>
              <div className="flex items-start gap-3">
                {req.itemImage && (
                  <img
                    src={req.itemImage}
                    alt={req.itemName}
                    className="w-14 h-14 object-contain rounded-lg border border-gray-200 flex-shrink-0"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {req.itemName || "—"}
                  </p>
                  {req.itemSize && (
                    <p className="text-xs text-gray-600">
                      Size: {req.itemSize}
                    </p>
                  )}
                  {req.itemColor && (
                    <p className="text-xs text-gray-600">
                      Colour: {req.itemColor}
                    </p>
                  )}
                  {req.itemQuantity && (
                    <p className="text-xs text-gray-600">
                      Qty: {req.itemQuantity}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Order:{" "}
                    {req.orderUniqueId || req.order?.uniqueOrderId || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Reason from Customer
              </p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {req.reason}
              </p>
            </div>
          </div>

          {/* Admin remark + status */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Admin Action
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Remark / note
                </label>
                <textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Write a note visible only to admins…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {["Pending", "Reviewed", "Approved", "Rejected"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition disabled:opacity-60"
              >
                <Save size={13} strokeWidth={2} />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saveMsg && (
              <p
                className={`text-xs font-semibold ${saveMsg === "Saved!" ? "text-emerald-600" : "text-red-600"}`}
              >
                {saveMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExchangesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/exchange-requests`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error?.message || "Failed to load");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleUpdate(updated) {
    setRequests((prev) =>
      prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)),
    );
  }

  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.customerName || "").toLowerCase().includes(q) ||
          (r.customerEmail || "").toLowerCase().includes(q) ||
          (r.orderUniqueId || "").toLowerCase().includes(q) ||
          (r.itemName || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [requests, statusFilter, search]);

  const counts = useMemo(() => {
    const c = {
      All: requests.length,
      Pending: 0,
      Reviewed: 0,
      Approved: 0,
      Rejected: 0,
    };
    requests.forEach((r) => {
      if (c[r.status] != null) c[r.status]++;
    });
    return c;
  }, [requests]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 min-h-screen">
      <PageHeader
        title="Exchanges"
        subtitle="Customer exchange requests. Click any row to expand and add a remark."
      />

      <div className="max-w-5xl mx-auto px-3 md:px-6 pb-12 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, order ID, item…"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
            {["All", "Pending", "Reviewed", "Approved", "Rejected"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  statusFilter === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {s}{" "}
                <span className="ml-0.5 opacity-70">({counts[s] ?? 0})</span>
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
          >
            <RefreshCw
              size={13}
              strokeWidth={2}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-lg bg-white border border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
            No exchange requests found.
          </div>
        )}

        {/* List */}
        {filtered.map((req) => (
          <ExchangeRow key={req._id} req={req} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { ShoppingBag, Users, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/** Full amount with Indian grouping only (e.g. ₹5,80,000) — never compact / “L” style. */
function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  const digits = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping: true,
    notation: "standard",
  }).format(Math.round(n));
  return `₹${digits}`;
}

export default function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    revenueMtd: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        let token;
        try {
          if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem("uniformlab_admin_auth");
            token = raw ? JSON.parse(raw).token : null;
          }
        } catch {
          token = null;
        }
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/admin/orders`, { headers });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate("/login", { replace: true });
            return;
          }
          throw new Error(data?.error?.message || "Failed to load overview");
        }

        const orders = Array.isArray(data) ? data : [];
        const now = new Date();

        const customerKeys = new Set();
        let revenueMtd = 0;

        orders.forEach((o) => {
          const email = (o.customerEmail || "").toLowerCase();
          const phone = (o.customerPhone || "").trim();
          const name = o.customerName || "";
          const key = email || phone || name || o._id;
          if (key) customerKeys.add(key);

          // MTD sales = sum of all placed orders this month (COD is Pending but still revenue).
          // Previously only paymentStatus === "Paid" was counted, which excluded almost all COD.
          const amt = Number(o.totalAmount);
          if (Number.isFinite(amt) && amt > 0 && o.createdAt) {
            const d = new Date(o.createdAt);
            if (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth()
            ) {
              revenueMtd += amt;
            }
          }
        });

        setStats({
          orders: orders.length,
          customers: customerKeys.size,
          revenueMtd,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || "Failed to load overview");
      }
    }
    load();
  }, []);

  const quickStats = [
    {
      label: "Total orders",
      value: String(stats.orders),
      icon: ShoppingBag,
      to: "/orders",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Customers",
      value: String(stats.customers),
      icon: Users,
      to: "/customers",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Revenue (MTD)",
      value: formatInr(stats.revenueMtd),
      icon: DollarSign,
      to: "/orders",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Growth",
      value: "—",
      icon: TrendingUp,
      to: "/analytics",
      color: "bg-gray-100 text-gray-700",
    },
  ];

  return (
    <>
      <PageHeader title="Home" />
      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map(({ label, value, icon: Icon, to, color }) => (
            <Link
              key={label}
              to={to}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all flex items-start gap-4"
            >
              <span className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums break-words leading-tight">
                  {value}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 md:p-6 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Getting started
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl">
            Use the sidebar to manage orders, products, customers, marketing,
            discounts, content, markets, and analytics. Connect your backend
            APIs to load real data. All tables support search, filters, and
            pagination.
          </p>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { ShoppingBag, Users, TrendingUp, IndianRupee } from "lucide-react";
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
    revenueAllTime: 0,
    orderCountMtd: 0,
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
        // Server-side sums: every order’s totalAmount (COD + online), IST month for MTD — avoids
        // browser timezone drift and old “Paid-only” client bugs that showed tiny totals like ₹5,875.
        const res = await fetch(`${API_BASE}/api/admin/orders/stats/dashboard`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate("/login", { replace: true });
            return;
          }
          throw new Error(data?.error?.message || "Failed to load overview");
        }

        const revenueMtd = Number(data.revenueMtd) || 0;
        const revenueAllTime = Number(data.revenueAllTime) || 0;
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log("[Dashboard] stats from API", {
            revenueMtd,
            revenueAllTime,
            orderCount: data.orderCount,
            orderCountMtd: data.orderCountMtd,
            period: data.period,
          });
        }

        setStats({
          orders: Number(data.orderCount) || 0,
          customers: Number(data.customerCount) || 0,
          revenueMtd,
          revenueAllTime,
          orderCountMtd: Number(data.orderCountMtd) || 0,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || "Failed to load overview");
      }
    }
    load();
  }, []);

  const overviewStats = [
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {overviewStats.map(({ label, value, icon: Icon, to, color }) => (
            <Link
              key={label}
              to={to}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all flex items-start gap-4"
            >
              <span className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 tabular-nums break-words leading-tight">
                  {value}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Revenue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/orders"
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all flex items-start gap-4 bg-white"
            >
              <span className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <IndianRupee size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  This month’s revenue
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Current calendar month (India time)
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 tabular-nums break-words leading-tight">
                  {formatInr(stats.revenueMtd)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.orderCountMtd} order
                  {stats.orderCountMtd === 1 ? "" : "s"} this month
                </p>
              </div>
            </Link>
            <Link
              to="/orders"
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all flex items-start gap-4 bg-white"
            >
              <span className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
                <IndianRupee size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Total revenue
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  All orders to date (sum of order totals)
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 tabular-nums break-words leading-tight">
                  {formatInr(stats.revenueAllTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.orders} order{stats.orders === 1 ? "" : "s"} total
                </p>
              </div>
            </Link>
          </div>
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

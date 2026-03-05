import { NavLink } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Users,
  Megaphone,
  Tag,
  FileText,
  Globe,
  BarChart3,
  Settings,
  School,
  Truck,
  ArrowLeftRight,
  X,
} from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/orders", label: "Orders", icon: ShoppingBag, count: 7803 },
  { to: "/schools", label: "Schools", icon: School },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/delivery-partners", label: "Delivery partners", icon: Truck },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/exchanges", label: "Exchanges", icon: ArrowLeftRight },
  { to: "/marketing", label: "Marketing", icon: Megaphone },
  { to: "/discounts", label: "Discounts", icon: Tag },
  { to: "/content", label: "Content", icon: FileText },
  { to: "/global-seo", label: "Global SEO", icon: Globe },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

function SidebarLink({ to, label, icon: Icon, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
        (isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-700 hover:bg-gray-100")
      }
    >
      {Icon && <Icon size={18} strokeWidth={2} className="shrink-0" />}
      <span className="truncate">{label}</span>
      {count != null && (
        <span className="ml-auto text-xs text-gray-500 tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={
        "w-64 shrink-0 bg-gray-100 border-r border-gray-200 flex flex-col min-h-screen " +
        /* Mobile: fixed drawer that slides in/out */
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out " +
        (isOpen ? "translate-x-0" : "-translate-x-full") +
        /* Desktop: back to normal static position */
        " md:relative md:translate-x-0 md:z-auto"
      }
    >
      <div className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <NavLink
            to="/"
            onClick={() => onClose?.()}
            className="flex items-center gap-2 font-semibold text-gray-900"
          >
            <span className="text-lg">The Uniform Lab</span>
          </NavLink>
          <p className="text-xs text-gray-500 mt-0.5">Admin</p>
        </div>
        {/* Close button – mobile only */}
        <button
          type="button"
          onClick={() => onClose?.()}
          className="md:hidden mt-0.5 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 active:bg-gray-300 shrink-0"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map((item) => (
          <div key={item.to} onClick={() => onClose?.()}>
            <SidebarLink
              to={item.to}
              label={item.label}
              icon={item.icon}
              count={item.count}
            />
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <NavLink
          to="/settings"
          onClick={() => onClose?.()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <Settings size={18} strokeWidth={2} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

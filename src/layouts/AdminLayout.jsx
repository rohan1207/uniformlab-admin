import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 md:flex md:overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right side: top bar + scrollable content area */}
      <div className="flex-1 min-w-0 flex flex-col md:h-screen md:overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-30 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-gray-900 text-base leading-none">
              The Uniform Lab
            </span>
            <span className="text-xs text-gray-400">Admin</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

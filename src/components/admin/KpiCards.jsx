export function KpiCards({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 px-3 md:px-6 py-4">
      {items.map(({ label, value, sub }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {sub != null && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {/* Mini trend placeholder (dotted line aesthetic) */}
          <div className="mt-2 h-6 flex items-end gap-0.5">
            {[3, 5, 4, 6, 5, 7, 6].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-gray-200 rounded-full opacity-70"
                style={{ height: `${h * 3}px` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

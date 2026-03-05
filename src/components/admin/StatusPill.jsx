const variants = {
  paid: 'bg-gray-800 text-white',
  unpaid: 'bg-orange-50 text-orange-700 border border-orange-200',
  fulfilled: 'bg-gray-800 text-white',
  unfulfilled: 'bg-orange-50 text-orange-700 border border-orange-200',
  delivered: 'bg-gray-800 text-white',
  inTransit: 'bg-blue-50 text-blue-700',
  tracking: 'text-gray-600',
  failed: 'bg-amber-50 text-amber-700',
  attempted: 'bg-amber-50 text-amber-700',
  default: 'bg-gray-100 text-gray-700',
};

export function StatusPill({ status, variant }) {
  const v = variant || status?.toLowerCase().replace(/\s+/g, '') || 'default';
  const cls = variants[v] ?? variants.default;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

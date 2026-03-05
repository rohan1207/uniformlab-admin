export function PageHeader({ title, actions, className = '' }) {
  return (
    <div className={`border-b border-gray-200 bg-white px-4 md:px-6 py-4 md:py-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

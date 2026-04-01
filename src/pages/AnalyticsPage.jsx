import { PageHeader } from '@/components/admin/PageHeader';
import { BarChart3 } from 'lucide-react';

const summaryCards = [
  { label: 'Total sales', value: '₹12,40,000', change: '+8%' },
  { label: 'Orders', value: '7,803', change: '+12%' },
  { label: 'Average order value', value: '₹1,589', change: '-2%' },
  { label: 'Conversion rate', value: '2.4%', change: '+0.3%' },
];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        actions={
          <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        }
      />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {summaryCards.map(({ label, value, change }) => (
            <div key={label} className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
              <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change} vs previous period</p>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 md:p-6 bg-gray-50/30">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <BarChart3 size={20} />
            <span className="text-sm font-medium">Sales over time</span>
          </div>
          <div className="h-64 flex items-end justify-around gap-2">
            {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-t max-w-[48px]" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </>
  );
}

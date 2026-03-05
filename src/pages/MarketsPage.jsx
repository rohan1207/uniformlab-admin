import { PageHeader } from '@/components/admin/PageHeader';
import { Globe } from 'lucide-react';

const mockMarkets = [
  { id: '1', name: 'India', currency: 'INR', enabled: true },
  { id: '2', name: 'International', currency: 'USD', enabled: false },
];

export default function MarketsPage() {
  return (
    <>
      <PageHeader
        title="Markets"
        actions={
          <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
            Add market
          </button>
        }
      />
      <div className="p-4 md:p-6">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Market</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Currency</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockMarkets.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" /> {m.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.currency}</td>
                  <td className="px-4 py-3">{m.enabled ? 'Enabled' : 'Disabled'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}

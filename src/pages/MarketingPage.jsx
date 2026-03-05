import { PageHeader } from '@/components/admin/PageHeader';
import { Megaphone } from 'lucide-react';

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        title="Marketing"
        actions={
          <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
            Create campaign
          </button>
        }
      />
      <div className="p-4 md:p-6">
        <div className="border border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Marketing campaigns</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Create and manage email campaigns, SMS, and promotions. Connect your marketing provider to sync campaigns here.
          </p>
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Connect channel
          </button>
        </div>
      </div>
    </>
  );
}

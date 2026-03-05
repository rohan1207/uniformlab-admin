import { PageHeader } from '@/components/admin/PageHeader';

export default function CreateOrderPage() {
  return (
    <>
      <PageHeader title="Create order" />
      <div className="p-4 md:p-6">
        <div className="border border-gray-200 rounded-xl p-6 md:p-8 text-center text-gray-500">
          Create order form — connect your backend to load customers, products, and save orders.
        </div>
      </div>
    </>
  );
}

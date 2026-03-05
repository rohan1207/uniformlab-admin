import { PageHeader } from '@/components/admin/PageHeader';

const sections = [
  { title: 'Store details', desc: 'Business name, contact, address' },
  { title: 'Payments', desc: 'Payment gateways, COD, UPI' },
  { title: 'Shipping & delivery', desc: 'Zones, rates, carriers' },
  { title: 'Taxes', desc: 'GST, tax rates' },
  { title: 'Notifications', desc: 'Email and SMS templates' },
  { title: 'Users & permissions', desc: 'Admin users and roles' },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="space-y-3">
          {sections.map(({ title, desc }) => (
            <div
              key={title}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button type="button" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

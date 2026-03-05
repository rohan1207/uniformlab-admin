import { PageHeader } from '@/components/admin/PageHeader';

const mockPages = [
  { id: '1', title: 'Home', slug: '/', status: 'Published' },
  { id: '2', title: 'Size Guide', slug: '/size-guide', status: 'Published' },
  { id: '3', title: 'About Us', slug: '/about', status: 'Draft' },
];

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Content"
        actions={
          <button type="button" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
            Add page
          </button>
        }
      />
      <div className="p-4 md:p-6">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPages.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className={p.status === 'Published' ? 'text-green-600' : 'text-gray-500'}>
                      {p.status}
                    </span>
                  </td>
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

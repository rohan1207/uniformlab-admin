import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'uniformlab_global_seo_settings';

const defaultSettings = {
  siteName: 'Uniform Lab',
  defaultTitleSuffix: ' | Uniform Lab',
  defaultDescription:
    'Buy premium school uniforms online with perfect sizing, fast delivery and trusted quality from Uniform Lab.',
  keywords: ['school uniforms', 'uniform lab', 'BVRTSE uniforms', 'Orbis uniforms'],
  allowIndexing: true,
  sitemapUrl: '/sitemap.xml',
  lastSitemapGeneratedAt: '',
  ogTitle: 'Uniform Lab – Smart uniforms for smart schools',
  ogDescription:
    'Trusted by schools and parents for premium quality, perfect fit and hassle-free uniform shopping.',
  ogImageUrl: '',
  twitterHandle: '@uniformlab',
};

export default function GlobalSeoPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // ignore parse errors, fall back to defaults
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      }
      setSaveMessage('SEO settings saved locally. Connect this to your backend so the storefront uses them.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const handleGenerateSitemap = () => {
    const now = new Date().toISOString();
    setSettings((prev) => ({ ...prev, lastSitemapGeneratedAt: now }));
    setSaveMessage('Sitemap generation triggered (mock). Wire this button to your backend sitemap generator.');
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (!value) return;
    if (settings.keywords.includes(value)) {
      setKeywordInput('');
      return;
    }
    setSettings((prev) => ({ ...prev, keywords: [...prev.keywords, value] }));
    setKeywordInput('');
  };

  const removeKeyword = (kw) => {
    setSettings((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw) }));
  };

  return (
    <>
      <PageHeader title="Global SEO" />
      <div className="px-3 md:px-6 pb-8">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Site-wide meta</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Uniform Lab"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default title suffix
                </label>
                <input
                  type="text"
                  value={settings.defaultTitleSuffix}
                  onChange={(e) => setSettings({ ...settings, defaultTitleSuffix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder=" | Uniform Lab"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default meta description
              </label>
              <textarea
                value={settings.defaultDescription}
                onChange={(e) => setSettings({ ...settings, defaultDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Short description used when a page does not override its own SEO."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <p className="text-xs text-gray-500 mb-2">
                Add a few focused, human keywords. These can be used for meta keywords or internal
                search logic.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="Type a keyword and press Enter"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Open Graph & social</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default OG title
                </label>
                <input
                  type="text"
                  value={settings.ogTitle}
                  onChange={(e) => setSettings({ ...settings, ogTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default OG description
                </label>
                <input
                  type="text"
                  value={settings.ogDescription}
                  onChange={(e) => setSettings({ ...settings, ogDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default OG image URL
                </label>
                <input
                  type="url"
                  value={settings.ogImageUrl}
                  onChange={(e) => setSettings({ ...settings, ogImageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter handle
                </label>
                <input
                  type="text"
                  value={settings.twitterHandle}
                  onChange={(e) => setSettings({ ...settings, twitterHandle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="@uniformlab"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Indexing & sitemap</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search engine indexing
                </label>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="indexing"
                      checked={settings.allowIndexing}
                      onChange={() => setSettings({ ...settings, allowIndexing: true })}
                      className="border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span>Allow indexing (index, follow)</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="indexing"
                      checked={!settings.allowIndexing}
                      onChange={() => setSettings({ ...settings, allowIndexing: false })}
                      className="border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span>Block indexing (noindex, nofollow)</span>
                  </label>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1.5fr_auto] items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap URL</label>
                  <input
                    type="text"
                    value={settings.sitemapUrl}
                    onChange={(e) => setSettings({ ...settings, sitemapUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {settings.lastSitemapGeneratedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last generated: {new Date(settings.lastSitemapGeneratedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSitemap}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Generate sitemap
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Connect this to your backend to actually regenerate <code>robots.txt</code> and{' '}
                <code>sitemap.xml</code>, and to push meta tags into your frontend (e.g. via
                React&nbsp;Helmet).
              </p>
            </div>
          </section>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 max-w-md">
              These settings are stored locally for now. In production, save them to your database
              and have the storefront read from the same source of truth.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save SEO settings'}
            </button>
          </div>

          {saveMessage && (
            <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


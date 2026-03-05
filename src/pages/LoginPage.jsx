import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const FONT_HEADING = { fontFamily: "'Baloo 2', cursive" };
const FONT_BODY = { fontFamily: "'Nunito', sans-serif" };

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.message || 'Unable to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-950/95 px-4"
      style={FONT_BODY}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800;900&family=Nunito:wght@400;600;700&display=swap');`}</style>
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Lock className="text-sky-400" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
              Uniform Lab Admin
            </p>
            <h1
              className="text-xl sm:text-2xl text-white font-black"
              style={FONT_HEADING}
            >
              Sign in to dashboard
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-[0.16em] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Uniformlab@admin"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-[0.16em] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-sky-500/70 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold tracking-[0.16em] uppercase py-2.5 mt-2 disabled:opacity-60"
            style={FONT_HEADING}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-[11px] text-slate-500 text-center">
            Only authorised Uniform Lab admins should access this dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}


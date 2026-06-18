import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Calendar, BookOpen, Users, Bell, Eye, EyeOff } from 'lucide-react';

/* ── small feature bullet used on left panel ── */
function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div
        style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-white/80 text-sm">{text}</span>
    </div>
  );
}

export default function LoginPage() {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(regNo.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('auth/invalid-credential') ||
        msg.includes('auth/user-not-found') ||
        msg.includes('auth/wrong-password')
      ) {
        setError('Invalid registration number or password.');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    /* full-viewport white base */
    <div className="min-h-screen flex" style={{ background: '#f5f3ff' }}>

      {/* ════════════════════════════════
          LEFT — gradient brand panel
          ════════════════════════════════ */}
      <div className="auth-panel hidden lg:flex flex-col justify-between w-[44%] p-12">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FOSync</span>
        </div>

        {/* Hero copy */}
        <div className="space-y-6 relative z-10">
          <div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">
              University of Colombo · Faculty of Science
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your academic<br />
              schedule,<br />
              <span style={{ color: 'rgba(196,181,253,1)' }}>beautifully organised.</span>
            </h1>
          </div>

          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            One place to track every lecture, exam, and deadline — personalised to your degree and electives.
          </p>

          {/* Feature list */}
          <div className="space-y-3 pt-2">
            <Feature icon={Calendar}  text="Weekly & monthly calendar views" />
            <Feature icon={BookOpen}  text="Courses tailored to your degree" />
            <Feature icon={Bell}      text="Exams & deadlines at a glance" />
            <Feature icon={Users}     text="Statistics Department pilot" />
          </div>
        </div>

        {/* Bottom quote */}
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          className="rounded-2xl p-5 relative z-10"
        >
          <p className="text-white/80 text-sm italic leading-relaxed">
            "Organised students perform better. FOSync helps you stay one step ahead."
          </p>
          <p className="text-white/50 text-xs mt-2">Department of Statistics</p>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — white form panel
          ════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12"
        style={{ background: '#ffffff' }}
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FOSync</span>
        </div>

        <div className="w-full max-w-md animate-slide-in-right">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-500 text-base">
              Sign in to your student account
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm animate-slide-down flex items-start gap-2"
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
              }}
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Reg No */}
            <div className="space-y-1.5">
              <label htmlFor="login-reg" className="block text-sm font-semibold text-gray-700">
                Registration Number
              </label>
              <input
                id="login-reg"
                type="text"
                autoComplete="username"
                placeholder="e.g. 2022s19001"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                className="auth-input w-full px-4 py-3 rounded-xl text-sm"
              />
              <p className="text-xs text-gray-400">Format: YYYYsXXXXX</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-pw" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input w-full px-4 py-3 pr-12 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2
                py-3.5 rounded-xl text-sm font-semibold text-white
                transition-all duration-200
                hover:shadow-lg hover:shadow-indigo-500/25
                hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                cursor-pointer
              "
              style={{
                background: loading
                  ? '#818cf8'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#f0edff' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-400">
                New to FOSync?
              </span>
            </div>
          </div>

          {/* Signup link */}
          <Link
            to="/signup"
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl text-sm font-semibold
              border-2 transition-all duration-200
              hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50
              hover:-translate-y-0.5
              cursor-pointer
            "
            style={{ borderColor: '#ddd6fe', color: '#4f46e5', background: 'transparent' }}
          >
            Create an account
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Only approved FOS students can register.
          </p>
        </div>
      </div>
    </div>
  );
}

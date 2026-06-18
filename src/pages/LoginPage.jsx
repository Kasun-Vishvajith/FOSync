import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Calendar, BookOpen, Users, Bell, Eye, EyeOff } from 'lucide-react';

/* ── small feature bullet used on left panel ── */
function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-none border-2 border-surface-100 bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
        <Icon className="w-4 h-4 text-surface-100" />
      </div>
      <span className="text-surface-100 font-semibold text-sm">{text}</span>
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
    <div className="min-h-screen flex gradient-bg">

      {/* ════════════════════════════════
          LEFT — brand panel
          ════════════════════════════════ */}
      <div className="auth-panel hidden lg:flex flex-col justify-between w-[44%] p-12">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center shadow-[3px_3px_0px_0px_var(--color-surface-100)]">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-100 tracking-tight">FOSync</span>
        </div>

        {/* Hero copy */}
        <div className="space-y-6 relative z-10">
          <div>
            <p className="text-surface-500 text-xs font-bold uppercase tracking-widest mb-4">
              University of Colombo · Faculty of Science
            </p>
            <h1 className="text-4xl font-bold text-surface-100 leading-tight">
              Your academic<br />
              schedule,<br />
              <span className="text-primary-600">beautifully organised.</span>
            </h1>
          </div>

          <p className="text-surface-300 text-base font-medium leading-relaxed max-w-xs">
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
        <div className="glass-light p-5 relative z-10">
          <p className="text-surface-200 text-sm italic font-medium leading-relaxed">
            "Organised students perform better. FOSync helps you stay one step ahead."
          </p>
          <p className="text-surface-500 text-xs font-bold mt-2">Department of Statistics</p>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — form panel
          ════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-100">FOSync</span>
        </div>

        <div className="w-full max-w-md auth-card p-8 bg-white animate-slide-in-right">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-surface-100 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-surface-400 text-base font-medium">
              Sign in to your student account
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-none text-sm font-semibold border-2 border-red-600 bg-red-50 text-red-600 animate-slide-down flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Reg No */}
            <div className="space-y-1.5">
              <label htmlFor="login-reg" className="block text-sm font-bold text-surface-200">
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
                className="auth-input w-full px-4 py-3 rounded-none text-sm font-semibold"
              />
              <p className="text-xs text-surface-500 font-medium">Format: YYYYsXXXXX</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-pw" className="block text-sm font-bold text-surface-200">
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
                  className="auth-input w-full px-4 py-3 pr-12 rounded-none text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-100 transition-colors cursor-pointer"
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
                py-3.5 rounded-none text-sm font-bold text-white
                transition-all duration-100
                bg-primary-600 border-2 border-surface-100
                shadow-[3px_3px_0px_0px_var(--color-surface-100)]
                hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)]
                active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                cursor-pointer
              "
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
              <div className="w-full border-t-2 border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-surface-500 font-bold">
                New to FOSync?
              </span>
            </div>
          </div>

          {/* Signup link */}
          <Link
            to="/signup"
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-none text-sm font-bold bg-surface-900
              border-2 border-surface-100 text-surface-100
              shadow-[3px_3px_0px_0px_var(--color-surface-100)]
              hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)]
              active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
              transition-all duration-100
              cursor-pointer
            "
          >
            Create an account
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-surface-500 font-bold mt-8">
            Only approved FOS students can register.
          </p>
        </div>
      </div>
    </div>
  );
}

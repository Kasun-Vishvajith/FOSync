import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';



export default function LoginPage() {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(regNo.trim().toLowerCase(), password, rememberMe);
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
          CENTERED FORM
          ════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 h-screen overflow-hidden">

        <div className="w-full max-w-md auth-card p-8 sm:p-10 bg-white animate-slide-in-right">
          
          {/* Typography Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-600 shadow-md flex items-center justify-center">
              <span className="font-serif text-2xl font-bold text-white italic">F</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-serif font-bold text-surface-100 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-surface-400 text-sm font-medium">
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
              <label htmlFor="login-reg" className="block text-sm font-medium text-surface-200">
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
                className="auth-input w-full px-4 py-3 text-sm font-medium"
              />

            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-pw" className="block text-sm font-medium text-surface-200">
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
                  className="auth-input w-full px-4 py-3 pr-12 text-sm font-medium"
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

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="login-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-surface-700 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="login-remember" className="text-sm font-medium text-surface-400 select-none cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2
                py-3.5 rounded-xl text-sm font-medium text-white
                transition-all duration-200
                bg-primary-600 border border-transparent
                shadow-sm hover:bg-primary-700 active:bg-primary-800 hover:-translate-y-0.5
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
              <div className="w-full border-t border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-surface-500 font-medium">
                New to FOSync?
              </span>
            </div>
          </div>

          {/* Signup link */}
          <Link
            to="/signup"
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl text-sm font-medium bg-surface-900
              border border-surface-700 text-surface-200
              shadow-sm hover:bg-surface-800 active:bg-surface-700 hover:-translate-y-0.5
              transition-all duration-200
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

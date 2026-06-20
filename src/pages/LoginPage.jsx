import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';

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
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 h-screen overflow-hidden relative">
        {/* Decorative Background Blur */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-primary-container)]/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-secondary-container)]/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

        <div className="w-full max-w-md bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-elevated)] rounded-[var(--radius-3xl)] p-8 sm:p-10 animate-fade-in relative z-10 border border-[var(--color-surface-container)]">
          
          {/* Typography Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-primary)] shadow-md flex items-center justify-center">
              <span className="font-serif text-2xl font-bold text-white italic">F</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-[var(--color-on-surface-variant)] text-sm font-medium">
              Sign in to your student account
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold border-2 border-[var(--color-error)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] animate-fade-in flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Reg No */}
            <div className="space-y-1.5">
              <label htmlFor="login-reg" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
                className="w-full px-4 py-3 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] transition-colors placeholder:text-[var(--color-outline-variant)]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-pw" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
                  className="w-full px-4 py-3 pr-12 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] transition-colors placeholder:text-[var(--color-outline-variant)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
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
                className="w-4 h-4 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <label htmlFor="login-remember" className="text-sm font-medium text-[var(--color-on-surface-variant)] select-none cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5 mt-2"
              size="lg"
            >
              Sign In
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-surface-container-highest)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--color-surface-container-lowest)] text-xs text-[var(--color-outline)] font-medium">
                New to FOSync?
              </span>
            </div>
          </div>

          {/* Signup link */}
          <Link
            to="/signup"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-2xl)] text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-surface-container)] text-[var(--color-on-surface)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-surface-container-low)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Create an account
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-[var(--color-outline)] font-bold mt-8">
            Only approved FOS students can register.
          </p>
        </div>
      </div>
    </div>
  );
}

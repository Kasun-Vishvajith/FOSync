import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { validatePassword } from '../utils/helpers';

/* tiny password strength indicator */
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          {c.met
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            : <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          }
          <span className={`text-xs ${c.met ? 'text-emerald-600' : 'text-gray-400'}`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}



export default function SignupPage() {
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);
    try {
      await signup(regNo.trim().toLowerCase(), name.trim(), password);
      navigate('/setup');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('auth/email-already-in-use')) {
        setError('This registration number is already registered.');
      } else {
        setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
      }
    } finally {
      setLoading(false);
    }
  }

  const passwordsMatch = confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen flex gradient-bg">

      {/* ════════════════════════════════
          CENTERED FORM
          ════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 py-10 overflow-y-auto">

        <div className="w-full max-w-md auth-card p-8 sm:p-10 bg-white animate-slide-in-right">

          {/* Typography Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-600 shadow-md flex items-center justify-center">
              <span className="font-serif text-2xl font-bold text-white italic">F</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-serif font-bold text-surface-100 tracking-tight">Create account</h2>
            <p className="mt-2 text-surface-400 text-sm font-medium">
              Fill in your details to get started
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-none text-sm font-semibold border-2 border-red-600 bg-red-50 text-red-600 animate-slide-down flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Reg No */}
            <div className="space-y-1.5">
              <label htmlFor="su-reg" className="block text-sm font-medium text-surface-200">
                Registration Number
              </label>
              <input
                id="su-reg"
                type="text"
                autoComplete="username"
                placeholder="e.g. 2022s19001"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                className="auth-input w-full px-4 py-3 text-sm font-medium"
              />

            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="su-name" className="block text-sm font-medium text-surface-200">
                Full Name
              </label>
              <input
                id="su-name"
                type="text"
                autoComplete="name"
                placeholder="As on your student ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input w-full px-4 py-3 text-sm font-medium"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-pw" className="block text-sm font-medium text-surface-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="su-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-confirm" className="block text-sm font-medium text-surface-200">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="su-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-input w-full px-4 py-3 pr-12 text-sm font-medium"
                  style={
                    confirmPassword
                      ? {
                          borderColor: passwordsMatch ? '#10b981' : '#ef4444',
                          boxShadow: passwordsMatch
                            ? '0 0 0 3px rgba(16, 185, 129, 0.15)'
                            : '0 0 0 3px rgba(239, 68, 68, 0.15)',
                        }
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-100 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600 font-semibold animate-slide-down">Passwords don't match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-emerald-600 font-semibold animate-slide-down flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2 mt-2
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
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign-in link */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-surface-500 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl text-sm font-medium bg-surface-900
              border border-surface-700 text-surface-200
              shadow-sm hover:bg-surface-800 active:bg-surface-700 hover:-translate-y-0.5
              transition-all duration-200
              cursor-pointer
            "
          >
            Sign in instead
          </Link>

          <p className="text-center text-xs text-surface-500 font-bold mt-6">
            Only approved students on the whitelist can register.
          </p>
        </div>
      </div>
    </div>
  );
}

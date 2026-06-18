import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Calendar, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
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

function StepCard({ num, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-none border-2 border-surface-100 bg-white shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
      <div className="w-8 h-8 rounded-none border-2 border-surface-100 flex items-center justify-center text-sm font-bold text-white bg-primary-600 shrink-0 shadow-[1px_1px_0px_0px_var(--color-surface-100)]">
        {num}
      </div>
      <div>
        <p className="text-surface-100 font-bold text-sm">{title}</p>
        <p className="text-surface-500 font-medium text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
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
          LEFT — brand panel
          ════════════════════════════════ */}
      <div className="auth-panel hidden lg:flex flex-col justify-between w-[42%] p-12">

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
              Get started in minutes
            </p>
            <h1 className="text-4xl font-bold text-surface-100 leading-tight">
              Join your<br />
              department's<br />
              <span className="text-primary-600">calendar hub.</span>
            </h1>
          </div>

          <p className="text-surface-300 text-base font-medium leading-relaxed max-w-xs">
            Register with your student number, pick your electives, and your personalised schedule is ready instantly.
          </p>

          {/* Steps */}
          <div className="space-y-3 pt-2">
            <StepCard
              num="1"
              title="Verify your registration number"
              desc="Must be on the approved student list"
            />
            <StepCard
              num="2"
              title="Choose your elective courses"
              desc="Core courses are auto-assigned by degree"
            />
            <StepCard
              num="3"
              title="View your personalised calendar"
              desc="Lectures, exams & deadlines, all in one place"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-surface-500 font-bold text-xs relative z-10">
          University of Colombo — Faculty of Science
        </p>
      </div>

      {/* ════════════════════════════════
          RIGHT — form panel
          ════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-100">FOSync</span>
        </div>

        <div className="w-full max-w-md auth-card p-8 bg-white animate-slide-in-right">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-surface-100 tracking-tight">Create account</h2>
            <p className="mt-2 text-surface-400 text-base font-medium">
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
              <label htmlFor="su-reg" className="block text-sm font-bold text-surface-200">
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
                className="auth-input w-full px-4 py-3 rounded-none text-sm font-semibold"
              />
              <p className="text-xs text-surface-500 font-medium">Format: YYYYsXXXXX</p>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="su-name" className="block text-sm font-bold text-surface-200">
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
                className="auth-input w-full px-4 py-3 rounded-none text-sm font-semibold"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-pw" className="block text-sm font-bold text-surface-200">
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-confirm" className="block text-sm font-bold text-surface-200">
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
                  className="auth-input w-full px-4 py-3 pr-12 rounded-none text-sm font-semibold"
                  style={
                    confirmPassword
                      ? {
                          borderColor: passwordsMatch ? '#16a34a' : '#dc2626',
                          transform: 'translate(-1px, -1px)',
                          boxShadow: passwordsMatch
                            ? '2px 2px 0px 0px var(--color-surface-100)'
                            : '2px 2px 0px 0px #dc2626',
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
              <div className="w-full border-t-2 border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-surface-500 font-bold">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
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

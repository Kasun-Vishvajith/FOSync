import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { validatePassword } from '../utils/helpers';
import Button from '../components/ui/Button';

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
            ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
            : <Circle className="w-3.5 h-3.5 text-[var(--color-outline-variant)] shrink-0" />
          }
          <span className={`text-xs ${c.met ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-outline)]'}`}>
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
  const [academicYear, setAcademicYear] = useState('2022/2023');
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
      await signup(regNo.trim().toLowerCase(), name.trim(), password, academicYear);
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
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 py-10 overflow-y-auto relative">
        {/* Decorative Background Blur */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[var(--color-tertiary-container)]/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[var(--color-primary-container)]/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

        <div className="w-full max-w-md bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-elevated)] rounded-[var(--radius-3xl)] p-8 sm:p-10 animate-fade-in relative z-10 border border-[var(--color-surface-container)]">

          {/* Typography Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-primary)] shadow-md flex items-center justify-center">
              <span className="font-serif text-2xl font-bold text-white italic">F</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight">Create account</h2>
            <p className="mt-2 text-[var(--color-on-surface-variant)] text-sm font-medium">
              Fill in your details to get started
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold border-2 border-[var(--color-error)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] animate-fade-in flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Reg No */}
            <div className="space-y-1.5">
              <label htmlFor="su-reg" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
                className="w-full px-4 py-3 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] transition-colors placeholder:text-[var(--color-outline-variant)]"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="su-name" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
                className="w-full px-4 py-3 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] transition-colors placeholder:text-[var(--color-outline-variant)]"
              />
            </div>

            {/* Batch Year */}
            <div className="space-y-1.5">
              <label htmlFor="su-batch" className="block text-sm font-semibold text-[var(--color-on-surface)]">
                Batch Year
              </label>
              <select
                id="su-batch"
                value={academicYear} // using academicYear state variable to store selected batch to minimize changes, or rename it later. Let's use academicYear as the state variable holding the batch to keep signup function parameter simple, or we can update signup to accept batch. Let's check AuthContext.
                onChange={(e) => setAcademicYear(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] transition-colors cursor-pointer"
              >
                <option value="2022/2023">2022/2023 (Year 4)</option>
                <option value="2023/2024">2023/2024 (Year 3)</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-pw" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="su-confirm" className="block text-sm font-semibold text-[var(--color-on-surface)]">
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
                  className="w-full px-4 py-3 pr-12 text-sm font-medium bg-[var(--color-surface-container)] border-none rounded-[var(--radius-lg)] text-[var(--color-on-surface)] transition-colors placeholder:text-[var(--color-outline-variant)]"
                  style={
                    confirmPassword
                      ? {
                          boxShadow: passwordsMatch
                            ? '0 0 0 2px var(--color-primary)'
                            : '0 0 0 2px var(--color-error)',
                          backgroundColor: 'var(--color-surface-container-lowest)',
                        }
                      : {}
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-[var(--color-error)] font-semibold animate-fade-in">Passwords don't match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-[var(--color-primary)] font-semibold animate-fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5 mt-2"
              size="lg"
            >
              Create Account
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          {/* Sign-in link */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-surface-container-highest)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--color-surface-container-lowest)] text-xs text-[var(--color-outline)] font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-2xl)] text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-surface-container)] text-[var(--color-on-surface)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-surface-container-low)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Sign in instead
          </Link>

          <p className="text-center text-xs text-[var(--color-outline)] font-bold mt-6">
            Only approved students on the whitelist can register.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
  LogIn,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';

export default function Navbar() {
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navLinks = [
    { to: '/dashboard', label: 'Calendar', icon: Calendar },
    ...(currentUser ? [{ to: '/chat', label: 'Chat', icon: MessageSquare }] : []),
    ...(currentUser ? [{ to: '/setup', label: 'Electives', icon: Settings }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="sticky top-4 z-40 bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft)] w-full">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Logo (takes 1/3 space on desktop for balance) */}
          <div className="flex items-center lg:w-1/3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-sm">
                <Calendar className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                FO<span className="text-[var(--color-text-secondary)]">Sync</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Nav (takes 1/3 space) */}
          <div className="hidden md:flex items-center justify-center lg:w-1/3 gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`
                  px-4 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium
                  transition-all duration-200
                  ${
                    location.pathname === to
                      ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent'
                  }
                `}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right: User Section / Login (takes 1/3 space) */}
          <div className="hidden md:flex items-center justify-end lg:w-1/3 gap-3">
            {currentUser ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {userProfile?.name || 'User'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[#da1e28] hover:bg-[#ffe6e8] transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/login')} className="rounded-[var(--radius-pill)] px-5">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
             {!currentUser && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="mr-2 rounded-[var(--radius-pill)]">
                  Sign In
                </Button>
             )}
            <button
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] animate-slide-down rounded-b-[var(--radius-xl)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium
                  transition-all duration-200
                  ${
                    location.pathname === to
                      ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
              >
                {Icon && <Icon className="w-4.5 h-4.5" />}
                {label}
              </Link>
            ))}
            
            {currentUser && (
              <div className="border-t border-[var(--color-border)] pt-2 mt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{userProfile?.name || 'User'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{userProfile?.reg_no}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[#da1e28] hover:bg-[#ffe6e8] w-full transition-colors cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

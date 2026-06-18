import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { userProfile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navLinks = [
    { to: '/dashboard', label: 'Calendar', icon: Calendar },
    { to: '/setup', label: 'Electives', icon: Settings },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 glass border-b border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
              <Calendar className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="gradient-text">FO</span>
              <span className="text-surface-100">Sync</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-none text-sm font-semibold border-2
                  transition-all duration-100
                  ${
                    location.pathname === to
                      ? 'bg-primary-100 text-primary-800 border-surface-100 shadow-[2px_2px_0px_0px_var(--color-surface-100)]'
                      : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800 border-transparent hover:border-surface-100 hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-surface-200">
                {userProfile?.name}
              </p>
              <p className="text-xs text-surface-500">{userProfile?.reg_no}</p>
            </div>
            <div className="w-8 h-8 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center text-white text-sm font-bold shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
              {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-none border-2 border-transparent hover:border-surface-100 text-surface-400 hover:text-red-600 hover:bg-surface-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-700/50 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-semibold border-2
                  transition-all duration-100
                  ${
                    location.pathname === to
                      ? 'bg-primary-100 text-primary-800 border-surface-100 shadow-[2px_2px_0px_0px_var(--color-surface-100)]'
                      : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800 border-transparent hover:border-surface-100'
                  }
                `}
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </Link>
            ))}
            <div className="border-t-2 border-surface-100 pt-2 mt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-none bg-primary-600 border-2 border-surface-100 flex items-center justify-center text-white text-sm font-bold shadow-[2px_2px_0px_0px_var(--color-surface-100)]">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-200">{userProfile?.name}</p>
                  <p className="text-xs text-surface-500">{userProfile?.reg_no}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-none border-2 border-transparent hover:border-red-600 text-sm font-bold text-red-600 hover:bg-surface-800 w-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

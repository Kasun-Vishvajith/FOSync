import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  LogOut,
  Settings,
  Shield,
  MessageSquare,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import AddEventModal from '../events/AddEventModal';

export default function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Calendar },
    ...(currentUser ? [{ to: '/timetable', label: 'Timetable', icon: Clock }] : []),
    ...(currentUser ? [{ to: '/chat', label: 'AI Assistant', icon: MessageSquare }] : []),
    ...(currentUser ? [{ to: '/setup', label: 'Electives', icon: Settings }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <nav 
        className={`bg-[var(--color-inverse-surface)] h-full left-0 top-0 fixed shadow-md hidden md:flex flex-col py-6 gap-2 z-50 transition-all duration-300 overflow-hidden ${isExpanded ? 'w-[240px]' : 'w-[80px]'}`}
      >
        {/* Branding/Logo */}
        <div className="flex items-center justify-start h-16 mb-6 px-5">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Toggle Sidebar"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
          <div className={`ml-4 transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="font-bold text-lg text-white">FOSync</h2>
            <p className="text-[var(--color-outline-variant)] text-[10px] uppercase tracking-wider font-semibold">Academic Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-2 space-y-2 flex flex-col">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                title={label}
                onClick={() => setIsExpanded(false)}
                className={`flex items-center gap-4 px-4 py-3 mx-1 transition-all duration-200 rounded-xl cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'text-[var(--color-outline-variant)] hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={`transition-opacity duration-200 font-medium text-sm whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User Info / Logout at Bottom */}
        {currentUser && (
          <div className="px-2 mt-auto">
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-4 text-[var(--color-outline-variant)] hover:text-white px-4 py-3 mx-1 hover:bg-white/10 transition-colors duration-200 rounded-xl w-full cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity duration-200 font-medium text-sm whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Logout
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 bg-[var(--color-surface-container-lowest)] shadow-lg border-t border-[var(--color-outline-variant)]/30 rounded-t-2xl z-50">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] font-semibold scale-95'
                  : 'text-[var(--color-on-surface-variant)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{label}</span>
            </Link>
          );
        })}
        {currentUser && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-1 text-[var(--color-on-surface-variant)]"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] mt-1">Logout</span>
          </button>
        )}
      </nav>

      {/* Global Add Event Modal */}
      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </>
  );
}

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';
import { Plus, Bell } from 'lucide-react';
import AddEventModal from '../events/AddEventModal';
import Select from '../ui/Select';
import { DEGREES } from '../../utils/constants';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { publicDegree, setPublicDegree } = useEvents() || {};
  const [addModalOpen, setAddModalOpen] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/chat':
        return 'AI Assistant';
      case '/setup':
        return 'Setup Curriculum';
      case '/admin':
        return 'Admin Panel';
      default:
        return 'FOSync';
    }
  };

  return (
    <div className="h-screen bg-[var(--color-background)] flex flex-col md:flex-row text-[var(--color-on-surface)] overflow-hidden">
      {/* Navbar encapsulates Desktop Sidebar and Mobile Bottom Nav */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen md:ml-[80px] w-full transition-all duration-300 overflow-y-auto overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="flex justify-between items-center w-full px-6 md:px-8 h-20 sticky top-0 backdrop-blur-md bg-[var(--color-surface)]/80 z-40 border-b border-[var(--color-surface-container-high)]">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">
              {getPageTitle()}
            </h1>
            
            {/* Degree Selector / Info */}
            {currentUser ? (
              <div className="hidden md:flex items-center gap-2 bg-[var(--color-surface-container-lowest)] px-4 py-1.5 rounded-full shadow-sm border border-[var(--color-surface-container-high)] text-sm font-medium">
                <span className="text-[var(--color-on-surface)]">{userProfile?.degree || 'B.S. Science'}</span>
              </div>
            ) : (
              publicDegree && setPublicDegree && (
                <div className="hidden md:block w-56">
                  <Select
                    value={publicDegree}
                    onChange={(e) => setPublicDegree(e.target.value)}
                    options={DEGREES.map((d) => ({ value: d, label: d }))}
                    className="!py-1.5 !text-xs"
                  />
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <button
                id="navbar-add-event-btn"
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-container)] transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>
            )}

            <button className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[var(--color-primary-fixed)] border border-[var(--color-primary-fixed-dim)] flex items-center justify-center text-[var(--color-primary)] text-sm font-bold shrink-0">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-medium text-[var(--color-on-surface)] hidden lg:inline">
                  {userProfile?.name?.split(' ')[0] || 'User'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 w-full px-6 md:px-8 py-6 flex flex-col">
          <div key={location.pathname} className="page-enter flex-1 min-h-0 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout() {
  const { userProfile } = useAuth();

  useEffect(() => {
    // Clear all existing theme classes first
    document.body.classList.remove(
      'theme-data-science',
      'theme-statistics',
      'theme-applied-statistics',
      'theme-industrial-statistics'
    );

    // Add new theme class based on degree
    if (userProfile?.degree === 'BSc Hons in Data Science' || userProfile?.degree === 'Data Science') {
      document.body.classList.add('theme-data-science');
    } else if (userProfile?.degree === 'Statistics') {
      document.body.classList.add('theme-statistics');
    } else if (userProfile?.degree === 'Applied Statistics') {
      document.body.classList.add('theme-applied-statistics');
    } else if (userProfile?.degree === 'Industrial Statistics') {
      document.body.classList.add('theme-industrial-statistics');
    }
  }, [userProfile?.degree]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6">
        <Navbar />
      </div>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

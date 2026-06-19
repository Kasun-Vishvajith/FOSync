import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 pt-4">
        <Navbar />
      </div>
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

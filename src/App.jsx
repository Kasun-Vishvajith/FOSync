import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminSetupPage = lazy(() => import('./pages/AdminSetupPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-bg">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
      <p className="text-[var(--color-text-secondary)] text-sm font-medium animate-pulse">Loading FOSync...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Layout routes - both public and protected mixed */}
            <Route element={<AppLayout />}>
              {/* Publicly viewable calendar */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Protected inner routes */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            <Route path="/init-admin" element={<AdminSetupPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}


import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EventsProvider } from './contexts/EventsContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
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
        {/* EventsProvider must be inside AuthProvider so it can read currentUser */}
        <EventsProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Layout routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route
                  path="/setup"
                  element={
                    <ProtectedRoute>
                      <SetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </EventsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

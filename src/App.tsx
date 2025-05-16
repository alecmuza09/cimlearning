import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients.tsx';
import { ProspectsKanban } from './pages/ProspectsKanban';
import { Policies } from './pages/Policies.tsx';
import { Documents } from './pages/Documents';
import { Learning } from './pages/Learning';
import { Reports } from './pages/Reports';
import { AuthProvider } from './contexts/AuthContext';
import { useApplyTheme } from './stores/themeStore';
import { Email } from './pages/Email.tsx';
import Marketing from './pages/Marketing.tsx';
import { LoadingSpinner } from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// --- Pages (Lazy Loaded) ---
const Login = lazy(() => import('./pages/Login.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const Leads = lazy(() => import('./pages/Leads.tsx'));

function App() {
  useApplyTheme();

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas */}
            <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/prospects" element={<ProspectsKanban />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/email" element={<Email />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Ruta Catch-all (opcional - 404) */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
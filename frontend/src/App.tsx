import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import { EmployeeDetailPage, EmployeeFormPage } from './pages/EmployeeDetailPage';
import OrgChartPage from './pages/OrgChartPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

// Redirects /profile → /employees/<logged-in user's employeeId>
const ProfileRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user?.employeeId) return null;
  return <Navigate to={`/employees/${user.employeeId}`} replace />;
};

const HomeRedirectOrDashboard: React.FC = () => {
  const { isEmployee } = useAuth();
  if (isEmployee()) {
    return <ProfileRedirect />;
  }
  return <DashboardPage />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><HomeRedirectOrDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/employees" element={
              <ProtectedRoute roles={['SUPER_ADMIN', 'HR_MANAGER']}>
                <Layout><EmployeesPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees/new" element={
              <ProtectedRoute roles={['SUPER_ADMIN', 'HR_MANAGER']}>
                <Layout><EmployeeFormPage mode="create" /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={
              <ProtectedRoute>
                <Layout><EmployeeDetailPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees/:id/edit" element={
              <ProtectedRoute>
                <Layout><EmployeeFormPage mode="edit" /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/org" element={
              <ProtectedRoute>
                <Layout><OrgChartPage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/departments" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <Layout><DepartmentsPage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><ProfileRedirect /></Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

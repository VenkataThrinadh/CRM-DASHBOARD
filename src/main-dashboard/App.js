import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { MenuVisibilityProvider } from './contexts/MenuVisibilityContext';
import DeviceRouter from './components/routing/DeviceRouter';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PropertyAnalytics from '../sales/components/analytics/PropertyAnalytics';
import AdvancedReports from '../sales/components/reports/AdvancedReports';
import LoansDashboard from './pages/LoansDashboard';
import LoginDebugger from './components/debug/LoginDebugger';
import EnvironmentChecker from './components/debug/EnvironmentChecker';
import Properties from '../sales/pages/Properties';
import Users from './pages/Users';
import Customers from './pages/Customers';
import Documents from './pages/Documents';
import Leads from '../sales/pages/Leads';
import LeadDetail from '../sales/pages/LeadDetail';
import Settings from './pages/Settings';
import SettingsHome from './pages/SettingsHome';
import UserManagementSettings from './pages/UserManagementSettings';
import ManageUsers from './pages/ManageUsers';
import ManageUserDetail from './pages/ManageUserDetail';
import ManageTeams from './pages/ManageTeams';
import AttendanceAvailability from './pages/AttendanceAvailability';
import AttendanceLogs from './pages/AttendanceLogs';
import BulkUpdateAvailability from './pages/BulkUpdateAvailability';
import TeamHierarchy from './pages/TeamHierarchy';
import UserScores from './pages/UserScores';
import ExportUserData from './pages/ExportUserData';
import BulkUpdateAvailabilities from './pages/BulkUpdateAvailabilities';
import Developer from './pages/Developer';
import PropertyDetail from '../sales/pages/PropertyDetail';
import UserDetail from './pages/UserDetail';
// Staff pages removed from Sales Dashboard — redirected to Manage Users
import CustomerDetail from './pages/CustomerDetail';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Loans Dashboard Pages
import LoansCustomers from '../loans/pages/Customers';
import LoansCustomerDocuments from '../loans/pages/CustomerDocuments';
import LoansBorrowers from '../loans/pages/Borrowers';
import LoansLoans from '../loans/pages/Loans';
import LoanDetail from '../loans/pages/LoanDetail';
import InterestDetails from '../loans/pages/InterestDetails';
import LoansPayments from '../loans/pages/Payments';
import LoansReceipts from '../loans/pages/Receipts';
import LoansReports from '../loans/pages/Reports';
import LoansTransactions from '../loans/pages/Transactions';
import LoansBalanceManagement from '../loans/pages/BalanceManagement';
import LoansSettings from '../loans/pages/Settings';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!(user?.role === 'admin' || user?.role === 'sub-admin')) return <Navigate to="/dashboard" replace />;
  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Debug Routes (accessible without authentication) */}
      <Route path="/debug-login" element={<LoginDebugger />} />
      <Route path="/debug-env" element={<EnvironmentChecker />} />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/sales-dashboard" replace />} />
        {/* Render the same Dashboard Overview for both /sales-dashboard and /dashboard */}
        <Route path="sales-dashboard" element={<Dashboard />} />
        <Route path="sales-dashboard/analytics" element={<PropertyAnalytics />} />
        <Route path="sales-dashboard/reports" element={<AdvancedReports />} />
        <Route path="loans-dashboard" element={<LoansDashboard />} />
        {/* Loans Dashboard Child Routes */}
        <Route path="loans-dashboard/customers" element={<LoansCustomers />} />
        <Route path="loans-dashboard/customer-documents" element={<LoansCustomerDocuments />} />
        <Route path="loans-dashboard/borrowers" element={<LoansBorrowers />} />
        <Route path="loans-dashboard/loans" element={<LoansLoans />} />
        <Route path="loans-dashboard/loans/:id" element={<LoanDetail />} />
        <Route path="loans-dashboard/loans/:id/interest" element={<InterestDetails />} />
        <Route path="loans-dashboard/payments" element={<LoansPayments />} />
        <Route path="loans-dashboard/receipts" element={<LoansReceipts />} />
        <Route path="loans-dashboard/reports" element={<LoansReports />} />
        <Route path="loans-dashboard/transactions" element={<LoansTransactions />} />
        <Route path="loans-dashboard/balance-management" element={<LoansBalanceManagement />} />
        <Route path="loans-dashboard/settings" element={<LoansSettings />} />
        {/* Sales Dashboard Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="users" element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        } />
        <Route path="users/:id" element={
          <AdminRoute>
            <UserDetail />
          </AdminRoute>
        } />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        {/* Staff pages removed from Sales Dashboard - redirect to Manage Users */}
        <Route path="staff" element={<Navigate to="/settings/manage-users" replace />} />
        <Route path="staff/:id" element={<Navigate to="/settings/manage-users" replace />} />
        <Route path="documents" element={<Documents />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="settings" element={
          <AdminRoute>
            <SettingsHome />
          </AdminRoute>
        } />
        <Route path="settings/user-management" element={
          <AdminRoute>
            <UserManagementSettings />
          </AdminRoute>
        } />
        <Route path="settings/manage-users" element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        } />
        <Route path="settings/manage-users/:id" element={
          <AdminRoute>
            <ManageUserDetail />
          </AdminRoute>
        } />
        <Route path="settings/manage-teams" element={
          <AdminRoute>
            <ManageTeams />
          </AdminRoute>
        } />
        <Route path="settings/attendance-availability" element={
          <AdminRoute>
            <AttendanceAvailability />
          </AdminRoute>
        } />
        <Route path="settings/attendance-logs" element={
          <AdminRoute>
            <AttendanceLogs />
          </AdminRoute>
        } />
        <Route path="settings/bulk-update-availability" element={
          <AdminRoute>
            <BulkUpdateAvailability />
          </AdminRoute>
        } />
        <Route path="settings/team-hierarchy" element={
          <AdminRoute>
            <TeamHierarchy />
          </AdminRoute>
        } />
        <Route path="settings/user-scores" element={
          <AdminRoute>
            <UserScores />
          </AdminRoute>
        } />
        <Route path="settings/export-user-data" element={
          <AdminRoute>
            <ExportUserData />
          </AdminRoute>
        } />
        <Route path="settings/bulk-update-availabilities" element={
          <AdminRoute>
            <BulkUpdateAvailabilities />
          </AdminRoute>
        } />
        <Route path="settings/:settingKey" element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } />
        <Route path="developer" element={
          <AdminRoute>
            <Developer />
          </AdminRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DeviceRouter>
          <AuthProvider>
            <NotificationsProvider>
              <MenuVisibilityProvider>
                <ToastContainer position="top-right" autoClose={3000} />
                <Router>
                  <AppRoutes />
                </Router>
              </MenuVisibilityProvider>
            </NotificationsProvider>
          </AuthProvider>
        </DeviceRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
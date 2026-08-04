import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { EmailVerification } from './pages/Auth/EmailVerification';
import { Layout } from './pages/Chat/Layout';

// Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';

// Root Redirect Guard
const RootRedirect = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/chat'} replace />;
  }
  return <Navigate to="/login" replace />;
};

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// User-only Route Guard
const UserRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Admin') {
    return <Navigate to="/chat" replace />;
  }
  return children;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 select-none">
        <div className="h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 tracking-[0.15em] uppercase">Connecting to Sampark...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect home route directly to Login (or Chat/Admin if logged in) */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email-verification" element={<EmailVerification />} />

        {/* Application routes wrapped with authentication guards */}
        <Route 
          path="/chat" 
          element={
            <UserRoute>
              <Layout />
            </UserRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          } 
        />

        {/* Redirect invalid routes back to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

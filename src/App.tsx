import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ChildrenLogin from './pages/ChildrenLogin';
import ChildrenDashboard from './pages/dashboards/ChildrenDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import AccountSettings from './pages/AccountSettings';
import Profile from './pages/Profile';

function AppContent() {
  const { currentUser, userData, loading } = useAuth();

  // Debug logging
  console.log('AppContent - loading:', loading);
  console.log('AppContent - currentUser:', currentUser);
  console.log('AppContent - userData:', userData);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Children Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={userData ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={currentUser ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/reset-password" 
            element={<ResetPassword />} 
          />
          <Route 
            path="/pending-approval" 
            element={<PendingApproval />} 
          />
          <Route 
            path="/children-login" 
            element={<ChildrenLogin />} 
          />
          <Route 
            path="/children-dashboard" 
            element={<ChildrenDashboard />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {!userData ? (
                  <div className="loading-container">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <p>Loading user data...</p>
                    </div>
                  </div>
                ) : userData.role === 'teacher' && userData.isApproved === false ? (
                  <Navigate to="/pending-approval" />
                ) : userData.role === 'admin' ? (
                  <AdminDashboard />
                ) : userData.role === 'teacher' ? (
                  <TeacherDashboard />
                ) : userData.role === 'parent' ? (
                  <ParentDashboard />
                ) : (
                  <div className="error-container">
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access this dashboard.</p>
                    <button onClick={() => window.location.href = '/login'}>
                      Go to Login
                    </button>
                  </div>
                )}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={currentUser && userData ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

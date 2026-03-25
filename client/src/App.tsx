import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import DraftRoom from './pages/DraftRoom';
import MyRoster from './pages/MyRoster';
import MemberRoster from './pages/MemberRoster';
import Politicians from './pages/Politicians';
import Scoring from './pages/Scoring';
import PoliticianProfile from './pages/PoliticianProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPoliticians from './pages/admin/AdminPoliticians';
import AdminScores from './pages/admin/AdminScores';
import AdminLeagues from './pages/admin/AdminLeagues';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAiScoring from './pages/admin/AdminAiScoring';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
      <Route path="/leagues/:id" element={<ProtectedRoute><LeagueDetail /></ProtectedRoute>} />
      <Route path="/leagues/:id/draft" element={<ProtectedRoute><DraftRoom /></ProtectedRoute>} />
      <Route path="/leagues/:id/roster" element={<ProtectedRoute><MyRoster /></ProtectedRoute>} />
      <Route path="/leagues/:id/roster/:memberId" element={<ProtectedRoute><MemberRoster /></ProtectedRoute>} />
      <Route path="/politicians" element={<ProtectedRoute><Politicians /></ProtectedRoute>} />
      <Route path="/scoring" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
      <Route path="/politicians/:id" element={<ProtectedRoute><PoliticianProfile /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/politicians" element={<AdminRoute><AdminPoliticians /></AdminRoute>} />
      <Route path="/admin/scores" element={<AdminRoute><AdminScores /></AdminRoute>} />
      <Route path="/admin/leagues" element={<AdminRoute><AdminLeagues /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/ai-scoring" element={<AdminRoute><AdminAiScoring /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

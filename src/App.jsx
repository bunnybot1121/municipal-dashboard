import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import LoginPage from './pages/Login';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import IssueList from './pages/IssueList';
import IssueDetail from './pages/IssueDetail';
import TaskScheduler from './pages/TaskScheduler';
import Analytics from './pages/Analytics';

import Staff from './pages/Staff';
import ScheduleUploadPage from './pages/ScheduleUploadPage';
import CitizenReports from './pages/CitizenReports';
import Notifications from './pages/Notifications';
import WorkerLogin from './pages/WorkerLogin';
import WorkerDashboard from './pages/WorkerDashboard';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Guard to force onboarding if city is not selected
const OnboardingGuard = ({ children }) => {
    const { user, city, isAdmin, loading } = useAuth();

    if (loading) return null; // Wait for auth to settle

    // If Admin and no city assigned -> Force Onboarding
    // AND check we aren't already there to avoid loops if this guard was widely used (it's not, but good practice)
    if (isAdmin && !city) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/onboarding" element={
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    } />

                    {/* Worker Portal Routes */}
                    <Route path="/worker" element={<WorkerLogin />} />
                    <Route path="/worker/dashboard" element={
                        <ProtectedRoute>
                            <WorkerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={
                        <ProtectedRoute>
                            {/* <OnboardingGuard> */}
                            <DashboardLayout />
                            {/* </OnboardingGuard> */}
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="issues" element={<IssueList />} />
                        <Route path="issues/:id" element={<IssueDetail />} />
                        <Route path="scheduler" element={<TaskScheduler />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="staff" element={<Staff />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="upload" element={<ScheduleUploadPage />} />
                        <Route path="citizen-reports" element={<CitizenReports />} />
                        <Route path="notifications" element={<Notifications />} />
                        {/* Redirects */}
                        <Route path="calendar" element={<Navigate to="/scheduler" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

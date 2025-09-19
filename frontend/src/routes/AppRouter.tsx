import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useAuth } from '../contexts/AuthContext';

// Layout components
import { Layout, PublicLayout } from '../components/Layout';
import LoadingScreen from '../components/Loading/LoadingScreen';

// Pages
import { Dashboard } from '../pages/Dashboard';
import { StudyEditor } from '../pages/StudyEditor';
import { StudyParticipation } from '../pages/StudyParticipation';
import { Analysis } from '../pages/Analysis';
import { Login, ParticipantEntry } from '../pages/Auth';
import { MapDemoPage } from '../pages/MapDemo/MapDemoPage';
import { DrawingDemoPage } from '../pages/DrawingDemo/DrawingDemoPage';
import { AudioDemoPage } from '../pages/AudioDemo/AudioDemoPage';
import { FLOMDemoPage } from '../pages/FLOMDemo/FLOMDemoPage';
import { MentalMapsPage } from '../pages/MentalMaps/MentalMapsPage';

// Route guards
import { ProtectedRoute, PublicRoute } from '.';

const AppRouter: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { isInitialized } = useAuth();

    // Show loading screen while authentication is being initialized
    if (!isInitialized) {
        return <LoadingScreen message="Authentifizierung wird überprüft..." />;
    }

    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    <PublicRoute>
                        <PublicLayout>
                            <Login />
                        </PublicLayout>
                    </PublicRoute>
                } />

                <Route path="/participate/:studyId" element={
                    <PublicLayout>
                        <ParticipantEntry />
                    </PublicLayout>
                } />

                <Route path="/study/:studyId/participate" element={
                    <PublicLayout>
                        <StudyParticipation />
                    </PublicLayout>
                } />

                {/* Protected researcher routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/studies/new" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <StudyEditor />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/studies/:studyId/edit" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <StudyEditor />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/studies/:studyId/analysis" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <Analysis />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/studies/:studyId/mental-maps" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <MentalMapsPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/map-demo" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <MapDemoPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/drawing-demo" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <DrawingDemoPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/audio-demo" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <AudioDemoPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/flom-demo" element={
                    <ProtectedRoute requiredRole="researcher">
                        <Layout>
                            <FLOMDemoPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* Default redirects */}
                <Route path="/" element={
                    isAuthenticated && user?.role === 'researcher'
                        ? <Navigate to="/dashboard" replace />
                        : <Navigate to="/login" replace />
                } />

                {/* Catch all route */}
                <Route path="*" element={
                    <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
                } />
            </Routes>
        </Router>
    );
};

export default AppRouter;
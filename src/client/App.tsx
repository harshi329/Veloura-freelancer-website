import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.js';
import { Layout } from './components/Layout.js';
import { BrandedLoadingScreen } from './components/BrandLogo.js';
import { HomePage } from './pages/HomePage.js';
import { AuthPage } from './pages/AuthPage.js';
import { AuthCallbackPage } from './pages/AuthCallbackPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { NewProjectPage } from './pages/NewProjectPage.js';
import { ProjectDetailPage } from './pages/ProjectDetailPage.js';
import { FreelancersPage } from './pages/FreelancersPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

const AppRoutes: React.FC = () => {
  const { loading, user } = useApp();

  if (loading) {
    return <BrandedLoadingScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={user ? <DashboardPage /> : <AuthPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/freelancers" element={<FreelancersPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
};

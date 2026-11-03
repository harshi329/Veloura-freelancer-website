import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.js';
import { Layout } from './components/Layout.js';
import { AuthPage } from './pages/AuthPage.js';
import { applyThemePreference, type ThemeMode } from './components/ThemeSelector.js';

// Code-split other pages to keep bundle size lean
const HomePage = lazy(() => import('./pages/HomePage.js').then((m) => ({ default: m.HomePage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage.js').then((m) => ({ default: m.AuthCallbackPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.js').then((m) => ({ default: m.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.js').then((m) => ({ default: m.OnboardingPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.js').then((m) => ({ default: m.ProjectsPage })));
const NewProjectPage = lazy(() => import('./pages/NewProjectPage.js').then((m) => ({ default: m.NewProjectPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage.js').then((m) => ({ default: m.ProjectDetailPage })));
const FreelancersPage = lazy(() => import('./pages/FreelancersPage.js').then((m) => ({ default: m.FreelancersPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })));

const AppRoutes: React.FC = () => {

  useEffect(() => {
    const saved = localStorage.getItem('color-scheme');
    const mode: ThemeMode = saved === 'light' || saved === 'dark' ? saved : 'system';
    applyThemePreference(mode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = localStorage.getItem('color-scheme');
      if (!current || current === 'system') {
        applyThemePreference('system');
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <Layout>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/freelancers" element={<FreelancersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Suspense>
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

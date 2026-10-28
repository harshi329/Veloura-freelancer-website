import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { BrandedLoadingScreen } from '../components/BrandLogo.js';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, showToast } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishOAuth() {
      const oauthError = searchParams.get('oauthError');
      if (oauthError) {
        navigate(`/auth?oauthError=${encodeURIComponent(oauthError)}`, { replace: true });
        return;
      }

      try {
        await refreshUser();
        if (cancelled) return;

        const next = searchParams.get('next') || '/dashboard';
        const provider = searchParams.get('provider') || 'OAuth';
        const displayProvider = provider.charAt(0).toUpperCase() + provider.slice(1);
        showToast(`Signed in successfully via ${displayProvider}`, 'success');
        navigate(next, { replace: true });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Authentication session could not be established');
        showToast('Authentication failed. Please try signing in again.', 'error');
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000);
      }
    }

    finishOAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser, searchParams, showToast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)] p-6">
        <div className="veloura-surface max-w-md w-full p-8 text-center space-y-4">
          <p className="text-sm text-rose-500 font-semibold">{error}</p>
          <p className="text-xs text-[var(--text-muted)]">Redirecting back to sign-in...</p>
        </div>
      </div>
    );
  }

  return <BrandedLoadingScreen />;
};

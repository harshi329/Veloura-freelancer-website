import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo.js';
import { useApp } from '../context/AppContext.js';
import type { UserProfile } from '../../shared/types.js';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { apiFetch, setSession, showToast } = useApp();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkToken() {
      if (!token || token.length < 20) {
        if (active) {
          setValidating(false);
          setTokenValid(false);
        }
        return;
      }

      try {
        const res = await apiFetch<{ valid: boolean; email?: string }>(
          `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`
        );
        if (active) {
          setTokenValid(Boolean(res.valid));
          if (res.email) setAccountEmail(res.email);
          setValidating(false);
        }
      } catch {
        if (active) {
          setTokenValid(false);
          setValidating(false);
        }
      }
    }

    checkToken();

    return () => {
      active = false;
    };
  }, [apiFetch, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch<{ message: string; token?: string; user?: UserProfile }>(
        '/api/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ token, password }),
        }
      );

      setSuccess(true);
      showToast('Password updated successfully.', 'success');

      if (res.token && res.user) {
        setSession(res.token, res.user);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setTimeout(() => navigate('/auth'), 2000);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-black text-white selection:bg-rose-500 selection:text-white">
      {/* Background Architectural Image with Cinematic Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('/images/auth-architecture.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/25 via-transparent to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 lg:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <BrandLogo size="sm" subtitle="TALENT MEETS OPPORTUNITY" />
        </Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md backdrop-blur-2xl bg-black/60 border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          {validating ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white/70 font-medium">Validating security token...</p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                  Reset Link Expired or Invalid
                </h2>
                <p className="text-xs text-white/60 leading-relaxed">
                  For your account security, password reset links expire after 30 minutes and can
                  only be used once.
                </p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-sm hover:from-rose-500 hover:to-rose-400 transition-all shadow-lg shadow-rose-950/40"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                  Password Updated
                </h2>
                <p className="text-xs text-white/60">
                  Your credentials have been securely updated. Redirecting to your workspace...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
                  Choose New Password
                </h2>
                {accountEmail && (
                  <p className="text-xs text-white/60 font-medium">
                    Resetting credentials for{' '}
                    <span className="text-white font-semibold">{accountEmail}</span>
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Salted bcrypt hash with zero plaintext storage.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-rose-500/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 lg:px-12 py-5 text-center text-xs text-white/40">
        © 2026 Veloura. All rights reserved.
      </footer>
    </div>
  );
};

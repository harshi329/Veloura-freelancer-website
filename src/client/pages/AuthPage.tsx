import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Users,
  TrendingUp,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  X,
  Send,
  HelpCircle,
  FileText,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { UserProfile, UserRole } from '../../shared/types.js';
import {
  BrandLogo,
  BrandCrest,
  BrandWordmark,
} from '../components/BrandLogo.js';
import { applyThemePreference, type ThemeMode } from '../components/ThemeSelector.js';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const oauthErrorParam = searchParams.get('oauthError');

  // Form State
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // App context & navigation
  const { apiFetch, setSession, showToast, user } = useApp();
  const navigate = useNavigate();


  // Live stats from platform
  const [stats, setStats] = useState({
    freelancers: '10K+',
    projects: '5K+',
    satisfaction: '98%',
  });

  // OAuth availability & config
  const [oauthProviders, setOauthProviders] = useState<{
    google: boolean;
    github: boolean;
    googleClientId?: string | null;
    githubClientId?: string | null;
    googleCallbackUrl?: string;
    githubCallbackUrl?: string;
  }>({
    google: false,
    github: false,
  });

  // Theme Dropdown State
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'system';
  });
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    message: string;
    devResetUrl?: string;
  } | null>(null);

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportTopic, setSupportTopic] = useState<'account' | 'billing' | 'project' | 'trust' | 'other'>('account');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);

  const [policyModalOpen, setPolicyModalOpen] = useState<'terms' | 'privacy' | 'about' | 'how-it-works' | null>(null);
  const [socialChooserModal, setSocialChooserModal] = useState<'google' | 'github' | null>(null);
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const [customSocialName, setCustomSocialName] = useState('');
  const [customSocialEmail, setCustomSocialEmail] = useState('');
  const [showCustomSocialInput, setShowCustomSocialInput] = useState(false);
  const [oauthConfigTab, setOauthConfigTab] = useState<'credentials' | 'direct'>('credentials');
  const [configClientId, setConfigClientId] = useState('');
  const [configClientSecret, setConfigClientSecret] = useState('');
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Fetch initial stats & OAuth config
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const statsData = await apiFetch<{
          freelancersCount?: number;
          totalProjects?: number;
          clientSatisfaction?: number;
        }>('/api/stats');
        if (active && statsData) {
          setStats({
            freelancers:
              statsData.freelancersCount && statsData.freelancersCount > 0
                ? `${Math.max(10, statsData.freelancersCount)}K+`
                : '10K+',
            projects:
              statsData.totalProjects && statsData.totalProjects > 0
                ? `${Math.max(5, statsData.totalProjects)}K+`
                : '5K+',
            satisfaction:
              statsData.clientSatisfaction !== undefined
                ? `${statsData.clientSatisfaction}%`
                : '98%',
          });
        }
      } catch {
        // Fallback stats retained
      }

      try {
        const oauthData = await apiFetch<{
          google: boolean;
          github: boolean;
          googleClientId?: string | null;
          githubClientId?: string | null;
          googleCallbackUrl?: string;
          githubCallbackUrl?: string;
        }>('/api/auth/oauth/providers');
        if (active && oauthData) {
          setOauthProviders(oauthData);
        }
      } catch {
        // Default false
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [apiFetch]);

  // Handle URL oauthError & openChooser parameters
  useEffect(() => {
    const openChooser = searchParams.get('openChooser');
    if (openChooser === 'google' || openChooser === 'github') {
      setSocialChooserModal(openChooser);
    }

    if (oauthErrorParam) {
      if (oauthErrorParam.includes('not_configured')) {
        const provider = oauthErrorParam.split('_')[0];
        if (provider === 'google' || provider === 'github') {
          setSocialChooserModal(provider);
        } else {
          setError('Social sign-in is not configured on this environment. Use email/password or 1-click Demo credentials.');
        }
      } else if (oauthErrorParam === 'invalid_state') {
        setError('Social authentication session timed out. Please try again.');
      } else {
        setError(`Social authentication error: ${oauthErrorParam.replace(/_/g, ' ')}`);
      }
    }
  }, [oauthErrorParam, searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (modeToSet: ThemeMode) => {
    setThemeMode(modeToSet);
    applyThemePreference(modeToSet);
    setThemeDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        });
        setSession(res.token, res.user);
        showToast(`Welcome back, ${res.user.name}`, 'success');
        navigate('/dashboard');
      } else {
        const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            title: role === 'client' ? 'Product Lead' : 'Specialist',
          }),
        });
        setSession(res.token, res.user);
        showToast(`Account created! Welcome to Veloura, ${res.user.name}.`, 'success');
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async (demoRole: 'client' | 'freelancer') => {
    setError(null);
    setSubmitting(true);
    const demoEmail = demoRole === 'client' ? 'client@veloura.dev' : 'freelancer@veloura.dev';
    const label = demoRole === 'client' ? 'Client Workspace' : 'Freelancer Workspace';

    try {
      const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: 'Password123!', role: demoRole }),
      });
      setSession(res.token, res.user);
      showToast(`Signed in as ${res.user.name} (${label})`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Social Auth Click Handler
  const handleSocialClick = (provider: 'google' | 'github') => {
    if (oauthProviders[provider]) {
      window.location.href = `/api/auth/oauth/${provider}/start?role=${role}`;
    } else {
      setSocialChooserModal(provider);
      setShowCustomSocialInput(false);
      setOauthConfigTab('credentials');
      setConfigClientId('');
      setConfigClientSecret('');
    }
  };

  const handleDirectSocialAuth = async (authEmail: string, authName: string, avatarUrl?: string) => {
    if (!socialChooserModal) return;
    setSocialSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: UserProfile; next?: string }>(
        `/api/auth/oauth/${socialChooserModal}/direct`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: authEmail,
            name: authName,
            avatarUrl,
            role,
          }),
        }
      );
      setSession(res.token, res.user);
      const providerLabel = socialChooserModal === 'google' ? 'Google' : 'GitHub';
      showToast(`Signed in successfully via ${providerLabel} as ${res.user.name}`, 'success');
      setSocialChooserModal(null);
      navigate(res.next || '/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Social sign-in failed', 'error');
    } finally {
      setSocialSubmitting(false);
    }
  };

  const handleConfigureOAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialChooserModal || !configClientId.trim() || !configClientSecret.trim()) return;
    setConfigSubmitting(true);

    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        configured: boolean;
        provider: 'google' | 'github';
      }>('/api/auth/oauth/configure', {
        method: 'POST',
        body: JSON.stringify({
          provider: socialChooserModal,
          clientId: configClientId.trim(),
          clientSecret: configClientSecret.trim(),
        }),
      });

      const prov = socialChooserModal;
      setOauthProviders((prev) => ({
        ...prev,
        [prov]: true,
      }));

      showToast(`Real ${prov === 'google' ? 'Google' : 'GitHub'} OAuth connected! Redirecting to sign in...`, 'success');
      setTimeout(() => {
        window.location.href = `/api/auth/oauth/${prov}/start?role=${role}`;
      }, 700);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save OAuth credentials', 'error');
    } finally {
      setConfigSubmitting(false);
    }
  };

  // Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitting(true);
    setForgotResult(null);

    try {
      const res = await apiFetch<{
        message: string;
        devResetUrl?: string;
        expiresInMinutes: number;
      }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotResult({
        message: res.message,
        devResetUrl: res.devResetUrl,
      });
      showToast('Password reset link generated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reset email.', 'error');
    } finally {
      setForgotSubmitting(false);
    }
  };

  // Support Request Submit
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSubmitting(true);

    try {
      const res = await apiFetch<{ ticket: { _id: string }; message: string }>('/api/support', {
        method: 'POST',
        body: JSON.stringify({
          name: supportName.trim(),
          email: supportEmail.trim(),
          topic: supportTopic,
          message: supportMessage.trim(),
        }),
      });
      setSupportTicketId(res.ticket._id);
      showToast('Support ticket logged with Veloura concierge.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#180f14] dark:bg-black text-[#1e1318] dark:text-white selection:bg-rose-500 selection:text-white font-['Inter',sans-serif] transition-colors duration-300">
      {/* Background Cinematic Architectural Image — Visible in both modes, subtly shaded in light mode */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-80 dark:opacity-100 transition-opacity duration-300"
        style={{ backgroundImage: `url('/images/auth-architecture.jpg')` }}
      />
      {/* Gradient Vignettes: Subtly darkened in light mode to let the architectural arches & skyline emerge without dominating */}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 via-stone-900/35 to-stone-900/45 dark:from-black/92 dark:via-black/75 dark:to-black/88 pointer-events-none transition-colors duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-stone-950/35 dark:from-black dark:via-transparent dark:to-black/60 pointer-events-none transition-colors duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent dark:from-rose-950/25 dark:via-transparent dark:to-transparent pointer-events-none" />

      {/* ================================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ================================================================= */}
      <header className="relative z-20 w-full px-6 lg:px-14 py-6 flex items-center justify-between">
        {/* Brand Crest & Wordmark */}
        <Link to="/" className="inline-flex items-center gap-3.5 group focus:outline-none shrink-0 whitespace-nowrap">
          <BrandCrest size="md" />
          <BrandWordmark size="md" variant="on-dark" subtitle="TALENT MEETS OPPORTUNITY" />
        </Link>

        {/* Top-Right Theme Dropdown (System / Light / Dark) */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-rose-200/90 dark:border-white/20 text-xs font-semibold text-stone-900 dark:text-white transition-all cursor-pointer shadow-md"
            aria-expanded={themeDropdownOpen}
            aria-haspopup="true"
          >
            {themeMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : themeMode === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-rose-300" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-stone-700 dark:text-white/80" />
            )}
            <span className="capitalize">{themeMode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500 dark:text-white/60 ml-0.5" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-black/85 border border-rose-200/90 dark:border-white/20 shadow-2xl py-1.5 z-50 animate-reveal">
              {(
                [
                  { id: 'system', label: 'System', Icon: Monitor },
                  { id: 'light', label: 'Light', Icon: Sun },
                  { id: 'dark', label: 'Dark', Icon: Moon },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectTheme(id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    themeMode === id
                      ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-semibold'
                      : 'text-stone-700 dark:text-white/75 hover:bg-rose-50/70 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. MAIN TWO-COLUMN CONTENT */}
      {/* ================================================================= */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-14 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ------------------------------------------------------------- */}
          {/* LEFT HERO COLUMN */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-rose-500/15 backdrop-blur-md border border-rose-200/90 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold tracking-wider uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" />
              <span>FREELANCERS × CLIENTS × OPPORTUNITIES</span>
            </div>

            {/* Display Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] text-white tracking-tight leading-[1.08] drop-shadow-sm">
                Build Your
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal font-['DM_Serif_Display',serif] italic bg-gradient-to-r from-rose-300 via-rose-400 to-pink-300 bg-clip-text text-transparent leading-[1.12]">
                Next Chapter
              </h1>
            </div>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg text-white/90 max-w-xl font-normal leading-relaxed">
              Veloura connects talented freelancers and forward-thinking clients to collaborate,
              create and grow together.
            </p>

            {/* 4 Feature Cards Row (Find Talent, Post Projects, Work Securely, Grow Together) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                {
                  label: 'Find Talent',
                  Icon: Search,
                  desc: 'Curated leaders',
                  action: () => navigate('/freelancers'),
                },
                {
                  label: 'Post Projects',
                  Icon: Briefcase,
                  desc: 'Verified briefs',
                  action: () => navigate('/projects/new'),
                },
                {
                  label: 'Work Securely',
                  Icon: ShieldCheck,
                  desc: 'Escrow protection',
                  action: () => setPolicyModalOpen('how-it-works'),
                },
                {
                  label: 'Grow Together',
                  Icon: TrendingUp,
                  desc: 'Long-term equity',
                  action: () => setPolicyModalOpen('about'),
                },
              ].map(({ label, Icon, desc, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="group flex flex-col items-start p-3.5 sm:p-4 rounded-2xl backdrop-blur-md bg-white/90 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-rose-200/90 hover:border-rose-400 dark:border-white/10 dark:hover:border-rose-400/40 text-left transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100/90 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-300 group-hover:scale-105 group-hover:bg-rose-200/70 dark:group-hover:bg-rose-500/30 transition-all mb-2.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold font-['Space_Grotesk'] text-[#1e1318] group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-200 transition-colors">
                    {label}
                  </span>
                  <span className="text-[11px] text-stone-600 group-hover:text-stone-900 dark:text-white/50 dark:group-hover:text-white/70 transition-colors mt-0.5">
                    {desc}
                  </span>
                </button>
              ))}
            </div>

            {/* 3 Live Stats (10K+ Talented Freelancers, 5K+ Projects Posted, 98% Client Satisfaction) */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/20">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white tracking-tight drop-shadow-xs">
                  {stats.freelancers}
                </div>
                <div className="text-xs text-white/75 font-medium">Talented Freelancers</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white tracking-tight drop-shadow-xs">
                  {stats.projects}
                </div>
                <div className="text-xs text-white/75 font-medium">Projects Posted</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-rose-300 tracking-tight drop-shadow-xs">
                  {stats.satisfaction}
                </div>
                <div className="text-xs text-white/75 font-medium">Client Satisfaction</div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT COLUMN: FROSTED GLASSMORPHIC AUTH CARD */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex justify-center -translate-y-3 sm:-translate-y-5 lg:-translate-y-7">
            <div className="w-full max-w-md backdrop-blur-2xl bg-white/95 dark:bg-black/60 border border-rose-200/90 dark:border-white/20 rounded-3xl p-6 sm:p-7.5 shadow-2xl shadow-rose-950/20 dark:shadow-2xl space-y-5 relative overflow-hidden transition-colors duration-300">
              {/* Subtle Ambient Card Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-rose-400/20 dark:bg-rose-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-pink-400/15 dark:bg-pink-500/15 blur-3xl pointer-events-none" />

              {/* Card Header: Crest + VELOURA + TALENT MEETS OPPORTUNITY */}
              <div className="text-center flex flex-col items-center gap-2 relative z-10">
                <BrandCrest size="lg" className="mb-1" />
                <BrandWordmark size="lg" align="center" subtitle="TALENT MEETS OPPORTUNITY" />
              </div>

              {/* Segmented Role Selector: Client vs Freelancer */}
              <div className="relative z-10 grid grid-cols-2 p-1 rounded-xl bg-rose-100/60 dark:bg-white/[0.08] border border-rose-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    role === 'client'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/30'
                      : 'text-stone-600 hover:text-stone-900 dark:text-white/70 dark:hover:text-white'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    role === 'freelancer'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/30'
                      : 'text-stone-600 hover:text-stone-900 dark:text-white/70 dark:hover:text-white'
                  }`}
                >
                  Freelancer
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="relative z-10 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2 animate-reveal">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {/* Name (if Register mode) */}
                {mode === 'register' && (
                  <div className="space-y-1.5 animate-reveal">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 dark:text-white/40">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === 'client' ? 'Alex Mercer' : 'Elena Vance'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 dark:bg-white/[0.07] border border-rose-200/90 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 dark:text-white/40">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 dark:bg-white/[0.07] border border-rose-200/90 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotResult(null);
                          setForgotModalOpen(true);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 font-medium cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 dark:text-white/40">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/90 dark:bg-white/[0.07] border border-rose-200/90 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action: "Sign In →" or "Create Account →" */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-rose-500/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider: "or continue with" */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex-1 h-px bg-rose-200/80 dark:bg-white/15" />
                <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-white/40 font-medium">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-rose-200/80 dark:bg-white/15" />
              </div>

              {/* Social Login Buttons (Google & GitHub) */}
              <div className="relative z-10 grid grid-cols-2 gap-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-rose-200/90 dark:border-white/15 text-stone-800 dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs group"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* GitHub Button */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('github')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-stone-800 dark:border-white/15 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs group"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Mode Switcher: "Don't have an account? Create one" */}
              <div className="relative z-10 text-center pt-1">
                {mode === 'login' ? (
                  <p className="text-xs text-stone-600 dark:text-white/60">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                      }}
                      className="text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-stone-600 dark:text-white/60">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>

              {/* Quick 1-Click Demo Credentials Pill */}
              <div className="relative z-10 pt-3 border-t border-rose-200/70 dark:border-white/10">
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-white/50 mb-2">
                  <span className="font-medium">1-Click Instant Preview:</span>
                  <KeyRound className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('client')}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-rose-200/80 dark:border-white/10 text-[11px] font-medium text-stone-700 hover:text-stone-900 dark:text-white/80 dark:hover:text-white transition-all text-center cursor-pointer"
                  >
                    👤 Client Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('freelancer')}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-rose-200/80 dark:border-white/10 text-[11px] font-medium text-stone-700 hover:text-stone-900 dark:text-white/80 dark:hover:text-white transition-all text-center cursor-pointer"
                  >
                    ⚡ Freelancer Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* 3. BOTTOM FOOTER BAR */}
      {/* ================================================================= */}
      <footer className="relative z-20 w-full px-6 lg:px-14 py-6 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/70">
        {/* Left Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          <Link to="/home" className="hover:text-white transition-colors">
            Explore Overview
          </Link>
          <button
            type="button"
            onClick={() => setPolicyModalOpen('about')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            About
          </button>
          <Link to="/projects" className="hover:text-white transition-colors">
            Features
          </Link>
          <button
            type="button"
            onClick={() => setPolicyModalOpen('how-it-works')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => setPolicyModalOpen('terms')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => setPolicyModalOpen('privacy')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setSupportModalOpen(true)}
            className="hover:text-rose-200 text-rose-300 font-medium transition-colors cursor-pointer"
          >
            Support
          </button>
        </div>

        {/* Right Section: Social Icons & Copyright */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Veloura LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Veloura Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Veloura X"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Veloura YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
          <span className="text-white/50">© 2026 Veloura. All rights reserved.</span>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* 4. MODALS (FORGOT PASSWORD, SUPPORT, TERMS/PRIVACY, OAUTH NOTICE) */}
      {/* ================================================================= */}

      {/* A. FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-stone-900/50 dark:bg-black/70 animate-reveal">
          <div className="w-full max-w-md backdrop-blur-2xl bg-white/95 dark:bg-black/85 border border-rose-200/90 dark:border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-[#1e1318] dark:text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#1e1318] dark:text-white">
                  Reset Password
                </h3>
                <p className="text-xs text-stone-500 dark:text-white/60">
                  Enter your email address and we will provide a secure 30-minute reset link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotResult.message}</span>
                </div>

                {forgotResult.devResetUrl && (
                  <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-white/[0.06] border border-rose-200 dark:border-white/10 space-y-2">
                    <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider">
                      Development Reset Link Generated:
                    </div>
                    <p className="text-xs text-stone-700 dark:text-white/70 break-all font-mono">
                      {forgotResult.devResetUrl}
                    </p>
                    <a
                      href={forgotResult.devResetUrl}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 font-semibold pt-1"
                    >
                      <span>Open Reset Password Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-stone-800 dark:text-white transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-xs font-semibold text-stone-700 dark:text-white/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-semibold text-white hover:from-rose-500 hover:to-rose-400 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* B. SUPPORT TICKET MODAL */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-stone-900/50 dark:bg-black/70 animate-reveal">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-white/95 dark:bg-black/85 border border-rose-200/90 dark:border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-[#1e1318] dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#1e1318] dark:text-white">
                  Veloura Concierge Support
                </h3>
                <p className="text-xs text-stone-500 dark:text-white/60">
                  Our engineering and support team investigates all tickets with milestone telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSupportModalOpen(false);
                  setSupportTicketId(null);
                }}
                className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supportTicketId ? (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Support Ticket Created</span>
                  </div>
                  <p className="text-emerald-800/80 dark:text-emerald-200/80">
                    Your request has been logged. Reference ID:{' '}
                    <span className="font-mono font-bold text-stone-900 dark:text-white">{supportTicketId}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSupportModalOpen(false);
                    setSupportTicketId(null);
                    setSupportMessage('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-stone-800 dark:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                    Topic
                  </label>
                  <select
                    value={supportTopic}
                    onChange={(e) =>
                      setSupportTopic(
                        e.target.value as 'account' | 'billing' | 'project' | 'trust' | 'other'
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="account">Account Access & Authentication</option>
                    <option value="billing">Billing & Milestone Escrow</option>
                    <option value="project">Project Scope & Contracts</option>
                    <option value="trust">Trust, Identity & Security</option>
                    <option value="other">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                    Detailed Message
                  </label>
                  <textarea
                    required
                    minLength={10}
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe what you need assistance with..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-xs font-semibold text-stone-700 dark:text-white/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-semibold text-white hover:from-rose-500 hover:to-rose-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{supportSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* C. POLICY & INFO MODALS (TERMS, PRIVACY, ABOUT, HOW IT WORKS) */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-stone-900/50 dark:bg-black/70 animate-reveal">
          <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/95 dark:bg-black/90 border border-rose-200/90 dark:border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-[#1e1318] dark:text-white max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-rose-200/70 dark:border-white/10 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#1e1318] dark:text-white capitalize">
                  {policyModalOpen === 'how-it-works' ? 'How Veloura Works' : policyModalOpen}
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                  Veloura Sovereign Freelance Network & Market Standards
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPolicyModalOpen(null)}
                className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs sm:text-sm text-stone-600 dark:text-white/80 leading-relaxed font-normal">
              {policyModalOpen === 'terms' && (
                <>
                  <p>
                    <strong>1. Platform Agreement:</strong> By accessing Veloura, clients and
                    freelancers agree to conduct professional engagements with transparency,
                    milestone-backed escrows, and verifiable portfolio credentials.
                  </p>
                  <p>
                    <strong>2. Milestone Delivery & Escrow:</strong> Client deposits are held in
                    milestone escrow accounts and released upon deliverable verification. Both
                    parties are bound by contract scopes submitted through the platform.
                  </p>
                  <p>
                    <strong>3. Intellectual Property:</strong> Unless explicitly amended in the
                    contract agreement, full intellectual property transfers to the client upon
                    final milestone release.
                  </p>
                  <p>
                    <strong>4. Transparent Telemetry:</strong> All match scores, rates, and verified
                    delivery logs reflect authentic marketplace activity. Artificial inflation of
                    credentials is strictly prohibited.
                  </p>
                </>
              )}

              {policyModalOpen === 'privacy' && (
                <>
                  <p>
                    <strong>1. Zero Data Resale:</strong> Veloura never sells user, contract, or
                    telemetry data to data brokers or third-party advertisers.
                  </p>
                  <p>
                    <strong>2. Cryptographic Security:</strong> Passwords are encrypted using salted
                    bcrypt rounds with zero plaintext storage. Auth tokens use tamper-resistant
                    cryptographic signatures.
                  </p>
                  <p>
                    <strong>3. Profile Visibility:</strong> Freelancers control portfolio
                    visibility. Financial details are restricted strictly between contract
                    participants.
                  </p>
                  <p>
                    <strong>4. Account Deletion:</strong> Users may request permanent account and
                    data purge at any time through our support concierge.
                  </p>
                </>
              )}

              {policyModalOpen === 'about' && (
                <>
                  <p>
                    <strong>Veloura</strong> is an architectural marketplace connecting engineering
                    and design leaders with principal-grade independent specialists.
                  </p>
                  <p>
                    Unlike generic freelance boards, Veloura evaluates every brief through our
                    signature five-factor matching engine: skill telemetry, rate compatibility,
                    seniority track record, portfolio evidence, and delivery reliability.
                  </p>
                  <p>
                    Headquartered in San Francisco with remote specialists distributed across 40+
                    countries.
                  </p>
                </>
              )}

              {policyModalOpen === 'how-it-works' && (
                <>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-white/[0.05] border border-rose-200/70 dark:border-white/10 space-y-1">
                      <div className="font-semibold text-[#1e1318] dark:text-white">1. Post or Explore Briefs</div>
                      <p className="text-stone-500 dark:text-white/70">
                        Clients post architectural briefs with clear deliverables, budget ranges, and
                        milestones.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-white/[0.05] border border-rose-200/70 dark:border-white/10 space-y-1">
                      <div className="font-semibold text-[#1e1318] dark:text-white">2. 5-Factor Telemetry Match</div>
                      <p className="text-stone-500 dark:text-white/70">
                        Our engine computes transparent match scores across skill overlap, rate, and
                        past contract delivery.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-white/[0.05] border border-rose-200/70 dark:border-white/10 space-y-1">
                      <div className="font-semibold text-[#1e1318] dark:text-white">3. Milestone-Based Execution</div>
                      <p className="text-stone-500 dark:text-white/70">
                        Work with complete peace of mind through step-by-step milestone funding and
                        verifiable delivery reviews.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-rose-200/70 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModalOpen(null)}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. INTERACTIVE REAL OAUTH 2.0 API & ACCOUNT MODAL */}
      {socialChooserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-stone-900/50 dark:bg-black/75 animate-reveal">
          <div className="w-full max-w-lg backdrop-blur-2xl bg-white/95 dark:bg-zinc-950/95 border border-rose-200/90 dark:border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-[#1e1318] dark:text-white max-h-[90vh] overflow-y-auto">
            {/* Header with Google or GitHub Branding */}
            <div className="flex items-start justify-between border-b border-rose-200/70 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                {socialChooserModal === 'google' ? (
                  <div className="w-10 h-10 rounded-2xl bg-white border border-rose-200/80 p-2 shadow-xs flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 p-2 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#1e1318] dark:text-white">
                    {socialChooserModal === 'google' ? 'Real Google OAuth API' : 'Real GitHub OAuth API'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-white/60">
                    Authenticate via {socialChooserModal === 'google' ? 'Google Cloud' : 'GitHub'} as{' '}
                    <span className="text-rose-600 dark:text-rose-300 font-semibold uppercase">{role}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSocialChooserModal(null)}
                className="text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs: Real API vs Direct Account */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-rose-100/60 dark:bg-white/[0.08] border border-rose-200/80 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setOauthConfigTab('credentials')}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  oauthConfigTab === 'credentials'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900 dark:text-white/70 dark:hover:text-white'
                }`}
              >
                ⚡ Live OAuth 2.0 API
              </button>
              <button
                type="button"
                onClick={() => setOauthConfigTab('direct')}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  oauthConfigTab === 'direct'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900 dark:text-white/70 dark:hover:text-white'
                }`}
              >
                👤 Direct Sign-In
              </button>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 dark:bg-white/[0.05] border border-rose-200/70 dark:border-white/10 text-xs">
              <span className="text-stone-600 dark:text-white/70 font-medium">Marketplace Role:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    role === 'client'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100/70 text-stone-600 hover:text-stone-900 dark:bg-white/10 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    role === 'freelancer'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100/70 text-stone-600 hover:text-stone-900 dark:bg-white/10 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  Freelancer
                </button>
              </div>
            </div>

            {/* TAB 1: REAL OAUTH 2.0 API SETUP & LAUNCH */}
            {oauthConfigTab === 'credentials' && (
              <div className="space-y-4 animate-reveal">
                {/* Redirect URI Info */}
                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-white/[0.06] border border-rose-200/70 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider">
                      Authorized Redirect URI:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const url =
                          socialChooserModal === 'google'
                            ? oauthProviders.googleCallbackUrl || 'http://localhost:5000/api/auth/oauth/google/callback'
                            : oauthProviders.githubCallbackUrl || 'http://localhost:5000/api/auth/oauth/github/callback';
                        navigator.clipboard.writeText(url);
                        setCopiedCallback(true);
                        setTimeout(() => setCopiedCallback(false), 2000);
                      }}
                      className="text-[11px] text-stone-500 hover:text-stone-800 dark:text-white/60 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCallback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-black/50 border border-rose-200 dark:border-white/10 font-mono text-[11px] text-stone-800 dark:text-white/80 break-all select-all">
                    {socialChooserModal === 'google'
                      ? oauthProviders.googleCallbackUrl || 'http://localhost:5000/api/auth/oauth/google/callback'
                      : oauthProviders.githubCallbackUrl || 'http://localhost:5000/api/auth/oauth/github/callback'}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-white/50 leading-relaxed">
                    {socialChooserModal === 'google'
                      ? 'Add this URI to "Authorized redirect URIs" in your Google Cloud Console (Credentials → OAuth 2.0 Client IDs).'
                      : 'Add this URI to "Authorization callback URL" in your GitHub Developer settings (OAuth Apps).'}
                  </p>
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleConfigureOAuth} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      {socialChooserModal === 'google' ? 'Google OAuth Client ID' : 'GitHub Client ID'}
                    </label>
                    <input
                      type="text"
                      required
                      value={configClientId}
                      onChange={(e) => setConfigClientId(e.target.value)}
                      placeholder={
                        socialChooserModal === 'google'
                          ? '123456789-xxxx.apps.googleusercontent.com'
                          : 'Iv1.xxxxxxxxxxxx'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-xs font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-white/70">
                      {socialChooserModal === 'google' ? 'Google OAuth Client Secret' : 'GitHub Client Secret'}
                    </label>
                    <input
                      type="password"
                      required
                      value={configClientSecret}
                      onChange={(e) => setConfigClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white placeholder-stone-400 dark:placeholder-white/35 focus:outline-none focus:border-rose-500 text-xs font-mono transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={configSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 text-white font-semibold text-xs hover:shadow-lg hover:shadow-rose-500/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {configSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving credentials & launching OAuth...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Launch Real {socialChooserModal === 'google' ? 'Google' : 'GitHub'} OAuth →</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: DIRECT INSTANT SIGN-IN */}
            {oauthConfigTab === 'direct' && (
              <div className="space-y-3 animate-reveal">
                <div className="text-[11px] font-semibold text-stone-500 dark:text-white/50 uppercase tracking-wider">
                  Select an instant identity:
                </div>

                {(socialChooserModal === 'google'
                  ? [
                      {
                        name: 'Harsh',
                        email: 'harsh@veloura.dev',
                        tag: 'Active Workspace User',
                        avatar: 'https://ui-avatars.com/api/?name=Harsh&background=EA4335&color=ffffff&bold=true',
                      },
                      {
                        name: 'Alex Mercer',
                        email: 'alex.mercer@gmail.com',
                        tag: 'Client & Tech Lead',
                        avatar: 'https://ui-avatars.com/api/?name=Alex+Mercer&background=4285F4&color=ffffff&bold=true',
                      },
                      {
                        name: 'Elena Vance',
                        email: 'elena.vance@gmail.com',
                        tag: 'Design & Engineering Specialist',
                        avatar: 'https://ui-avatars.com/api/?name=Elena+Vance&background=34A853&color=ffffff&bold=true',
                      },
                    ]
                  : [
                      {
                        name: 'Harsh Dev',
                        email: 'harsh.dev@github.com',
                        tag: 'Verified Contributor',
                        avatar: 'https://ui-avatars.com/api/?name=Harsh+Dev&background=24292e&color=ffffff&bold=true',
                      },
                      {
                        name: 'Elena Vance',
                        email: 'elena.vance@github.com',
                        tag: 'Principal Architect',
                        avatar: 'https://ui-avatars.com/api/?name=Elena+Vance&background=6f42c1&color=ffffff&bold=true',
                      },
                    ]
                ).map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={socialSubmitting}
                    onClick={() => handleDirectSocialAuth(acc.email, acc.name, acc.avatar)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-rose-200/70 hover:border-rose-400 dark:border-white/10 dark:hover:border-rose-400/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full border border-rose-200 dark:border-white/20 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#1e1318] group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-200 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-white/60 font-mono">{acc.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 dark:text-white/40 block">{acc.tag}</span>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-rose-600 dark:text-white/40 dark:group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all inline-block mt-0.5" />
                    </div>
                  </button>
                ))}

                {/* Custom Google/GitHub Input Toggle */}
                <div className="pt-2">
                  {!showCustomSocialInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomSocialInput(true)}
                      className="text-xs text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>+ Use another {socialChooserModal === 'google' ? 'Google' : 'GitHub'} account</span>
                    </button>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!customSocialEmail.trim()) return;
                        handleDirectSocialAuth(
                          customSocialEmail.trim(),
                          customSocialName.trim() || customSocialEmail.split('@')[0]
                        );
                      }}
                      className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-white/[0.05] border border-rose-200/80 dark:border-white/10 space-y-3 animate-reveal"
                    >
                      <div className="text-xs font-semibold text-[#1e1318] dark:text-white">
                        Enter your {socialChooserModal === 'google' ? 'Google' : 'GitHub'} details:
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-600 dark:text-white/60">Display Name</label>
                        <input
                          type="text"
                          value={customSocialName}
                          onChange={(e) => setCustomSocialName(e.target.value)}
                          placeholder="e.g. Jordan Lee"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-600 dark:text-white/60">
                          {socialChooserModal === 'google' ? 'Google Email Address' : 'GitHub Account Email'}
                        </label>
                        <input
                          type="email"
                          required
                          value={customSocialEmail}
                          onChange={(e) => setCustomSocialEmail(e.target.value)}
                          placeholder={socialChooserModal === 'google' ? 'you@gmail.com' : 'you@github.com'}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.07] border border-rose-200 dark:border-white/15 text-[#1e1318] dark:text-white text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={socialSubmitting}
                        className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-xs hover:from-rose-500 hover:to-rose-400 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {socialSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In with this {socialChooserModal === 'google' ? 'Google' : 'GitHub'} Account</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

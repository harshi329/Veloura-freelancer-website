import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  Briefcase,
  FileText,
  Bookmark,
  MessageSquare,
  FileCheck,
  DollarSign,
  User,
  BarChart3,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Plus,
  PlusCircle,
  Users,
  Send,
  Award,
  ShieldAlert,
  ExternalLink,
  X,
  Sparkles,
  LogOut,
  Edit3,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type {
  ProposalItem,
  ContractItem,
  ReportItem,
  ProjectItem,
  UserProfile,
  MatchBreakdown,
} from '../../shared/types.js';
import { BrandLogo } from '../components/BrandLogo.js';
import { applyThemePreference } from '../components/ThemeSelector.js';
import { ExplainableMatchCard } from '../components/ExplainableMatchCard.js';
import { PageTitle, SupportText } from '../components/Typography.js';
import { DashboardPortfolioView } from '../components/dashboard/DashboardPortfolioView.js';
import { DashboardMessagesView } from '../components/dashboard/DashboardMessagesView.js';
import { DashboardPostProjectView } from '../components/dashboard/DashboardPostProjectView.js';
import { DashboardProjectsView } from '../components/dashboard/DashboardProjectsView.js';
import { DashboardProposalsView } from '../components/dashboard/DashboardProposalsView.js';
import { DashboardContractsView } from '../components/dashboard/DashboardContractsView.js';
import { DashboardSavedFreelancersView } from '../components/dashboard/DashboardSavedFreelancersView.js';
import { DashboardPaymentsView } from '../components/dashboard/DashboardPaymentsView.js';
import { DashboardFindFreelancersView } from '../components/dashboard/DashboardFindFreelancersView.js';
import { DashboardSettingsView } from '../components/dashboard/DashboardSettingsView.js';

const SPARKLINE_BARS_1 = [28, 42, 36, 58, 48, 76, 95];
const SPARKLINE_BARS_2 = [22, 35, 30, 50, 68, 82, 100];
const SPARKLINE_BARS_3 = [30, 45, 52, 40, 66, 85, 98];
const SPARKLINE_BARS_4 = [18, 32, 48, 56, 72, 84, 96];

const SKILL_BADGE_COLORS = [
  'from-cyan-400 to-blue-500',
  'from-rose-400 to-pink-600',
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-600',
  'from-fuchsia-500 to-rose-500',
];

const MiniSparkline: React.FC<{ bars: number[] }> = ({ bars }) => (
  <div className="flex items-end gap-1 h-8" aria-hidden="true">
    {bars.map((h, i) => (
      <span
        key={i}
        style={{ height: `${h}%` }}
        className={`w-1.5 rounded-t-sm transition-all ${
          i >= bars.length - 2
            ? 'bg-gradient-to-t from-rose-500 to-pink-300'
            : 'bg-rose-500/30 dark:bg-rose-400/25'
        }`}
      />
    ))}
  </div>
);

export const DashboardPage: React.FC = () => {
  const {
    user,
    apiFetch,
    setSession,
    showToast,
    refreshUser,
    refreshNotifications,
    notifications,
    markAllNotificationsRead,
    logout,
  } = useApp();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<(ProjectItem & { matchBreakdown?: MatchBreakdown })[]>(
    []
  );
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeNav, setActiveNav] = useState<string>(tabParam || 'dashboard');

  useEffect(() => {
    if (tabParam) {
      setActiveNav(tabParam);
    }
  }, [tabParam]);
  const [selectedProposalProjectId, setSelectedProposalProjectId] = useState<string | null>(null);
  const [chatProjectId, setChatProjectId] = useState<string | null>(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Interactive Profile Edit Modal (for updating the user's own Name, Role, Title, Bio, Skills, Rate)
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'freelancer' | 'client'>('freelancer');
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState(110);
  const [editSkillsText, setEditSkillsText] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Interactive Workflow Modals
  const [reviewProposalModal, setReviewProposalModal] = useState<ProposalItem | null>(null);
  const [submitModalContract, setSubmitModalContract] = useState<ContractItem | null>(null);
  const [deliverableSummary, setDeliverableSummary] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');

  const [completeModalContract, setCompleteModalContract] = useState<ContractItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    'Exceptional architectural clarity, responsive communication, and zero-defect milestone delivery.'
  );

  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    return (
      document.documentElement.dataset.theme === 'dark' ||
      (!localStorage.getItem('color-scheme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const toggleTheme = () => {
    const next = isDarkTheme ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme);
    applyThemePreference(next);
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditRole(user.role === 'client' ? 'client' : 'freelancer');
      setEditTitle(user.title || '');
      setEditCompany(user.company || '');
      setEditLocation(user.location || 'Remote');
      setEditBio(user.bio || '');
      setEditHourlyRate(user.hourlyRate || 110);
      setEditSkillsText((user.skills || []).join(', '));
    }
  }, [user]);

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    try {
      const [projRes, propRes, contractRes, reportRes] = await Promise.all([
        apiFetch<{ projects: (ProjectItem & { matchBreakdown?: MatchBreakdown })[] }>(
          '/api/projects'
        ),
        apiFetch<{ proposals: ProposalItem[] }>('/api/my/proposals'),
        apiFetch<{ contracts: ContractItem[] }>('/api/contracts'),
        apiFetch<{ reports: ReportItem[] }>('/api/reports'),
      ]);
      setProjects(projRes.projects || []);
      setProposals(propRes.proposals || []);
      setContracts(contractRes.contracts || []);
      setReports(reportRes.reports || []);
    } catch {
      // Ignore partial error
    }
  }, [apiFetch, user]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-5 bg-[var(--bg-canvas)]">
        <BrandLogo size="lg" />
        <PageTitle>Sign In to Your Veloura Dashboard</PageTitle>
        <SupportText className="mx-auto max-w-md">
          Sign in with your own account or create a new Freelancer or Client profile to access your
          personalized workspace.
        </SupportText>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-rose)] px-6 py-3 type-btn text-white shadow-sm"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/auth?mode=register"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3 type-btn text-[var(--text-primary)]"
          >
            <span>Create Your Account</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProfileModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim().length < 2) {
      showToast('Please enter a valid name (at least 2 characters).', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const skillsArray = editSkillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiFetch<{ user: UserProfile; token?: string }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          role: user.role === 'admin' ? undefined : editRole,
          title: editTitle.trim(),
          company: editCompany.trim(),
          location: editLocation.trim(),
          bio: editBio.trim(),
          hourlyRate: Number(editHourlyRate),
          skills: skillsArray,
          onboarded: true,
        }),
      });

      if (res.token && res.user) {
        setSession(res.token, res.user);
      } else {
        await refreshUser();
      }
      setEditProfileOpen(false);
      await loadWorkspace();
      showToast(`Profile updated for ${res.user.name}!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProposalDecision = async (
    proposalId: string,
    status: 'shortlisted' | 'accepted' | 'rejected'
  ) => {
    try {
      await apiFetch(`/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(
        status === 'accepted'
          ? 'Proposal accepted! Atomic contract created in MongoDB.'
          : `Proposal marked as ${status}.`,
        'success'
      );
      setReviewProposalModal(null);
      await loadWorkspace();
      await refreshNotifications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update proposal', 'error');
    }
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalContract) return;
    try {
      await apiFetch(`/api/contracts/${submitModalContract._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ deliverableSummary, deliverableUrl }),
      });
      showToast('Deliverables submitted to client for milestone release!', 'success');
      setSubmitModalContract(null);
      setDeliverableSummary('');
      setDeliverableUrl('');
      await loadWorkspace();
      await refreshNotifications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit deliverables', 'error');
    }
  };

  const handleContractComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalContract) return;
    try {
      await apiFetch(`/api/contracts/${completeModalContract._id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ rating: Number(reviewRating), comment: reviewComment }),
      });
      showToast('Contract completed, funds released, and verified review published!', 'success');
      setCompleteModalContract(null);
      await loadWorkspace();
      await refreshUser();
      await refreshNotifications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to complete contract', 'error');
    }
  };

  const handleModerationUpdate = async (
    reportId: string,
    status: 'investigating' | 'resolved' | 'dismissed'
  ) => {
    try {
      await apiFetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          resolutionNotes: `Reviewed by ${user.name} (${status.toUpperCase()})`,
        }),
      });
      showToast(`Report updated to ${status}.`, 'success');
      await loadWorkspace();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Moderation update failed', 'error');
    }
  };

  const isClient = user.role === 'client';
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Dynamic Profile Completion calculation from the logged-in user's real MongoDB profile
  const hasBasicInfo = Boolean(user.name && user.title);
  const hasSkills = (user.skills?.length || 0) > 0;
  const portfolioCount = user.portfolio?.length || 0;
  const isVerified = Boolean(user.verified);
  const profileCompletionPct = Math.min(
    100,
    (hasBasicInfo ? 28 : 10) +
      (hasSkills ? 26 : 0) +
      Math.min(24, portfolioCount * 12) +
      (isVerified ? 22 : 0)
  );

  // Dynamic Project & Contract counts from MongoDB
  const inProgressProjectsCount = projects.filter((p) => p.status === 'in_progress').length;
  const openProjectsCount = projects.filter((p) => p.status === 'open').length;
  const completedProjectsCount = projects.filter((p) => p.status === 'completed').length;
  const totalContractValue = contracts.reduce((sum, c) => sum + (c.agreedAmount || 0), 0);
  const displayedEarnings = totalContractValue > 0 ? totalContractValue : 4280;

  const earningsMonths = [
    { month: 'Jan', height: 26, amount: `$${Math.round(displayedEarnings * 0.32).toLocaleString()}` },
    { month: 'Feb', height: 38, amount: `$${Math.round(displayedEarnings * 0.45).toLocaleString()}` },
    { month: 'Mar', height: 48, amount: `$${Math.round(displayedEarnings * 0.58).toLocaleString()}` },
    { month: 'Apr', height: 44, amount: `$${Math.round(displayedEarnings * 0.52).toLocaleString()}` },
    { month: 'May', height: 68, amount: `$${Math.round(displayedEarnings * 0.78).toLocaleString()}` },
    { month: 'Jun', height: 92, amount: `$${displayedEarnings.toLocaleString()}` },
  ];

  // Dynamic Top Skills from the logged-in user's actual skills
  const userSkillsList =
    user.skills && user.skills.length > 0
      ? user.skills.slice(0, 5)
      : ['React', 'UI/UX Design', 'Next.js', 'TypeScript', 'Figma'];

  const dynamicTopSkills = userSkillsList.map((skillName, idx) => ({
    name: skillName,
    views: Math.max(120, 320 - idx * 35),
    pct: Math.max(48, 92 - idx * 10),
    badge: skillName.slice(0, 2).toUpperCase(),
    color: SKILL_BADGE_COLORS[idx % SKILL_BADGE_COLORS.length],
  }));

  // Filter projects & proposals by searchQuery
  const filteredRecommendedProjects = projects
    .filter((p) => p.status === 'open')
    .filter((p) =>
      !searchQuery.trim()
        ? true
        : p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredProposals = proposals.filter((prop) => {
    if (!searchQuery.trim()) return true;
    const projTitle = ((prop.projectId as ProjectItem)?.title || '').toLowerCase();
    const freelancerName = (prop.freelancer?.name || '').toLowerCase();
    return (
      projTitle.includes(searchQuery.toLowerCase()) ||
      freelancerName.includes(searchQuery.toLowerCase())
    );
  });

  // Sidebar Menu Items
  const freelancerMenu = [
    { id: 'dashboard', label: 'Dashboard', Icon: Home },
    { id: 'browse', label: 'Browse Projects', Icon: Briefcase },
    {
      id: 'proposals',
      label: 'My Proposals',
      Icon: FileText,
      badge: proposals.length || undefined,
    },
    { id: 'saved', label: 'Saved Projects', Icon: Bookmark },
    {
      id: 'messages',
      label: 'Messages',
      Icon: MessageSquare,
      badge: unreadNotifCount || undefined,
    },
    { id: 'contracts', label: 'Contracts', Icon: FileCheck },
    { id: 'earnings', label: 'Earnings', Icon: DollarSign },
    { id: 'portfolio', label: 'Portfolio', Icon: User },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  const clientMenu = [
    { id: 'dashboard', label: 'Dashboard', Icon: Home },
    { id: 'post', label: 'Post a Project', Icon: PlusCircle },
    { id: 'my-projects', label: 'My Projects', Icon: Briefcase },
    {
      id: 'proposals',
      label: 'Proposals',
      Icon: FileText,
      badge: proposals.length || undefined,
    },
    { id: 'messages', label: 'Messages', Icon: MessageSquare },
    { id: 'contracts', label: 'Contracts', Icon: FileCheck },
    { id: 'saved-talent', label: 'Saved Freelancers', Icon: Bookmark },
    { id: 'payments', label: 'Payments', Icon: DollarSign },
    { id: 'find-talent', label: 'Find Freelancers', Icon: Users },
    { id: 'portfolio', label: 'Portfolio', Icon: Layers },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  const menuItems = isClient ? clientMenu : freelancerMenu;

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)] pb-20 lg:pb-0">
      {/* =====================================================================
          LEFT SIDEBAR (Desktop) — Shows Logged-In User's Dynamic Name & Role
      ===================================================================== */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-rose-600/20 via-pink-500/10 to-transparent blur-2xl"
        />

        <div className="space-y-6 relative z-10">
          <Link to="/" className="block px-1 pt-1 focus:outline-none">
            <BrandLogo size="md" subtitle="TALENT MEETS OPPORTUNITY" />
          </Link>

          <nav aria-label="Dashboard Sidebar Navigation" className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.Icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-transparent border border-rose-400/40 text-[var(--text-primary)] font-semibold shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/70 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-[var(--brand-rose)]' : 'text-[var(--text-muted)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </span>

                  {item.badge && (
                    <span className="type-numeric inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logged-In User Profile Card (Click to Edit Name & Profile) */}
        <div className="relative z-10 pt-4 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-2.5">
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              title="Click to edit your name and profile"
              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-rose-500/30">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--bg-elevated)]" />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--brand-rose)]">
                  {user.name}
                </p>
                <p className="text-[11px] capitalize text-[var(--text-muted)]">{user.role}</p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                title="Edit your name & profile"
                aria-label="Edit your name and profile"
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--brand-rose)] cursor-pointer"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN DASHBOARD AREA
      ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Brand Bar (Visible only on mobile screens < 1024px; desktop uses sleek left sidebar) */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-md px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link to="/">
              <BrandLogo size="sm" showWordmark={true} subtitle="" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Light or Dark Theme"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
              >
                {isDarkTheme ? <Moon className="h-4 w-4 text-rose-300" /> : <Sun className="h-4 w-4 text-rose-500" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1440px] w-full mx-auto">
          {activeNav === 'post' && (
            <DashboardPostProjectView
              user={user}
              apiFetch={apiFetch}
              onProjectCreated={(newProject) => {
                setProjects((prev) => [newProject, ...prev]);
                setActiveNav(isClient ? 'my-projects' : 'browse');
              }}
              showToast={showToast}
            />
          )}

          {(activeNav === 'my-projects' || activeNav === 'browse') && (
            <DashboardProjectsView
              user={user}
              projects={projects}
              proposals={proposals}
              onSelectProjectProposals={(pId) => {
                setSelectedProposalProjectId(pId);
                setActiveNav('proposals');
              }}
              onOpenProjectChat={(pId) => {
                setChatProjectId(pId);
                setActiveNav('messages');
              }}
              onNavigatePost={() => setActiveNav('post')}
            />
          )}

          {activeNav === 'proposals' && (
            <DashboardProposalsView
              user={user}
              proposals={proposals}
              selectedProjectId={selectedProposalProjectId}
              onClearProjectFilter={() => setSelectedProposalProjectId(null)}
              onProposalDecision={handleProposalDecision}
              onOpenReviewModal={(prop) => setReviewProposalModal(prop)}
              onOpenChat={(pId) => {
                setChatProjectId(pId);
                setActiveNav('messages');
              }}
            />
          )}

          {activeNav === 'messages' && (
            <DashboardMessagesView
              user={user}
              apiFetch={apiFetch}
              showToast={showToast}
              initialProjectId={chatProjectId || undefined}
            />
          )}

          {activeNav === 'contracts' && (
            <DashboardContractsView
              user={user}
              contracts={contracts}
              onSubmitDeliverable={(contract) => setSubmitModalContract(contract)}
              onCompleteContract={(contract) => setCompleteModalContract(contract)}
              onOpenChat={(pId) => {
                setChatProjectId(pId);
                setActiveNav('messages');
              }}
            />
          )}

          {(activeNav === 'saved-talent' || activeNav === 'saved') && (
            <DashboardSavedFreelancersView
              user={user}
              apiFetch={apiFetch}
              onNavigateFindTalent={() => setActiveNav(isClient ? 'find-talent' : 'browse')}
              showToast={showToast}
            />
          )}

          {(activeNav === 'payments' || activeNav === 'earnings') && (
            <DashboardPaymentsView
              user={user}
              contracts={contracts}
              showToast={showToast}
            />
          )}

          {activeNav === 'find-talent' && (
            <DashboardFindFreelancersView
              user={user}
              apiFetch={apiFetch}
              showToast={showToast}
            />
          )}

          {activeNav === 'portfolio' && (
            <DashboardPortfolioView
              user={user}
              apiFetch={apiFetch}
              refreshUser={refreshUser}
              showToast={showToast}
            />
          )}

          {activeNav === 'settings' && (
            <DashboardSettingsView
              user={user}
              apiFetch={apiFetch}
              setSession={setSession}
              refreshUser={refreshUser}
              showToast={showToast}
            />
          )}

          {activeNav === 'dashboard' && (
            <>
              {/* =================================================================
                  ROW 1: HERO WELCOME BANNER (8 Cols) + PROGRESS RING CARD (4 Cols)
              ================================================================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* Hero Welcome Banner — Greets Logged-In User by Their Dynamic Name (No Stock Girl Photo) */}
            <div className="xl:col-span-8 relative overflow-hidden rounded-2xl border border-rose-400/25 bg-gradient-to-r from-[#220a14] via-[#481429] to-[#2e0c1b] text-white p-6 sm:p-7 flex flex-col justify-between min-h-[215px] shadow-lg">
              {/* Ambient Rose-Gold Geometric Mesh & Wave Lines */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 800 300"
                fill="none"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
              >
                <path
                  d="M-50 220 C 180 90, 420 290, 850 80"
                  stroke="url(#heroWaveGrad)"
                  strokeWidth="2"
                />
                <path
                  d="M-20 260 C 240 140, 490 310, 860 130"
                  stroke="url(#heroWaveGrad)"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                />
                <circle cx="480" cy="75" r="70" stroke="url(#heroWaveGrad)" strokeWidth="1" strokeDasharray="3 5" />
                <circle cx="480" cy="75" r="110" stroke="url(#heroWaveGrad)" strokeWidth="0.75" />
                <defs>
                  <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="800" y2="300">
                    <stop offset="0%" stopColor="#F8BBD0" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#F06292" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#FCE4EC" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-6 h-full">
                {/* Left Greeting & High-Impact CTA Buttons */}
                <div className="space-y-4 max-w-xl flex-1 min-w-0">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-200">
                      <Sparkles className="h-3 w-3 text-[#ff4d79]" aria-hidden="true" />
                      <span>
                        {isClient ? 'Client Executive Workspace' : 'Verified Specialist Workspace'}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-white flex items-center gap-3 pt-1 drop-shadow-sm">
                      <span>Welcome back, {firstName}</span>
                      <span role="img" aria-label="waving hand" className="text-2xl sm:text-3xl animate-bounce-slow">
                        👋
                      </span>
                    </h1>

                    <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium max-w-lg">
                      {isClient
                        ? 'Review incoming specialist proposals, manage milestone escrow, and commission new briefs.'
                        : 'Inspect explainable 5-factor match scores, submit milestone bids, and track active contracts.'}
                    </p>
                  </div>

                  {/* Clean, Non-Wrapping Unified Button Action Row */}
                  <div className="pt-1.5 flex flex-wrap items-center gap-3">
                    {isClient ? (
                      <>
                        <Link
                          to="/projects/new"
                          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-[#260b16] shadow-md shadow-black/20 hover:bg-rose-50 active:scale-95 transition-all"
                        >
                          <span>Post a New Brief</span>
                          <ArrowRight className="h-4 w-4 text-[#ff3366]" aria-hidden="true" />
                        </Link>
                        <Link
                          to="/freelancers"
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300/35 bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md active:scale-95 transition-all shadow-xs"
                        >
                          <Users className="h-4 w-4 text-rose-300" />
                          <span>Find Specialists</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveNav('portfolio')}
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-100 hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-xs"
                          title="Open your showcase portfolio"
                        >
                          <Layers className="h-3.5 w-3.5 text-[#ff4d79]" />
                          <span>My Portfolio</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/projects"
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff3366] to-[#ff6699] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-950/40 hover:brightness-110 active:scale-95 transition-all"
                        >
                          <span>Browse Open Briefs</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveNav('portfolio')}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-black/40 hover:bg-black/60 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <Layers className="h-3.5 w-3.5 text-[#ff4d79]" />
                          <span>View My Portfolio</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Interactive Identity & Telemetry Card with Real Selected Avatar */}
                <div
                  onClick={() => setEditProfileOpen(true)}
                  title="Click to edit name & profile"
                  className="hidden sm:flex flex-col justify-between rounded-2xl border border-rose-300/25 bg-black/45 hover:bg-black/60 backdrop-blur-xl p-4.5 w-72 shrink-0 space-y-3.5 shadow-xl transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/40 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Real Circular Avatar with Rose Ring */}
                      {user.avatarUrl ? (
                        <div className="relative w-11 h-11 shrink-0 rounded-full border-2 border-[#ff4d79] ring-2 ring-white/10 shadow-md overflow-hidden bg-[#1f0a17]">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff3366] to-[#ff6699] text-xs font-black text-white shadow-md">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-200 transition-colors">
                            {user.name}
                          </p>
                          <Edit3 className="w-3 h-3 text-rose-300/60 group-hover:text-rose-300 shrink-0 transition-colors" />
                        </div>
                        <p className="text-[11px] text-rose-200/80 truncate font-medium">
                          {user.title || (isClient ? 'Client Partner' : 'Independent Specialist')}
                        </p>
                      </div>
                    </div>

                    {/* Online Pulse Status Indicator */}
                    <span className="relative flex h-2.5 w-2.5 shrink-0" title="Online">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs"></span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
                    <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 hover:bg-white/[0.1] transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200/70">
                        {isClient ? 'Open Briefs' : 'Hourly Rate'}
                      </p>
                      <p className="type-numeric text-base font-black text-white mt-0.5">
                        {isClient ? openProjectsCount : `$${user.hourlyRate || 110}/hr`}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 hover:bg-white/[0.1] transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200/70">
                        {isClient ? 'Contracts' : 'Skills'}
                      </p>
                      <p className="type-numeric text-base font-black text-rose-200 mt-0.5">
                        {isClient ? contracts.length : `${user.skills?.length || 0} Verified`}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-rose-100/85 flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3 h-3 text-[#ff4d79]" />
                      <span>Match Engine</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-bold text-[10px] text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Progress Ring Card (Profile Completion for Freelancer / Active Projects for Client) */}
            <div className="xl:col-span-4 veloura-surface p-5 sm:p-6 flex flex-col justify-between gap-4">
              {isClient ? (
                <>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Active Projects
                  </h2>
                  <div className="flex items-center justify-around gap-4 py-1">
                    <div className="veloura-ring-wrapper">
                      <progress
                        value={75}
                        max={100}
                        aria-label="Active projects breakdown"
                        className="veloura-progress-ring"
                        style={{ '--value': 75 } as React.CSSProperties}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="type-numeric text-3xl font-bold text-[var(--text-primary)]">
                          {projects.length}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs sm:text-sm">
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#c2185b]" />
                        <span>
                          <strong className="text-[var(--text-primary)]">
                            {inProgressProjectsCount}
                          </strong>{' '}
                          In Progress
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f06292]" />
                        <span>
                          <strong className="text-[var(--text-primary)]">
                            {openProjectsCount}
                          </strong>{' '}
                          Open
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f8bbd0]" />
                        <span>
                          <strong className="text-[var(--text-primary)]">
                            {completedProjectsCount}
                          </strong>{' '}
                          Completed
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-muted)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
                        <span>0 Drafts</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/projects"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/70 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] transition-colors"
                  >
                    <span>Manage Projects</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Profile Completion
                  </h2>
                  <div className="flex items-center justify-around gap-4 py-1">
                    <div className="veloura-ring-wrapper">
                      <progress
                        value={profileCompletionPct}
                        max={100}
                        aria-label={`Profile completion ${profileCompletionPct} percent`}
                        className="veloura-progress-ring"
                        style={{ '--value': profileCompletionPct } as React.CSSProperties}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="type-numeric text-xl font-bold text-[var(--text-primary)]">
                          {profileCompletionPct}%
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <CheckCircle2
                          className="h-4 w-4 text-rose-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Basic Information</span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        {hasSkills ? (
                          <CheckCircle2
                            className="h-4 w-4 text-rose-400 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>Add Skills ({user.skills?.length || 0})</span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-400 bg-rose-400/30 shrink-0" />
                        <span>Portfolio ({Math.min(portfolioCount, 3)}/3)</span>
                      </li>
                      <li className="flex items-center gap-2 text-[var(--text-muted)]">
                        {isVerified ? (
                          <CheckCircle2
                            className="h-4 w-4 text-rose-400 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>Verification</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/70 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] transition-colors cursor-pointer"
                  >
                    <span>Complete Profile</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* =================================================================
              ROW 2: 4 KPI STAT CARDS WITH MINI SPARKLINES & TREND BADGES
          ================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {(isClient
              ? [
                  {
                    label: 'Total Projects',
                    value: String(projects.length || 12),
                    trend: '↑ 40%',
                    Icon: Briefcase,
                    bars: SPARKLINE_BARS_1,
                  },
                  {
                    label: 'Open Projects',
                    value: String(openProjectsCount || 3),
                    trend: '',
                    Icon: FileText,
                    bars: SPARKLINE_BARS_2,
                  },
                  {
                    label: 'Total Proposals',
                    value: String(proposals.length || 48),
                    trend: '↑ 25%',
                    Icon: Users,
                    bars: SPARKLINE_BARS_3,
                  },
                  {
                    label: 'Active Contracts',
                    value: String(contracts.length || 5),
                    trend: '↑ 67%',
                    Icon: FileCheck,
                    bars: SPARKLINE_BARS_4,
                  },
                ]
              : [
                  {
                    label: 'Proposals',
                    value: String(proposals.length || 12),
                    trend: '↑ 20%',
                    Icon: FileText,
                    bars: SPARKLINE_BARS_1,
                  },
                  {
                    label: 'Active Contracts',
                    value: String(contracts.length || 3),
                    trend: '↑ 50%',
                    Icon: Briefcase,
                    bars: SPARKLINE_BARS_2,
                  },
                  {
                    label: 'Total Earnings',
                    value: `$${displayedEarnings.toLocaleString()}`,
                    trend: '↑ 28%',
                    Icon: DollarSign,
                    bars: SPARKLINE_BARS_3,
                  },
                  {
                    label: 'Profile Views',
                    value: '1.2K',
                    trend: '↑ 35%',
                    Icon: Users,
                    bars: SPARKLINE_BARS_4,
                  },
                ]
            ).map((kpi) => {
              const Icon = kpi.Icon;
              return (
                <div
                  key={kpi.label}
                  className="veloura-surface p-4 sm:p-5 flex items-center justify-between gap-2"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/12 text-[var(--brand-rose)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {kpi.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="type-numeric text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                        {kpi.value}
                      </span>
                      {kpi.trend && (
                        <span className="text-[11px] font-semibold text-emerald-500">
                          {kpi.trend}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <MiniSparkline bars={kpi.bars} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* =================================================================
              ROW 3: 3-COLUMN BENTO GRID (FREELANCER OR CLIENT)
          ================================================================= */}
          {!isClient ? (
            /* ---------------- FREELANCER 3-COLUMN BENTO GRID ---------------- */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Col 1 (5 cols): Recommended Projects */}
              <div className="lg:col-span-5 veloura-surface p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                      Recommended Projects
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Based on your skills and activity
                    </p>
                  </div>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline shrink-0"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {filteredRecommendedProjects.slice(0, 3).map((proj) => (
                    <div
                      key={proj._id}
                      className="veloura-elevated p-4 space-y-3 hover:border-rose-400/45 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                          <Briefcase className="h-3 w-3 text-[var(--brand-rose)]" aria-hidden="true" />
                          <span>{proj.category}</span>
                        </span>
                        {proj.matchBreakdown && (
                          <span className="type-numeric inline-flex items-center gap-1 rounded-full bg-rose-500/12 border border-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-[var(--brand-rose)]">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            <span>{proj.matchBreakdown.totalScore}% Match</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="block text-sm font-bold text-[var(--text-primary)] hover:text-[var(--brand-rose)] transition-colors"
                        >
                          {proj.title}
                        </Link>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                          {proj.summary}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {proj.requiredSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] border border-[var(--border-subtle)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <div>
                          <p className="type-numeric text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                            ${proj.budgetMin.toLocaleString()} – ${proj.budgetMax.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[var(--brand-rose)]" aria-hidden="true" />
                            <span>
                              {proj.deadlineDays}d ({Math.max(1, Math.round(proj.deadlineDays / 7))}w) ·{' '}
                              <span className="capitalize">{proj.experienceLevel}</span>
                            </span>
                          </p>
                        </div>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#f48fb1] to-[#ec407a] px-3 py-1.5 text-xs font-semibold text-[#1e0a12] hover:opacity-95 transition-opacity"
                        >
                          <span>Inspect Brief</span>
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 2 (4 cols): Recent Proposals */}
              <div className="lg:col-span-4 veloura-surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Recent Proposals
                  </h2>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {filteredProposals.length === 0 ? (
                  <div className="veloura-elevated p-5 text-center space-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">
                      You haven&apos;t submitted any proposals yet.
                    </p>
                    <Link
                      to="/projects"
                      className="inline-block rounded-lg bg-[var(--brand-rose)] px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Browse Open Projects
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProposals.slice(0, 4).map((prop, idx) => {
                      const proj = prop.projectId as ProjectItem;
                      const statusLabel =
                        prop.status === 'accepted'
                          ? 'Accepted'
                          : prop.status === 'rejected'
                          ? 'Rejected'
                          : 'Under Review';
                      const statusStyles =
                        prop.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : prop.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30';
                      const timeAgo = ['2 hours ago', '1 day ago', '3 days ago', '4 days ago'][
                        idx % 4
                      ];

                      return (
                        <div
                          key={prop._id}
                          onClick={() => setReviewProposalModal(prop)}
                          className="veloura-elevated p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-rose-400/40 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-[var(--brand-rose)] border border-rose-500/20">
                              <FileText className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                                {proj?.title || 'Project Proposal'}
                              </p>
                              <p className="type-numeric text-xs text-[var(--text-muted)] mt-0.5">
                                ${prop.bidAmount.toLocaleString()} ·{' '}
                                {Math.max(1, Math.round(prop.estimatedDays / 7))} weeks
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusStyles}`}
                            >
                              {statusLabel}
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)]">{timeAgo}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Col 3 (3 cols): Stacked Earnings Overview + Top Skills (Reflects User's Own Skills!) */}
              <div className="lg:col-span-3 space-y-5">
                {/* Earnings Overview Card */}
                <div className="veloura-surface p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                      Earnings Overview
                    </h2>
                    <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                      Last 6 months ⌄
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="type-numeric text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                      ${displayedEarnings.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-500 inline-flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      +28%{' '}
                      <span className="text-[var(--text-muted)] font-normal">from last month</span>
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4 px-1 border-b border-[var(--border-subtle)]">
                      {earningsMonths.map((m) => (
                        <div
                          key={m.month}
                          className="flex flex-col items-center justify-end h-full group"
                        >
                          <div
                            title={`${m.month}: ${m.amount}`}
                            style={{ height: `${m.height}%` }}
                            className="w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-[#880e4f] via-[#ec407a] to-[#f8bbd0] shadow-xs group-hover:opacity-90 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-2 pt-1.5 text-center text-[10px] text-[var(--text-muted)]">
                      {earningsMonths.map((m) => (
                        <span key={m.month}>{m.month}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Skills Card (Dynamically bound to user.skills!) */}
                <div className="veloura-surface p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                        Top Skills
                      </h2>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Most viewed by clients
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditProfileOpen(true)}
                      className="text-[11px] font-semibold text-[var(--brand-rose)] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {dynamicTopSkills.map((sk) => (
                      <div
                        key={sk.name}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-[105px]">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white bg-gradient-to-br ${sk.color}`}
                          >
                            {sk.badge}
                          </span>
                          <span className="font-medium text-[var(--text-primary)] truncate">
                            {sk.name}
                          </span>
                        </div>

                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div
                            style={{ width: `${sk.pct}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-300"
                          />
                        </div>

                        <span className="type-numeric text-[11px] font-semibold text-[var(--text-secondary)] w-7 text-right">
                          {sk.views}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ---------------- CLIENT 3-COLUMN BENTO GRID ---------------- */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Col 1 (5 cols): Recent Proposals */}
              <div className="lg:col-span-5 veloura-surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Recent Proposals
                  </h2>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {filteredProposals.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4">
                    No proposals received yet across your briefs.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {filteredProposals.slice(0, 3).map((prop, idx) => {
                      const proj = prop.projectId as ProjectItem;
                      const applicantName = prop.freelancer?.name || 'Verified Specialist';
                      const initials = applicantName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      const timeAgo = ['2 hours ago', '1 day ago', '2 days ago'][idx % 3];

                      return (
                        <div
                          key={prop._id}
                          className="veloura-elevated p-3.5 flex items-center justify-between gap-3 hover:border-rose-400/40 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 text-xs font-bold text-white shadow-2xs">
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                                {proj?.title || 'Project Proposal'}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] truncate">
                                {applicantName} · {timeAgo}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="type-numeric text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                ${prop.bidAmount.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {Math.max(1, Math.round(prop.estimatedDays / 7))} weeks
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setReviewProposalModal(prop)}
                              className="rounded-lg bg-gradient-to-r from-[#f8bbd0] to-[#f48fb1] px-3.5 py-1.5 text-xs font-semibold text-[#2b0c18] hover:opacity-95 cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Col 2 (4 cols): Your Projects */}
              <div className="lg:col-span-4 veloura-surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Your Projects
                  </h2>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {projects.slice(0, 4).map((proj, idx) => {
                    const badgeLabel =
                      proj.status === 'open'
                        ? 'Open'
                        : proj.status === 'in_progress'
                        ? 'In Progress'
                        : 'Completed';
                    const badgeStyle =
                      proj.status === 'open'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : proj.status === 'in_progress'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                        : 'bg-teal-500/15 text-teal-600 dark:text-teal-300';
                    const relative = ['3 days ago', '1 week ago', '2 weeks ago', '3 weeks ago'][
                      idx % 4
                    ];

                    return (
                      <Link
                        key={proj._id}
                        to={`/projects/${proj._id}`}
                        className="veloura-elevated p-3.5 flex items-center justify-between gap-3 hover:border-rose-400/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-[var(--brand-rose)] border border-rose-500/20">
                            <Briefcase className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                              {proj.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              ${proj.budgetMin.toLocaleString()}–${proj.budgetMax.toLocaleString()} ·{' '}
                              {proj.proposalCount} proposals · {relative}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold ${badgeStyle}`}
                        >
                          {badgeLabel}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Col 3 (3 cols): Recent Activity */}
              <div className="lg:col-span-3 veloura-surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Recent Activity
                  </h2>
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {(notifications.length > 0
                    ? notifications.slice(0, 4).map((n, i) => ({
                        title: n.title,
                        sub: n.body,
                        time: ['2 hours ago', '1 day ago', '2 days ago', '3 days ago'][i % 4],
                        tone:
                          i % 2 === 0
                            ? 'bg-rose-500/15 text-rose-500'
                            : 'bg-emerald-500/15 text-emerald-500',
                      }))
                    : [
                        {
                          title: 'Workspace initialized',
                          sub: `Signed in as ${user.name}`,
                          time: 'Just now',
                          tone: 'bg-rose-500/15 text-rose-500',
                        },
                      ]
                  ).map((act, i) => (
                    <div key={i} className="flex items-start justify-between gap-2.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${act.tone}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{act.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                            {act.sub}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {act.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              ROW 4: INTERACTIVE CONTRACTS & TRUST MODERATION STRIP
          ================================================================= */}
          <div className="veloura-surface p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Active Milestone Contracts &amp; Deliverable Handoffs ({contracts.length})
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Protected by atomic MongoDB state transitions — submit deliverables or release
                  milestone escrow below
                </p>
              </div>
              <Link
                to="/projects"
                className="text-xs font-semibold text-[var(--brand-rose)] hover:underline"
              >
                Explore All Marketplace Briefs →
              </Link>
            </div>

            {contracts.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-2">
                No active contracts for {user.name} yet. Submit or accept a proposal on an open
                project brief to start a contract.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contracts.map((contract) => {
                  const proj = contract.projectId as unknown as ProjectItem;
                  const isAssignedFreelancer =
                    String(contract.freelancer?._id || contract.freelancer) === String(user._id);
                  const isContractClient =
                    user.role === 'admin' ||
                    String(contract.client?._id || contract.client) === String(user._id);

                  return (
                    <div
                      key={contract._id}
                      className="veloura-elevated p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase text-[var(--brand-rose)]">
                            {contract.status}
                          </span>
                          <span className="type-numeric text-base font-bold text-[var(--text-primary)]">
                            ${contract.agreedAmount.toLocaleString()}
                          </span>
                        </div>
                        <Link
                          to={`/projects/${proj?._id}`}
                          className="block text-sm font-bold text-[var(--text-primary)] hover:text-[var(--brand-rose)]"
                        >
                          {proj?.title || 'Active Sprint Contract'}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)]">
                          Client: {contract.client?.name} · Specialist: {contract.freelancer?.name}
                        </p>
                        {contract.deliverableSummary && (
                          <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                            <strong>Submitted Deliverable:</strong> {contract.deliverableSummary}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <Link
                          to={`/projects/${proj?._id}`}
                          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Open Thread →
                        </Link>

                        {isAssignedFreelancer && contract.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setSubmitModalContract(contract)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-rose)] px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Submit Deliverables</span>
                          </button>
                        )}

                        {isContractClient && contract.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => setCompleteModalContract(contract)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                          >
                            <Award className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Approve &amp; Release Escrow</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trust & Moderation Queue if Admin */}
          {user.role === 'admin' && reports.length > 0 && (
            <div className="veloura-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[var(--brand-rose)]" aria-hidden="true" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Trust &amp; Safety Moderation Queue
                </h2>
              </div>
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep._id}
                    className="veloura-elevated p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {rep.targetTitle} ({rep.status.toUpperCase()})
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{rep.details}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleModerationUpdate(rep._id, 'resolved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerationUpdate(rep._id, 'dismissed')}
                        className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-500 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION BAR WITH ELEVATED ROSE '+' FAB
      ===================================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-4 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => setActiveNav('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeNav === 'dashboard' ? 'text-[var(--brand-rose)]' : 'text-[var(--text-muted)]'
          }`}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav(isClient ? 'my-projects' : 'browse')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeNav === 'my-projects' || activeNav === 'browse'
              ? 'text-[var(--brand-rose)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <span>Projects</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav(isClient ? 'post' : 'portfolio')}
          aria-label={isClient ? 'Post a Project' : 'Portfolio Showcase'}
          className="-mt-6 inline-flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#ad1457] via-[#ec407a] to-[#f8bbd0] text-white shadow-lg ring-4 ring-[var(--bg-canvas)] cursor-pointer"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('messages')}
          className={`relative flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeNav === 'messages' ? 'text-[var(--brand-rose)]' : 'text-[var(--text-muted)]'
          }`}
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          <span>Messages</span>
          {unreadNotifCount > 0 && (
            <span className="type-numeric absolute -top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {unreadNotifCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('settings')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeNav === 'settings' ? 'text-[var(--brand-rose)]' : 'text-[var(--text-muted)]'
          }`}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </nav>

      {/* =====================================================================
          UPDATE PROFILE & USER NAME MODAL (Saves directly to Local MongoDB)
      ===================================================================== */}
      {editProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Update Your Profile & Name"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-lg w-full max-h-[90svh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <p className="type-eyebrow text-[var(--brand-rose)]">Profile Settings</p>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Update Your Name &amp; Workspace Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--brand-rose)] focus:outline-none"
                  />
                </div>

                {user.role !== 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      Dashboard Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as 'freelancer' | 'client')}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      <option value="freelancer">Freelancer Workspace</option>
                      <option value="client">Client Workspace</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Architect"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Hourly Rate ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editHourlyRate}
                    onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                    className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2 text-sm font-bold text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Skills (Comma-Separated — Updates Top Skills &amp; Match Score)
                </label>
                <input
                  type="text"
                  value={editSkillsText}
                  onChange={(e) => setEditSkillsText(e.target.value)}
                  placeholder="React, UI/UX Design, Next.js, TypeScript, Figma"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <Link
                  to="/onboarding"
                  onClick={() => setEditProfileOpen(false)}
                  className="text-xs font-semibold text-[var(--brand-rose)] hover:underline"
                >
                  Open Full Portfolio Case Study Editor →
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-full bg-[var(--brand-rose)] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE MODALS (Proposal Review, Deliverable Submit, Escrow Release)
      ===================================================================== */}
      {reviewProposalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review Proposal & Explainable Match Telemetry"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-xl w-full max-h-[88svh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <p className="type-eyebrow text-[var(--brand-rose)]">Proposal Inspection</p>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {(reviewProposalModal.projectId as ProjectItem)?.title || 'Project Proposal'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Applicant: {reviewProposalModal.freelancer?.name || user.name} · $
                  {reviewProposalModal.bidAmount.toLocaleString()} ·{' '}
                  {reviewProposalModal.estimatedDays} days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewProposalModal(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {reviewProposalModal.coverLetter}
            </p>

            {reviewProposalModal.matchSnapshot && (
              <ExplainableMatchCard
                match={reviewProposalModal.matchSnapshot}
                compact={false}
                title="5-Factor Explainable Match Snapshot"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <Link
                to={`/projects/${
                  (reviewProposalModal.projectId as ProjectItem)?._id ||
                  reviewProposalModal.projectId
                }`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
              >
                <span>Open Full Project Brief</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>

              {isClient && reviewProposalModal.status !== 'accepted' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProposalDecision(reviewProposalModal._id, 'shortlisted')}
                    className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProposalDecision(reviewProposalModal._id, 'rejected')}
                    className="rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-semibold text-rose-500 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProposalDecision(reviewProposalModal._id, 'accepted')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Accept &amp; Activate Contract</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {submitModalContract && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submit Contract Deliverables"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Submit Sprint Deliverables
              </h3>
              <button
                type="button"
                onClick={() => setSubmitModalContract(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleDeliverableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Release Summary &amp; Verification Notes
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={deliverableSummary}
                  onChange={(e) => setDeliverableSummary(e.target.value)}
                  placeholder="Summarize completed milestones, test coverage, and deployment verification..."
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Repository / Deployment URL
                </label>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://github.com/veloura/release-candidate"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalContract(null)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--brand-rose)] px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Submit Deliverables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completeModalContract && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Approve Contract and Leave Verified Review"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Approve Deliverables &amp; Release Escrow
              </h3>
              <button
                type="button"
                onClick={() => setCompleteModalContract(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleContractComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Specialist Rating (1–5 Stars)
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value={5}>5 ★ — Exceptional Principal Execution</option>
                  <option value={4}>4 ★ — Strong Execution</option>
                  <option value={3}>3 ★ — Satisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Verified Public Review
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalContract(null)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Confirm Completion &amp; Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

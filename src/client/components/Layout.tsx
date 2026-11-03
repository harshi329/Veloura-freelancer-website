import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  PlusCircle,
  User,
  LogOut,
  ShieldCheck,
  Briefcase,
  Users,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  ChevronDown,
  Bookmark,
  ArrowLeftRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { ThemeSelector } from './ThemeSelector.js';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    notifications,
    toasts,
    dismissToast,
    markAllNotificationsRead,
    logout,
    switchRole,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setAccountMenuOpen(false);
    setSearchPopoverOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setNotifOpen(false);
        setAccountMenuOpen(false);
        setSearchPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = navSearch.trim();
    if (trimmed) {
      navigate(`/freelancers?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/freelancers');
    }
    setMobileMenuOpen(false);
    setSearchPopoverOpen(false);
  };

  const navItems = [
    { to: '/projects', label: 'Explore Briefs', Icon: Briefcase },
    { to: '/freelancers', label: 'Curated Talent', Icon: Users },
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ];

  const isStandalonePortal =
    location.pathname.startsWith('/dashboard') ||
    location.pathname === '/auth' ||
    location.pathname.startsWith('/auth/') ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname === '/';

  if (isStandalonePortal) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        {children}
        {/* Toast Notifications Stack */}
        <div
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto veloura-surface p-3.5 flex items-start justify-between gap-3 border-l-4 border-l-[var(--brand-rose)] animate-reveal"
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                {t.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : t.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" aria-hidden="true" />
                ) : (
                  <Info className="h-4 w-4 text-[var(--brand-rose)] shrink-0" aria-hidden="true" />
                )}
                <span>{t.title}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Sticky Navigation Header — Collision-Free 3-Zone Flex Architecture */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/92 backdrop-blur-md">
        <div className="veloura-container flex h-16 items-center justify-between gap-3">
          {/* Zone 1: Brand Logo + Primary Navigation Links (Never Clipped or Overlapped) */}
          <div className="flex items-center gap-4 xl:gap-6 shrink-0">
            <Link to="/" aria-label="Veloura Homepage" className="focus:outline-none shrink-0 whitespace-nowrap">
              <BrandLogo size="sm" subtitle="TALENT MEETS OPPORTUNITY" />
            </Link>

            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-1 shrink-0">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold border border-[var(--border-subtle)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/60'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Zone 2: Right Utilities — Search + Theme Selector + Notifications + Account Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Inline Search Input on xl+ screens */}
            <form
              onSubmit={handleNavSearchSubmit}
              role="search"
              className="hidden xl:flex items-center relative w-44 2xl:w-56 shrink-0"
            >
              <Search
                className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search specialists, skills & portfolios..."
                aria-label="Search specialists, skills & portfolios"
                className="w-full rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-rose)] focus:outline-none transition-colors"
              />
            </form>

            {/* Compact Search Popover Trigger on md/lg screens (<1280px) */}
            <div className="relative hidden sm:block xl:hidden">
              <button
                type="button"
                onClick={() => {
                  setSearchPopoverOpen((v) => !v);
                  setNotifOpen(false);
                  setAccountMenuOpen(false);
                }}
                aria-label="Search specialists, skills & portfolios"
                title="Search specialists, skills & portfolios"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {searchPopoverOpen && (
                <form
                  onSubmit={handleNavSearchSubmit}
                  role="search"
                  className="veloura-surface absolute right-0 mt-2 w-72 p-2.5 z-50 flex items-center gap-2"
                >
                  <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0 ml-1" aria-hidden="true" />
                  <input
                    type="search"
                    autoFocus
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Search specialists, skills & portfolios..."
                    aria-label="Search specialists, skills & portfolios"
                    className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </form>
              )}
            </div>

            {/* Light / Dark / System Theme Selector */}
            <ThemeSelector />

            {user && (
              <button
                type="button"
                onClick={async () => {
                  const nextRole = user.role === 'client' ? 'freelancer' : 'client';
                  await switchRole(nextRole);
                }}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-[var(--brand-rose)] transition-all cursor-pointer shadow-2xs group"
                title={`Switch role to ${user.role === 'client' ? 'Freelancer' : 'Client'}`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-rose-500 transition-transform group-hover:rotate-180 duration-300" />
                <span>Switch to {user.role === 'client' ? 'Specialist' : 'Client'}</span>
              </button>
            )}

            {user ? (
              <>
                {(user.role === 'client' || user.role === 'admin') && (
                  <Link
                    to="/projects/new"
                    className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-rose)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-opacity shrink-0"
                  >
                    <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Post Brief</span>
                  </Link>
                )}

                {/* Notifications Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setAccountMenuOpen(false);
                      setSearchPopoverOpen(false);
                    }}
                    aria-label="Notifications"
                    aria-expanded={notifOpen}
                    className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="type-numeric absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-rose)] px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="veloura-surface absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] p-3.5 z-50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Activity Feed ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-xs font-medium text-[var(--brand-rose)] hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                          No notifications yet.
                        </p>
                      ) : (
                        <div className="max-h-72 overflow-y-auto space-y-2">
                          {notifications.slice(0, 8).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                setNotifOpen(false);
                                if (n.link) navigate(n.link);
                              }}
                              className={`rounded-lg p-2.5 text-xs cursor-pointer transition-colors ${
                                n.read
                                  ? 'bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)]'
                                  : 'bg-rose-500/10 border border-rose-500/20 text-[var(--text-primary)]'
                              }`}
                            >
                              <p className="font-semibold">{n.title}</p>
                              <p className="mt-0.5 text-[var(--text-muted)] line-clamp-2">
                                {n.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Authenticated User Profile, Role & Account Menu Dropdown */}
                <div className="relative hidden md:block shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen((v) => !v);
                      setNotifOpen(false);
                      setSearchPopoverOpen(false);
                    }}
                    aria-expanded={accountMenuOpen}
                    aria-label="Account menu"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-1.5 pr-2.5 py-1 text-xs font-medium hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-rose-500/40"
                      />
                    ) : (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-[11px] font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[130px] xl:max-w-[170px] truncate text-[var(--text-primary)] font-semibold">
                      {user.name}
                    </span>
                    <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-rose)]">
                      {user.role}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                  </button>

                  {accountMenuOpen && (
                    <div className="veloura-surface absolute right-0 mt-2 w-60 p-2.5 z-50 space-y-1.5">
                      <div className="px-2.5 py-2 border-b border-[var(--border-subtle)]">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      >
                        <LayoutDashboard className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                        <span>Open My Workspace</span>
                      </Link>

                      {user.role === 'freelancer' ? (
                        <Link
                          to="/dashboard?tab=portfolio"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        >
                          <User className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                          <span>Profile &amp; Portfolio</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard?tab=settings"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        >
                          <User className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                          <span>Account Settings</span>
                        </Link>
                      )}

                      <Link
                        to="/projects?bookmarked=1"
                        className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Bookmark className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                          <span>Saved Briefs</span>
                        </span>
                        <span className="type-numeric rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-primary)]">
                          {user.savedProjects?.length || 0}
                        </span>
                      </Link>

                      <div className="pt-1 border-t border-[var(--border-subtle)] space-y-1">
                        <button
                          type="button"
                          onClick={async () => {
                            const nextRole = user.role === 'client' ? 'freelancer' : 'client';
                            await switchRole(nextRole);
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--brand-rose)] bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Switch to {user.role === 'client' ? 'Specialist' : 'Client'}</span>
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20">
                            {user.role}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link
                  to="/auth"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="rounded-full bg-[var(--brand-rose)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-opacity"
                >
                  Join Collective
                </Link>
              </div>
            )}

            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              id="mobile-drawer-trigger"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="veloura-mobile-drawer"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="veloura-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav
            tabIndex={-1}
            className="relative z-10 flex w-[min(22rem,85dvw)] h-[100svh] flex-col justify-between bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] p-5 overflow-y-auto"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <BrandLogo size="sm" subtitle="TALENT MEETS OPPORTUNITY" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close drawer"
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Mobile Search Input */}
              <form onSubmit={handleNavSearchSubmit} role="search" className="relative">
                <Search
                  className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search specialists, skills & portfolios..."
                  aria-label="Search specialists, skills & portfolios"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-rose)] focus:outline-none"
                />
              </form>

              {user && (
                <div className="space-y-2">
                  <div className="veloura-elevated p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-rose-500/30"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-[var(--brand-rose)] shrink-0">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nextRole = user.role === 'client' ? 'freelancer' : 'client';
                    await switchRole(nextRole);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--brand-rose)] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                    <span>Switch to {user.role === 'client' ? 'Specialist' : 'Client'} Mode</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20">
                    {user.role}
                  </span>
                </button>
                </div>
              )}

              <ul className="space-y-1.5">
                {navItems.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--brand-rose)] text-white font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
                {user && (user.role === 'client' || user.role === 'admin') && (
                  <li>
                    <NavLink
                      to="/projects/new"
                      className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-[var(--brand-rose)] bg-rose-500/10"
                    >
                      <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Publish New Brief</span>
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 type-btn text-rose-500 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/auth"
                    className="flex items-center justify-center rounded-xl border border-[var(--border-subtle)] py-2.5 type-btn text-[var(--text-primary)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="flex items-center justify-center rounded-xl bg-[var(--brand-rose)] py-2.5 type-btn text-white"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Toast Notifications Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto veloura-surface p-3.5 flex items-start justify-between gap-3 border-l-4 border-l-[var(--brand-rose)] animate-reveal"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[var(--text-primary)]">
              {t.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
              ) : t.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="h-4 w-4 text-[var(--brand-rose)] shrink-0" aria-hidden="true" />
              )}
              <span>{t.title}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Editorial Brand Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-16">
        <div className="veloura-container py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[var(--border-subtle)]">
            <div className="md:col-span-5 space-y-3">
              <BrandLogo size="md" subtitle="TALENT MEETS OPPORTUNITY" />
              <p className="type-support max-w-sm mt-2">
                An art-directed freelance marketplace connecting high-conviction engineering and
                product leaders with principal-grade independent specialists.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-muted)]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span>Enterprise Escrow Protection &amp; Explainable Talent Matching</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <p className="type-eyebrow text-[var(--text-muted)]">Navigation</p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>
                  <Link to="/projects" className="hover:text-[var(--text-primary)]">
                    Explore Open Briefs
                  </Link>
                </li>
                <li>
                  <Link to="/freelancers" className="hover:text-[var(--text-primary)]">
                    Curated Talent Roster
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-[var(--text-primary)]">
                    My Workspace Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/onboarding" className="hover:text-[var(--text-primary)]">
                    Profile &amp; Portfolio
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5">
              <p className="type-eyebrow text-[var(--text-muted)]">5-Factor Matching Model</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Every brief and proposal is evaluated across five deterministic dimensions: Skill
                Overlap (40pt), Rate Compatibility (20pt), Seniority &amp; Track Record (15pt),
                Portfolio Evidence (15pt), and Delivery Reliability (10pt).
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
            <p>© {new Date().getFullYear()} Veloura Marketplace Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Space Grotesk · Inter · DM Serif Display</span>
              <span>Light · Dark · System Theme Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

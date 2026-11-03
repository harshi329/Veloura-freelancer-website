import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  CheckCircle2,
  Layers,
  Cpu,
  Search,
  SlidersHorizontal,
  Compass,
  Handshake,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { ProjectItem, UserProfile, MatchBreakdown } from '../../shared/types.js';
import {
  SectionHeading,
  CardHeading,
  Eyebrow,
  BodyText,
  SupportText,
  DemoBadge,
} from '../components/Typography.js';
import { ExplainableMatchCard } from '../components/ExplainableMatchCard.js';
import { BriefCard } from '../components/BriefCard.js';

interface StatsResponse {
  metrics: {
    openProjects: number;
    completedProjects: number;
    verifiedFreelancers: number;
    activeContracts: number;
    totalVolumeUsd: number;
  };
  featuredFreelancers: UserProfile[];
  featuredProjects: (ProjectItem & { matchBreakdown?: MatchBreakdown })[];
}

const HOW_MATCHING_WORKS_STEPS = [
  {
    step: '01',
    title: 'Analyze',
    description: "Understand the project's requirements and the freelancer's skills.",
    detail: 'Normalizes stack synonyms, seniority tiers, and portfolio domain tags.',
    Icon: Search,
  },
  {
    step: '02',
    title: 'Match',
    description: 'Calculate compatibility using the existing five-factor model.',
    detail: 'Scores Skill (40), Budget (20), Seniority (15), Portfolio (15), and Bandwidth (10).',
    Icon: Cpu,
  },
  {
    step: '03',
    title: 'Explain',
    description: 'Show the score breakdown and missing requirements.',
    detail: 'Surfaces exact point contributions, matched stack pills, and skill gaps.',
    Icon: BarChart3,
  },
  {
    step: '04',
    title: 'Discover',
    description: 'Help users find relevant opportunities.',
    detail: 'Filter open briefs by domain, stack, seniority, or saved bookmarks.',
    Icon: Compass,
  },
  {
    step: '05',
    title: 'Collaborate',
    description: 'Support project work through clear deliverables and contracts.',
    detail: 'Atomic proposal acceptance, milestone tracking, and authorized project threads.',
    Icon: Handshake,
  },
];

export const HomePage: React.FC = () => {
  const { apiFetch, user } = useApp();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBriefIdx, setSelectedBriefIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiFetch<StatsResponse>('/api/stats')
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch, user]);

  const featuredProjects = data?.featuredProjects || [];
  const activeBrief = featuredProjects[selectedBriefIdx] || featuredProjects[0];

  return (
    <div className="space-y-0">
      {/* =====================================================================
          1. DRAMATIC TWO-COLUMN HERO SECTION WITH V-STAR MOTIF & MATCH ENGINE
      ===================================================================== */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] pt-4 pb-10 sm:pt-6 sm:pb-12 lg:pt-7 lg:pb-14">
        {/* Ambient Rose, Black-Cherry & Restrained Violet Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-12 h-72 w-72 rounded-full bg-rose-500/16 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-1/4 h-96 w-96 rounded-full bg-rose-500/14 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"
        />

        {/* Distinctive V-Star Visual Motif & Flowing Rose Curves SVG Background */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 600"
          fill="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
        >
          <defs>
            <linearGradient id="heroRibbonCurve" x1="0" y1="60" x2="1440" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8BBD0" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#F06292" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#AB47BC" stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="vMotifGrad" x1="640" y1="20" x2="900" y2="440" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F48FB1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#880E4F" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Flowing Rose Ribbon Waves across Top & Middle */}
          <path
            d="M-60 140 C 360 20, 820 260, 1500 60"
            stroke="url(#heroRibbonCurve)"
            strokeWidth="1.5"
          />
          <path
            d="M-80 430 C 320 210, 760 540, 1520 140"
            stroke="url(#heroRibbonCurve)"
            strokeWidth="2"
          />
          <path
            d="M-60 500 C 420 290, 860 580, 1500 220"
            stroke="url(#heroRibbonCurve)"
            strokeWidth="1.25"
            strokeDasharray="5 6"
          />
          {/* Subtle Architectural V-Star Emblem Watermark */}
          <path
            d="M650 40 L755 350 L865 30 L820 30 L755 235 L695 40 Z"
            fill="url(#vMotifGrad)"
          />
          {/* Twinkling 4-Point V-Star Accents */}
          <path
            d="M885 18L889 32L903 36L889 40L885 54L881 40L867 36L881 32L885 18Z"
            fill="#F48FB1"
            fillOpacity="0.7"
            className="animate-star-twinkle"
          />
          <circle cx="520" cy="80" r="2.5" fill="#F8BBD0" fillOpacity="0.6" />
          <circle cx="1060" cy="420" r="3" fill="#F06292" fillOpacity="0.5" />
        </svg>

        <div className="veloura-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column (7 Cols): Headline, Tagline, Copy, Actions, Stack Pills & Benefits */}
            <div className="lg:col-span-7 space-y-5 animate-reveal">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 backdrop-blur-xs px-3.5 py-1.5 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
                <span className="type-eyebrow text-[var(--text-primary)] !text-[11px] tracking-[0.2em]">
                  VELOURA · TALENT MEETS OPPORTUNITY
                </span>
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                  · 5-Factor Explainable Matching
                </span>
              </div>

              {/* Mandatory Hero Headline */}
              <h1 className="type-hero text-[var(--text-primary)]">
                Your next <span className="veloura-rose-gradient-text">great collaboration</span>{' '}
                starts here.
              </h1>

              {/* Mandatory Supporting Tagline in Editorial Serif */}
              <p className="type-editorial-serif text-xl sm:text-2xl text-[var(--text-secondary)] italic">
                Where architecture meets opportunity.
              </p>

              {/* Mandatory Supporting Copy */}
              <BodyText className="text-[var(--text-secondary)] max-w-xl">
                Veloura connects engineering and design leaders with principal-grade independent
                specialists. Every brief is evaluated through transparent skill telemetry,
                milestone-backed contracts, and verified delivery history.
              </BodyText>

              {/* Primary & Secondary Call-To-Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-rose)] px-6 py-3 type-btn text-white shadow-sm hover:opacity-95 transition-all"
                >
                  <span>Explore Open Briefs</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3 type-btn text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <span>Open My Workspace</span>
                </Link>
              </div>

              {/* Quick Skill & Domain Discovery Strip */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Explore High-Demand Capabilities
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    'React & Next.js',
                    'TypeScript',
                    'Design Systems',
                    'AI & LLM Engineering',
                    'Node.js & MongoDB',
                    'Brand & Editorial UI',
                  ].map((tag) => (
                    <Link
                      key={tag}
                      to={`/projects?q=${encodeURIComponent(tag.split(' ')[0])}`}
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--brand-rose)] hover:text-[var(--brand-rose)] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Platform Benefits & Live Database Counts */}
              <div className="pt-4 grid grid-cols-3 gap-3 sm:gap-4 border-t border-[var(--border-subtle)] max-w-xl">
                <div className="veloura-surface p-3 sm:p-3.5">
                  <p className="type-numeric text-base sm:text-lg font-bold text-[var(--brand-rose)]">
                    5-Factor
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Explainable Match Model</p>
                </div>
                <div className="veloura-surface p-3 sm:p-3.5">
                  <p className="type-numeric text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {data?.metrics.openProjects ?? 3} Open Briefs
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Accepting Proposals</p>
                </div>
                <div className="veloura-surface p-3 sm:p-3.5">
                  <p className="type-numeric text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    ${(data?.metrics.totalVolumeUsd ?? 8200).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Milestone Contract Volume</p>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Signature Five-Factor Matching Engine Card */}
            <div className="lg:col-span-5 animate-reveal-delay-1">
              <div className="relative veloura-glow-card overflow-hidden p-5 sm:p-6 space-y-4">
                {/* Top Rose-Violet Gradient Accent Bar */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500"
                />

                {/* Card Header: Live Matching Engine Label + Demo Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/12 text-[var(--brand-rose)]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <Eyebrow className="!text-[11px]">Live Matching Engine</Eyebrow>
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                        {user?.role === 'freelancer'
                          ? `Calibrated for ${user.name}`
                          : 'Five-Factor Compatibility Preview'}
                      </h2>
                    </div>
                  </div>
                  <DemoBadge show={activeBrief?.isDemo ?? true} />
                </div>

                {/* Interactive Brief Selector Tabs (Switch between real open briefs) */}
                {featuredProjects.length > 1 && (
                  <div
                    role="tablist"
                    aria-label="Select open project brief to preview match score"
                    className="flex items-center gap-1.5 overflow-x-auto pb-1"
                  >
                    {featuredProjects.slice(0, 3).map((proj, idx) => {
                      const isSelected = idx === selectedBriefIdx;
                      return (
                        <button
                          key={proj._id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setSelectedBriefIdx(idx)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--brand-rose)] text-white shadow-2xs'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Brief 0{idx + 1} · {proj.matchBreakdown?.totalScore ?? 90}%
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeBrief ? (
                  <div className="space-y-3.5">
                    {/* Project Title, Category, Budget & Delivery Timeline */}
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/85 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-rose)]">
                          {activeBrief.category}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {activeBrief.experienceLevel.toUpperCase()} TIER
                        </span>
                      </div>

                      <Link
                        to={`/projects/${activeBrief._id}`}
                        className="block text-sm sm:text-base font-bold text-[var(--text-primary)] hover:text-[var(--brand-rose)] transition-colors"
                      >
                        {activeBrief.title}
                      </Link>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-subtle)]">
                        <span className="type-numeric font-bold text-[var(--text-primary)]">
                          Budget: ${activeBrief.budgetMin.toLocaleString()} – $
                          {activeBrief.budgetMax.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
                          <span>Timeline: {activeBrief.deadlineDays} Days</span>
                        </span>
                      </div>
                    </div>

                    {/* Five-Factor Breakdown + Matched/Missing Skills + Expandable Explanation + Link */}
                    {activeBrief.matchBreakdown && (
                      <ExplainableMatchCard
                        match={activeBrief.matchBreakdown}
                        compact={true}
                        title="Five-Factor Score Breakdown"
                        projectLink={`/projects/${activeBrief._id}`}
                      />
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                    {loading
                      ? 'Calculating five-factor compatibility...'
                      : 'Explore open briefs to inspect live match scores.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. THREE-CARD FEATURE STRIP DIRECTLY BELOW THE HERO (Section 6)
      ===================================================================== */}
      <section className="py-10 sm:py-12 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/55">
        <div className="veloura-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="veloura-surface p-5 sm:p-6 flex items-start gap-4 hover:border-[var(--border-strong)] transition-colors">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-[var(--brand-rose)] border border-rose-500/20">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="type-card-heading">Explainable Matching</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Understand why a project matches a freelancer&apos;s skills and goals.
                </p>
              </div>
            </div>

            <div className="veloura-surface p-5 sm:p-6 flex items-start gap-4 hover:border-[var(--border-strong)] transition-colors">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-[var(--brand-rose)] border border-rose-500/20">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="type-card-heading">Verified Skill &amp; Rate Telemetry</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Show evidence-based skills, experience, and pricing information when available.
                </p>
              </div>
            </div>

            <div className="veloura-surface p-5 sm:p-6 flex items-start gap-4 hover:border-[var(--border-strong)] transition-colors">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-[var(--brand-rose)] border border-rose-500/20">
                <Layers className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="type-card-heading">Milestone-Based Contracts</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Make project expectations, deliverables, and collaboration stages clear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FEATURED OPPORTUNITIES SECTION (Section 7)
             Heading: "Open Briefs for Exceptional Talent"
      ===================================================================== */}
      <section className="py-14 sm:py-18 border-b border-[var(--border-subtle)]">
        <div className="veloura-container space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <Eyebrow>Featured Opportunities</Eyebrow>
              <SectionHeading>Open Briefs for Exceptional Talent</SectionHeading>
              <SupportText>
                Explore active client briefs with transparent budget bands, estimated durations,
                persistent bookmarks, and real-time five-factor match scores.
              </SupportText>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] hover:text-[var(--brand-rose)] transition-colors shrink-0"
            >
              <span>Explore All Briefs</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.slice(0, 3).map((project) => (
              <BriefCard key={project._id} project={project} featured />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. HOW MATCHING WORKS — FIVE-STEP TIMELINE SECTION (Section 8)
      ===================================================================== */}
      <section className="py-14 sm:py-18 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/45">
        <div className="veloura-container space-y-10">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>Transparent Architecture</Eyebrow>
            <SectionHeading>How Matching Works</SectionHeading>
            <SupportText>
              Veloura replaces opaque bidding wars with an explainable five-step workflow connecting
              project requirements directly to specialist capabilities.
            </SupportText>
          </div>

          {/* 5-Step Responsive Timeline Grid with Connecting Line */}
          <div className="relative">
            {/* Desktop Horizontal Connecting Line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-gradient-to-r from-rose-500/20 via-rose-500/50 to-violet-500/25"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 relative z-10">
              {HOW_MATCHING_WORKS_STEPS.map(({ step, title, description, detail, Icon }) => (
                <div
                  key={step}
                  className="veloura-surface p-5 flex flex-col justify-between gap-4 hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-500/15 border border-rose-400/30 text-[var(--brand-rose)] shadow-2xs">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="type-numeric rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-xs font-bold text-[var(--brand-rose)]">
                        Step {step}
                      </span>
                    </div>

                    <h3 className="type-card-heading">{title}</h3>
                    <p className="text-sm text-[var(--text-primary)] font-medium leading-snug">
                      {description}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)] leading-relaxed">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. CURATED TALENT ROSTER & EXECUTIVE CALLOUT
      ===================================================================== */}
      <section className="py-14 sm:py-18">
        <div className="veloura-container space-y-12">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <Eyebrow>Curated Talent</Eyebrow>
                <SectionHeading>Principal &amp; Senior Independent Specialists</SectionHeading>
                <SupportText>
                  Inspect specialist profiles with portfolio case studies, hourly rate calibration,
                  and availability telemetry.
                </SupportText>
              </div>
              <Link
                to="/freelancers"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] hover:text-[var(--brand-rose)] transition-colors shrink-0"
              >
                <span>Explore Curated Talent</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(data?.featuredFreelancers || []).slice(0, 4).map((talent) => {
                const topStudy = talent.portfolio?.[0];
                return (
                  <article
                    key={talent._id}
                    className="veloura-surface p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-[var(--border-strong)] transition-all"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 text-base font-bold text-white shadow-xs">
                            {talent.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardHeading>{talent.name}</CardHeading>
                              {talent.verified && (
                                <CheckCircle2
                                  className="h-4 w-4 text-emerald-500 shrink-0"
                                  aria-label="Verified profile"
                                />
                              )}
                              <DemoBadge show={talent.isDemo} />
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                              {talent.title}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="type-numeric text-base sm:text-lg font-bold text-[var(--text-primary)]">
                            ${talent.hourlyRate}/hr
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true" />
                            <span className="type-numeric">{talent.rating.toFixed(2)}</span>
                            <span className="text-[var(--text-muted)]">
                              ({talent.completedProjects})
                            </span>
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {talent.bio}
                      </p>

                      {topStudy && (
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--brand-rose)]">
                              Portfolio Evidence
                            </p>
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {topStudy.title}
                            </p>
                          </div>
                          {topStudy.metrics && (
                            <span className="shrink-0 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                              {topStudy.metrics}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {talent.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                        <span className="capitalize font-medium text-[var(--text-secondary)]">
                          {talent.availability}
                        </span>{' '}
                        · {talent.location}
                      </span>
                      <Link
                        to={`/freelancers?highlight=${talent._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--brand-rose)] hover:underline"
                      >
                        <span>Inspect Portfolio ({talent.portfolio?.length || 0})</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Executive Bottom Callout */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-400/25 bg-gradient-to-r from-[#240b15] via-[#4a152a] to-[#2e0d1b] p-7 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2 max-w-xl">
              <p className="type-eyebrow text-rose-300 !text-[11px] tracking-[0.2em]">
                VELOURA · TALENT MEETS OPPORTUNITY
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Ready to start your next great collaboration?
              </h2>
              <p className="text-sm text-rose-100/80">
                Explore open briefs with live five-factor compatibility scoring or open your
                workspace to manage proposals and contracts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#240b15] hover:bg-rose-50 transition-colors"
              >
                <span>Explore Open Briefs</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-rose-200/30 bg-black/30 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-black/50 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-rose-300" aria-hidden="true" />
                <span>Open My Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Briefcase,
  Award,
  Code2,
  FolderGit2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { UserProfile, ProjectItem, MatchBreakdown, PortfolioItem } from '../../shared/types.js';
import {
  PageTitle,
  SectionHeading,
  CardHeading,
  Eyebrow,
  SupportText,
  DemoBadge,
} from '../components/Typography.js';
import { ExplainableMatchCard } from '../components/ExplainableMatchCard.js';
import { HireSpecialistModal } from '../components/HireSpecialistModal.js';

interface ReviewRecord {
  _id: string;
  rating: number;
  comment: string;
  client?: { name: string; company?: string };
  projectId?: { title: string; category?: string };
  createdAt: string;
}

const ensureHttps = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

const POPULAR_REQUIREMENTS = [
  { label: 'All Specialties', query: '' },
  { label: 'Cybersecurity & Auditing', query: 'Cybersecurity' },
  { label: 'Full-Stack React & Node', query: 'React' },
  { label: 'AI & Machine Learning', query: 'Machine Learning' },
  { label: 'Quantum Computing (Qiskit)', query: 'Quantum' },
  { label: 'WhatsApp & Bots', query: 'WhatsApp' },
  { label: 'TypeScript / APIs', query: 'TypeScript' },
];

export const FreelancersPage: React.FC = () => {
  const { user, apiFetch, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight') || searchParams.get('id');
  const urlQuery = searchParams.get('q') || '';

  const [freelancers, setFreelancers] = useState<
    (UserProfile & { matchBreakdown?: MatchBreakdown })[]
  >([]);
  const [openProjects, setOpenProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [q, setQ] = useState(urlQuery);
  const [availability, setAvailability] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  // Selected Freelancer Modal & Direct Hiring
  const [activeFreelancer, setActiveFreelancer] = useState<UserProfile | null>(null);
  const [activeReviews, setActiveReviews] = useState<ReviewRecord[]>([]);
  const [hiringSpecialist, setHiringSpecialist] = useState<UserProfile | null>(null);

  const handleStartHire = (spec: UserProfile) => {
    if (!user) {
      showToast('Please sign in as a client to hire specialists.', 'info');
      navigate('/auth?mode=login');
      return;
    }
    if (user.role !== 'client' && user.role !== 'admin') {
      showToast('Only client accounts can hire talent. Please sign in with a client account.', 'error');
      return;
    }
    setHiringSpecialist(spec);
  };

  useEffect(() => {
    apiFetch<{ projects: ProjectItem[] }>('/api/projects?status=open')
      .then((res) => setOpenProjects(res.projects || []))
      .catch(() => {});
  }, [apiFetch]);

  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (availability !== 'all') params.set('availability', availability);
      if (experienceLevel !== 'all') params.set('experienceLevel', experienceLevel);
      if (selectedProjectId) params.set('projectId', selectedProjectId);

      const res = await apiFetch<{
        freelancers: (UserProfile & { matchBreakdown?: MatchBreakdown })[];
      }>(`/api/freelancers?${params.toString()}`);
      setFreelancers(res.freelancers || []);

      if (highlightId) {
        const found = (res.freelancers || []).find((f) => f._id === highlightId);
        if (found) {
          inspectFreelancer(found._id);
        }
      }
    } catch {
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, q, availability, experienceLevel, selectedProjectId, highlightId]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  const inspectFreelancer = async (id: string) => {
    try {
      const res = await apiFetch<{ freelancer: UserProfile; reviews: ReviewRecord[] }>(
        `/api/freelancers/${id}`
      );
      setActiveFreelancer(res.freelancer);
      setActiveReviews(res.reviews || []);
    } catch {}
  };

  const closeInspect = () => {
    setActiveFreelancer(null);
    if (highlightId) {
      searchParams.delete('highlight');
      setSearchParams(searchParams);
    }
  };

  const handleSelectPreset = (queryText: string) => {
    setQ(queryText);
    const newParams = new URLSearchParams(searchParams);
    if (queryText) {
      newParams.set('q', queryText);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="veloura-container py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-500 mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Requirements &amp; Portfolio Search Engine</span>
        </div>
        <PageTitle>Verified Talent Accounts &amp; Work Portfolios</PageTitle>
        <SupportText>
          Match client project requirements directly against specialist profiles, case studies, and verified GitHub Proof of Concept repositories.
        </SupportText>
      </div>

      {/* Search, Filters & Project Benchmark Selector */}
      <div className="veloura-surface p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search
              className="h-4 w-4 text-[var(--brand-rose)] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                const next = new URLSearchParams(searchParams);
                if (e.target.value.trim()) {
                  next.set('q', e.target.value.trim());
                } else {
                  next.delete('q');
                }
                setSearchParams(next);
              }}
              placeholder="Search by requirements, tech stack (e.g. React, Cybersecurity, Qiskit), or specialist name..."
              aria-label="Search specialists and portfolios"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              aria-label="Filter by availability"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm"
            >
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="part-time">Part-Time</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              aria-label="Filter by seniority"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm"
            >
              <option value="all">All Tiers</option>
              <option value="principal">Principal Tier</option>
              <option value="senior">Senior Tier</option>
              <option value="mid">Mid Tier</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Compute Explainable Match against an open brief"
              className="w-full rounded-xl border border-rose-500/40 bg-rose-500/5 px-3 py-2.5 text-sm font-medium text-[var(--text-primary)]"
            >
              <option value="">⚡ Benchmark Roster Against Brief...</option>
              {openProjects.map((p) => (
                <option key={p._id} value={p._id}>
                  Match vs: {p.title.slice(0, 36)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Popular Requirement Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mr-1">
            Requirements:
          </span>
          {POPULAR_REQUIREMENTS.map((preset) => {
            const active = q === preset.query;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset.query)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Freelancer Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="veloura-surface h-72 animate-pulse p-6" />
          ))}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="veloura-surface p-12 text-center space-y-3">
          <p className="text-base font-bold text-[var(--text-primary)]">No Specialists Found</p>
          <p className="text-xs text-[var(--text-muted)]">
            Try adjusting your search criteria or clearing filters.
          </p>
          <button
            type="button"
            onClick={() => handleSelectPreset('')}
            className="rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            Show All Specialists
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {freelancers.map((talent) => (
            <article
              key={talent._id}
              className="veloura-surface p-6 flex flex-col justify-between gap-5 hover:border-[var(--border-strong)] transition-all"
            >
              <div className="space-y-4">
                {talent.bannerUrl && (
                  <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden bg-[#160812] -mt-1 mb-2">
                    <img
                      src={talent.bannerUrl}
                      alt={`${talent.name} Cover`}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="text-[11px] font-extrabold text-white tracking-wide drop-shadow-md truncate">
                        {talent.title}
                      </span>
                      <span className="text-[9px] font-bold text-rose-200 uppercase tracking-wider bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                        Verified
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {talent.avatarUrl ? (
                      <img
                        src={talent.avatarUrl}
                        alt={talent.name}
                        className="h-13 w-13 shrink-0 rounded-2xl object-cover ring-1 ring-rose-500/30 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 text-lg font-bold text-white">
                        {talent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardHeading>{talent.name}</CardHeading>
                        {talent.verified && (
                          <CheckCircle2
                            className="h-4 w-4 text-emerald-500"
                            aria-label="Verified"
                          />
                        )}
                        <DemoBadge show={talent.isDemo} />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                        {talent.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {talent.company} · {talent.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="type-numeric text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                      ${talent.hourlyRate}/hr
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true" />
                      <span className="type-numeric">{(talent.rating || 5.0).toFixed(2)}</span>
                      <span className="text-[var(--text-muted)]">
                        ({talent.completedProjects || 14} deliverables)
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {talent.bio}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {talent.skills.map((skill) => {
                    const isMatch = q.trim() && skill.toLowerCase().includes(q.toLowerCase());
                    return (
                      <span
                        key={skill}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          isMatch
                            ? 'bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40 font-bold'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>

                {/* DIRECTLY RENDERED PORTFOLIO WORK SHOWCASE */}
                {talent.portfolio && talent.portfolio.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <FolderGit2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Verified Portfolio Works ({talent.portfolio.length})</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Code Proof
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {talent.portfolio.slice(0, 2).map((item, idx) => {
                        const isMatch =
                          q.trim() &&
                          (item.title.toLowerCase().includes(q.toLowerCase()) ||
                            item.description.toLowerCase().includes(q.toLowerCase()) ||
                            item.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())));

                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition-all ${
                              isMatch
                                ? 'border-rose-500/50 bg-rose-500/[0.04] ring-1 ring-rose-500/20'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-elevated)]'
                            }`}
                          >
                            <div className="space-y-1">
                              {item.imageUrl && (
                                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-black/20">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {item.category && (
                                    <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-start justify-between gap-1 pt-0.5">
                                <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">
                                  {item.title}
                                </p>
                                {item.metrics && (
                                  <span className="text-[9px] font-bold text-emerald-500 shrink-0 bg-emerald-500/10 px-1 rounded">
                                    {item.metrics}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.tags.slice(0, 3).map((tg) => (
                                    <span
                                      key={tg}
                                      className="text-[9px] font-medium bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                                    >
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-1">
                              {item.githubUrl ? (
                                <a
                                  href={ensureHttps(item.githubUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-2 py-0.5 rounded-md transition-colors"
                                  title="Inspect GitHub Proof of Concept"
                                >
                                  <Code2 className="h-3 w-3 text-rose-500" />
                                  <span>GitHub PoC</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)]">Verified internal</span>
                              )}

                              {item.link && (
                                <a
                                  href={ensureHttps(item.link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:underline"
                                >
                                  <span>Live Demo</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {talent.matchBreakdown && (
                  <ExplainableMatchCard
                    match={talent.matchBreakdown}
                    compact
                    title="Benchmarked Brief Match"
                  />
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="capitalize font-medium text-[var(--text-secondary)]">
                    {talent.availability}
                  </span>{' '}
                  · {talent.yearsExperience} yrs exp · {talent.completionRate}% delivery
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => inspectFreelancer(talent._id)}
                    className="rounded-full bg-[var(--bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--brand-rose)] hover:text-white transition-colors cursor-pointer"
                  >
                    Inspect Full Portfolio ({talent.portfolio?.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartHire(talent)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Hire Specialist</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Portfolio & Verified Reviews Modal */}
      {activeFreelancer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeFreelancer.name} Portfolio and Verified Reviews`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-2xl w-full max-h-[88svh] overflow-y-auto p-6 sm:p-8 space-y-6">
            {activeFreelancer.bannerUrl && (
              <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden bg-[#160812] -mt-1">
                <img
                  src={activeFreelancer.bannerUrl}
                  alt={`${activeFreelancer.name} Banner`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-white">
                    <span className="text-xs font-extrabold text-white tracking-wide truncate">
                      {activeFreelancer.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/15 shrink-0">
                    {activeFreelancer.location}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3.5">
                {activeFreelancer.avatarUrl ? (
                  <img
                    src={activeFreelancer.avatarUrl}
                    alt={activeFreelancer.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-rose-500/30 shadow-md shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-xl font-bold text-white shadow-xs">
                    {activeFreelancer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <Eyebrow>Verified Specialist Portfolio</Eyebrow>
                  <SectionHeading className="mt-0.5">{activeFreelancer.name}</SectionHeading>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{activeFreelancer.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartHire(activeFreelancer)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Hire Specialist</span>
                </button>
                <button
                  type="button"
                  onClick={closeInspect}
                  aria-label="Close portfolio"
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="veloura-elevated p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Hourly Rate
                </p>
                <p className="type-numeric text-lg font-bold text-[var(--text-primary)]">
                  ${activeFreelancer.hourlyRate}/hr
                </p>
              </div>
              <div className="veloura-elevated p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Verified Rating
                </p>
                <p className="type-numeric text-lg font-bold text-amber-500">
                  {(activeFreelancer.rating || 5.0).toFixed(2)} ★
                </p>
              </div>
              <div className="veloura-elevated p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Completed Sprints
                </p>
                <p className="type-numeric text-lg font-bold text-[var(--text-primary)]">
                  {activeFreelancer.completedProjects || 14} ({activeFreelancer.completionRate || 98}%)
                </p>
              </div>
            </div>

            {/* Case Studies */}
            <div className="space-y-3">
              <h3 className="type-card-heading flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                <span>Published Case Studies ({activeFreelancer.portfolio?.length || 0})</span>
              </h3>
              {(activeFreelancer.portfolio || []).map((item, idx) => (
                <div key={idx} className="veloura-elevated p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--brand-rose)]">
                      {item.category}
                    </span>
                    {item.metrics && (
                      <span className="type-numeric rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                        {item.metrics}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.link && (
                        <a
                          href={ensureHttps(item.link)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                      {item.githubUrl && (
                        <a
                          href={ensureHttps(item.githubUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
                          title="View verified GitHub Proof of Concept"
                        >
                          <Code2 className="h-3.5 w-3.5 text-rose-500" />
                          <span>GitHub PoC</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Client Reviews */}
            <div className="space-y-3">
              <h3 className="type-card-heading flex items-center gap-2">
                <Award className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                <span>Verified On-Platform Reviews ({activeReviews.length})</span>
              </h3>
              {activeReviews.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  No completed contract reviews recorded yet.
                </p>
              ) : (
                activeReviews.map((rev) => (
                  <div key={rev._id} className="veloura-elevated p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {rev.client?.name || 'Verified Client'}{' '}
                        {rev.client?.company ? `· ${rev.client.company}` : ''}
                      </span>
                      <span className="type-numeric font-bold text-amber-500">
                        {rev.rating}.0 ★
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] italic">
                      “{rev.comment}”
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeInspect}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleStartHire(activeFreelancer)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Hire Specialist Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hire Specialist Modal */}
      <HireSpecialistModal
        freelancer={hiringSpecialist}
        isOpen={Boolean(hiringSpecialist)}
        onClose={() => setHiringSpecialist(null)}
        clientProjects={openProjects}
        apiFetch={apiFetch}
        showToast={showToast}
        onSuccess={() => {
          setHiringSpecialist(null);
          navigate('/dashboard?tab=contracts');
        }}
      />
    </div>
  );
};

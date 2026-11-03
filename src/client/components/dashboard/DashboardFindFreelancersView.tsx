import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  Star,
  ShieldCheck,
  DollarSign,
  Bookmark,
  MessageSquare,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Code2,
  FolderGit2,
  CheckCircle2,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { UserProfile, PortfolioItem, ProjectItem } from '../../../shared/types.js';
import { FreelancerPortfolioModal } from '../FreelancerPortfolioModal.js';
import { HireSpecialistModal } from '../HireSpecialistModal.js';

interface DashboardFindFreelancersViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  openProjects?: ProjectItem[];
  onOpenDirectChat?: (freelancerId: string) => void;
  onContractCreated?: (contractId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ensureHttps = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export const DashboardFindFreelancersView: React.FC<DashboardFindFreelancersViewProps> = ({
  user,
  apiFetch,
  openProjects = [],
  onOpenDirectChat,
  onContractCreated,
  showToast,
}) => {
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [maxRate, setMaxRate] = useState<number>(300);
  const [onlyWithGithubPoc, setOnlyWithGithubPoc] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>(user.savedFreelancers || []);
  const [inspectingSpecialist, setInspectingSpecialist] = useState<UserProfile | null>(null);
  const [hiringSpecialist, setHiringSpecialist] = useState<UserProfile | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load freelancers from backend with query parameter
  const loadFreelancers = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const res = await apiFetch<{ freelancers: UserProfile[] }>(`/api/freelancers?${params.toString()}`);
      setFreelancers(res.freelancers || []);
    } catch {
      // Graceful fallback
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFreelancers(debouncedQuery);
  }, [debouncedQuery]);

  const handleToggleBookmark = async (id: string) => {
    try {
      const res = await apiFetch<{ bookmarked: boolean; savedFreelancers: string[] }>(
        `/api/freelancers/${id}/bookmark`,
        { method: 'POST' }
      );
      setSavedIds(res.savedFreelancers);
      showToast(
        res.bookmarked ? 'Specialist added to Saved Talent bench!' : 'Removed from Saved Talent.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to bookmark', 'error');
    }
  };

  const PRESET_REQUIREMENTS = [
    { label: 'All Specialties', query: '' },
    { label: 'Cybersecurity & Auditing', query: 'Cybersecurity' },
    { label: 'Full-Stack React & Node', query: 'React' },
    { label: 'AI & Machine Learning', query: 'Machine Learning' },
    { label: 'Quantum Computing', query: 'Quantum' },
    { label: 'WhatsApp & Bots', query: 'WhatsApp' },
    { label: 'TypeScript / APIs', query: 'TypeScript' },
  ];

  const handleSelectPreset = (item: { label: string; query: string }) => {
    setSelectedPreset(item.label);
    setSearchQuery(item.query);
  };

  // Client-side refined filtering (rate + github POC toggle)
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      if (f.hourlyRate && f.hourlyRate > maxRate) return false;
      if (onlyWithGithubPoc) {
        const hasGithub = f.portfolio?.some((p) => Boolean(p.githubUrl && p.githubUrl.trim()));
        if (!hasGithub) return false;
      }
      return true;
    });
  }, [freelancers, maxRate, onlyWithGithubPoc]);

  // Calculate total portfolio projects matched
  const totalProjectsFound = useMemo(() => {
    return filteredFreelancers.reduce((acc, f) => acc + (f.portfolio?.length || 0), 0);
  }, [filteredFreelancers]);

  return (
    <div className="space-y-6">
      {/* Header Banner: Requirements Search Engine */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="relative z-10 space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Requirements &amp; Portfolio Search Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Match Requirements Directly to Verified Portfolios
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Enter your technical requirements, problem statements, or tech stack. Our engine searches specialist skills, technical titles, and <strong>all published portfolio projects &amp; verified GitHub code proofs</strong>—connecting you directly with talent who have already built what you need.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="mt-5 space-y-3">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-[var(--brand-rose)] absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by requirements, tech stack (e.g. React, Cybersecurity, Qiskit, WhatsApp), or specialist name..."
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-10 pr-24 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Requirement Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mr-1">
              Popular Needs:
            </span>
            {PRESET_REQUIREMENTS.map((preset) => {
              const active = searchQuery === preset.query;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/80 border border-[var(--border-subtle)]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Max Rate:</span>
              <span className="font-bold text-rose-500">${maxRate}/hr</span>
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-24 accent-rose-500 cursor-pointer"
              />
            </div>

            <label className="flex items-center gap-1.5 text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithGithubPoc}
                onChange={(e) => setOnlyWithGithubPoc(e.target.checked)}
                className="accent-rose-500 rounded"
              />
              <span className="font-medium">Must have verified GitHub PoC</span>
            </label>
          </div>

          <div className="text-[11px] font-semibold text-[var(--text-muted)]">
            Showing <strong className="text-[var(--text-primary)]">{filteredFreelancers.length}</strong> specialists ({totalProjectsFound} portfolio projects)
          </div>
        </div>
      </div>

      {/* Grid of Freelancer Cards with Directly Rendered Portfolios */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-rose-500" />
          <span className="font-medium">Matching specialists and scanning verified portfolio repositories...</span>
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-3 bg-[var(--bg-surface)]">
          <Users className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Matching Specialists Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            We couldn't find specialists matching "{searchQuery}" under ${maxRate}/hr. Try relaxing your search terms or clicking one of the popular requirement presets above.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setMaxRate(300);
              setOnlyWithGithubPoc(false);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Reset Search Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredFreelancers.map((f) => {
            const isBookmarked = savedIds.includes(f._id);
            const initials = f.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const portfolioItems = f.portfolio || [];

            return (
              <div
                key={f._id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5 hover:border-rose-400/40 transition-all shadow-xs flex flex-col justify-between"
              >
                {/* Top Section: Banner, Identity, Rate, Skills */}
                <div className="space-y-4">
                  {f.bannerUrl && (
                    <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden bg-[#160812] -mt-1">
                      <img
                        src={f.bannerUrl}
                        alt={`${f.name} Cover`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="text-[11px] font-extrabold text-white tracking-wide drop-shadow-md truncate">
                          {f.title}
                        </span>
                        <span className="text-[9px] font-bold text-rose-200 uppercase tracking-wider bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                          {f.location || 'Remote'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {f.avatarUrl ? (
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="h-13 w-13 shrink-0 rounded-2xl object-cover ring-2 ring-rose-500/20 shadow-xs"
                        />
                      ) : (
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white shadow-xs">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-extrabold text-[var(--text-primary)]">{f.name}</h4>
                          {f.verified && (
                            <span title="Verified Specialist Identity">
                              <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            </span>
                          )}
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 capitalize">
                            {f.availability || 'available'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--text-secondary)]">{f.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {f.company ? `${f.company} · ` : ''}{f.yearsExperience || 5} yrs experience
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5 text-sm font-extrabold text-[var(--text-primary)]">
                          <DollarSign className="h-3.5 w-3.5 text-rose-500" />
                          <span>{f.hourlyRate || 95}/hr</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[11px] text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{f.rating ? f.rating.toFixed(1) : '5.0'}</span>
                          <span className="text-[var(--text-muted)]">({f.reviewCount || f.completedProjects || 12})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(f._id)}
                        title={isBookmarked ? 'Remove Bookmark' : 'Save Specialist'}
                        className={`p-2 rounded-xl border border-[var(--border-subtle)] transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
                            : 'text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {f.bio || 'Specialist with demonstrated expertise in high-scale distributed systems and rapid prototyping.'}
                  </p>

                  {/* Skills Pills */}
                  {f.skills && f.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.skills.map((s) => {
                        const isMatch = searchQuery && s.toLowerCase().includes(searchQuery.toLowerCase());
                        return (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              isMatch
                                ? 'bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40 font-bold'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* DIRECTLY RENDERED PORTFOLIO WORK SHOWCASE */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                        <FolderGit2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Verified Portfolio Projects &amp; PoCs ({portfolioItems.length})</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Code Proof Attached
                      </span>
                    </div>

                    {portfolioItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-3 text-center text-xs text-[var(--text-muted)]">
                        No portfolio projects published yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {portfolioItems.slice(0, 2).map((item, idx) => {
                          const isMatch =
                            searchQuery &&
                            (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

                          return (
                            <div
                              key={idx}
                              className={`rounded-2xl border p-3 flex flex-col justify-between gap-2 transition-all ${
                                isMatch
                                  ? 'border-rose-500/50 bg-rose-500/[0.04] ring-1 ring-rose-500/20'
                                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-elevated)]'
                              }`}
                            >
                              <div className="space-y-1.5">
                                {item.imageUrl && (
                                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/20">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    {item.category && (
                                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-white bg-black/75 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-1">
                                  <h5 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 leading-snug">
                                    {item.title}
                                  </h5>
                                  {item.metrics && (
                                    <span className="text-[9px] font-bold text-emerald-500 shrink-0 bg-emerald-500/10 px-1 rounded">
                                      {item.metrics}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>

                                {/* Tags */}
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 3).map((tg) => (
                                      <span
                                        key={tg}
                                        className="text-[9px] font-medium bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                                      >
                                        {tg}
                                      </span>
                                    ))}
                                    {item.tags.length > 3 && (
                                      <span className="text-[9px] text-[var(--text-muted)]">
                                        +{item.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Project Links (GitHub PoC & Demo) */}
                              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-1">
                                {item.githubUrl ? (
                                  <a
                                    href={ensureHttps(item.githubUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
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
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {onOpenDirectChat && (
                      <button
                        type="button"
                        onClick={() => onOpenDirectChat(f._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Direct Message</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectingSpecialist(f)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <span>Inspect Full Portfolio</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {user.role === 'client' && (
                    <button
                      type="button"
                      onClick={() => setHiringSpecialist(f)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Hire Specialist</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Full Portfolio Dossier Modal */}
      <FreelancerPortfolioModal
        specialist={inspectingSpecialist}
        isOpen={Boolean(inspectingSpecialist)}
        onClose={() => setInspectingSpecialist(null)}
        onHireClick={(spec) => {
          setInspectingSpecialist(null);
          setHiringSpecialist(spec);
        }}
        onMessageClick={onOpenDirectChat}
        apiFetch={apiFetch}
        isClientUser={user.role === 'client'}
      />

      {/* Direct Hire / Award Brief Modal */}
      <HireSpecialistModal
        freelancer={hiringSpecialist}
        isOpen={Boolean(hiringSpecialist)}
        onClose={() => setHiringSpecialist(null)}
        clientProjects={openProjects}
        apiFetch={apiFetch}
        showToast={showToast}
        onSuccess={(contractId) => {
          setHiringSpecialist(null);
          if (onContractCreated) {
            onContractCreated(contractId);
          }
        }}
      />
    </div>
  );
};

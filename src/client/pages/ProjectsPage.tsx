import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  FolderOpen,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { ProjectItem, MatchBreakdown } from '../../shared/types.js';
import {
  PageTitle,
  CardHeading,
  Eyebrow,
  SupportText,
} from '../components/Typography.js';
import { BriefCard } from '../components/BriefCard.js';

const CATEGORIES = [
  'all',
  'Design Systems & FinTech',
  'AI & LLM Engineering',
  'Brand & Editorial UI',
  'Backend & Distributed Systems',
];

export const ProjectsPage: React.FC = () => {
  const { apiFetch, user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<(ProjectItem & { matchBreakdown?: MatchBreakdown })[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [skill, setSkill] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(
    () => searchParams.get('bookmarked') === '1'
  );

  // Sync URL query params when navigated from Navbar search or Saved Briefs menu
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null && urlQ !== q) {
      setQ(urlQ);
    }
    const urlBookmarked = searchParams.get('bookmarked') === '1';
    setOnlyBookmarked(urlBookmarked);
  }, [searchParams]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      if (experienceLevel !== 'all') params.set('experienceLevel', experienceLevel);
      if (skill.trim()) params.set('skill', skill.trim());

      const res = await apiFetch<{
        projects: (ProjectItem & { matchBreakdown?: MatchBreakdown })[];
      }>(`/api/projects?${params.toString()}`);
      setProjects(res.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, q, category, status, experienceLevel, skill]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const displayedProjects = onlyBookmarked
    ? projects.filter((p) => user?.savedProjects?.includes(String(p._id)))
    : projects;

  const openCount = projects.filter((p) => p.status === 'open').length;

  return (
    <div className="veloura-container py-8 sm:py-12 space-y-7">
      {/* Header Banner */}
      <div className="veloura-surface p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl"
        />

        <div className="space-y-2.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
            <Eyebrow className="!text-[11px]">
              Commissioned Marketplace · {openCount} Open Briefs
            </Eyebrow>
          </div>
          <PageTitle>Open Briefs for Exceptional Talent</PageTitle>
          <SupportText>
            Inspect structured client scopes with verified milestone budgets, sprint timelines, and
            live 5-factor explainable match telemetry.
          </SupportText>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !onlyBookmarked;
              setOnlyBookmarked(next);
              const nextParams = new URLSearchParams(searchParams);
              if (next) nextParams.set('bookmarked', '1');
              else nextParams.delete('bookmarked');
              setSearchParams(nextParams, { replace: true });
            }}
            aria-pressed={onlyBookmarked}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              onlyBookmarked
                ? 'border-[var(--brand-rose)] bg-rose-500/15 text-[var(--brand-rose)]'
                : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-rose)]'
            }`}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${onlyBookmarked ? 'fill-[var(--brand-rose)]' : ''}`}
              aria-hidden="true"
            />
            <span>Saved Briefs ({user?.savedProjects?.length || 0})</span>
          </button>

          {user?.role === 'client' || user?.role === 'admin' ? (
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-rose)] px-5 py-2.5 type-btn text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Publish New Brief</span>
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] transition-colors"
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-[var(--brand-rose)]"
                aria-hidden="true"
              />
              <span>Calibrate My Match Skills</span>
            </Link>
          )}
        </div>
      </div>

      {/* Responsive Search & Filter Controls */}
      <div className="veloura-surface p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search
              className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search briefs by title, architecture, or skill..."
              aria-label="Search projects"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-rose)] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Domains' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              aria-label="Filter by seniority level"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="all">Any Seniority</option>
              <option value="principal">Principal Tier</option>
              <option value="senior">Senior Tier</option>
              <option value="mid">Mid Tier</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by project status"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open Briefs</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Quick Skill Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)]">
            <Filter className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
            <span>Stack Filter:</span>
          </span>
          {['', 'React', 'TypeScript', 'Design Systems', 'Node.js', 'MongoDB', 'AI Engineering'].map(
            (tag) => (
              <button
                key={tag || 'all'}
                type="button"
                onClick={() => setSkill(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  skill === tag
                    ? 'bg-[var(--brand-rose)] text-white shadow-2xs'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tag || 'All Skills'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="veloura-surface p-6 h-80 animate-pulse" />
          ))}
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="veloura-surface p-12 text-center space-y-3">
          <FolderOpen className="h-10 w-10 mx-auto text-[var(--text-muted)]" aria-hidden="true" />
          <CardHeading>
            {onlyBookmarked ? 'No Saved Briefs Yet' : 'No Matching Briefs Found'}
          </CardHeading>
          <SupportText className="mx-auto">
            {onlyBookmarked
              ? 'Click the bookmark icon on any project card to save it to your workspace.'
              : 'Try clearing your search query or adjusting the domain filter to inspect all briefs.'}
          </SupportText>
          <button
            type="button"
            onClick={() => {
              setQ('');
              setCategory('all');
              setStatus('all');
              setExperienceLevel('all');
              setSkill('');
              setOnlyBookmarked(false);
              setSearchParams({}, { replace: true });
            }}
            className="rounded-full bg-[var(--bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedProjects.map((project) => (
            <BriefCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Layers,
  Users,
  Bookmark,
  MapPin,
  Flame,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { ProjectItem, MatchBreakdown } from '../../shared/types.js';
import { DemoBadge } from './Typography.js';

interface BriefCardProps {
  project: ProjectItem & { matchBreakdown?: MatchBreakdown };
  featured?: boolean;
}

export const BriefCard: React.FC<BriefCardProps> = ({ project, featured = false }) => {
  const { isBookmarked, toggleBookmark } = useApp();
  const [bookmarking, setBookmarking] = useState(false);

  const bookmarked = isBookmarked(project._id);
  const clientName = project.client?.company || project.client?.name || 'Client Partner';
  const clientLocation = project.client?.location || 'Remote';
  const isClientVerified = Boolean(project.client?.verified);
  const milestonesCount = project.milestones?.length || 3;
  const weeksCount = Math.max(1, Math.round(project.deadlineDays / 7));
  const matchScore = project.matchBreakdown?.totalScore;

  // Real data-driven Urgent or Featured labels (never fabricated)
  const isUrgent = project.status === 'open' && project.deadlineDays <= 14;
  const isHighValueFeatured = project.budgetMax >= 15000;

  // Domain-specific editorial artwork theme
  const catLower = (project.category || '').toLowerCase();
  const artVariant = catLower.includes('ai')
    ? 'from-[#280c1e] via-[#4a153b] to-[#1e1035]'
    : catLower.includes('brand') || catLower.includes('editorial')
    ? 'from-[#2d0c18] via-[#5c162e] to-[#381020]'
    : catLower.includes('backend')
    ? 'from-[#1a0d18] via-[#3d1428] to-[#171226]'
    : 'from-[#260b16] via-[#52152c] to-[#2e0e1d]';

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarking) return;
    setBookmarking(true);
    try {
      await toggleBookmark(project._id);
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <article className="group relative veloura-surface overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)]">
      <div>
        {/* Designed Visual Thumbnail Header (Consistent 16:5 Ratio + V-Star Motif) */}
        <div
          className={`relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-br ${artVariant} p-4 flex flex-col justify-between text-white`}
        >
          {/* Ambient Geometric SVG Artwork */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 140"
            fill="none"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
          >
            <path
              d="M-30 110 C 90 30, 220 135, 430 25"
              stroke="#F48FB1"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <path
              d="M-10 130 C 130 60, 260 140, 420 55"
              stroke="#F8BBD0"
              strokeWidth="1"
              strokeDasharray="3 4"
              strokeOpacity="0.45"
            />
            <circle cx="330" cy="42" r="38" stroke="#F48FB1" strokeOpacity="0.25" strokeWidth="1" />
            <circle cx="330" cy="42" r="62" stroke="#FCE4EC" strokeOpacity="0.15" strokeWidth="0.75" />
            {/* Signature 4-Point V-Star Detail */}
            <path
              d="M330 24L332.2 31.8L340 34L332.2 36.2L330 44L327.8 36.2L320 34L327.8 31.8L330 24Z"
              fill="#F8BBD0"
              fillOpacity="0.75"
            />
          </svg>

          {/* Thumbnail Top Row: Category + Data-Driven Labels + Bookmark Button */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-full border border-white/15 bg-black/35 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-rose-100">
                {project.category}
              </span>

              {isHighValueFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-500/25 backdrop-blur-md px-2 py-0.5 text-[10.5px] font-semibold text-rose-100">
                  <Star className="h-2.5 w-2.5 fill-rose-200 text-rose-200" aria-hidden="true" />
                  <span>Featured</span>
                </span>
              )}

              {isUrgent && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-500/25 backdrop-blur-md px-2 py-0.5 text-[10.5px] font-semibold text-amber-100">
                  <Flame className="h-2.5 w-2.5 text-amber-200" aria-hidden="true" />
                  <span>Urgent ({project.deadlineDays}d)</span>
                </span>
              )}
            </div>

            {/* Persistent Bookmark Control */}
            <button
              type="button"
              onClick={handleBookmarkClick}
              disabled={bookmarking}
              aria-label={bookmarked ? 'Remove brief from bookmarks' : 'Bookmark brief'}
              aria-pressed={bookmarked}
              title={bookmarked ? 'Saved in bookmarks' : 'Save brief to bookmarks'}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer ${
                bookmarked
                  ? 'border-rose-300 bg-rose-500 text-white shadow-sm'
                  : 'border-white/20 bg-black/35 text-rose-100 hover:bg-black/55 hover:border-rose-300/50'
              }`}
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${bookmarked ? 'fill-white' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Thumbnail Bottom Row: Match Score Badge + Demo Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-rose-100/90">
              <MapPin className="h-3.5 w-3.5 text-rose-300 shrink-0" aria-hidden="true" />
              <span className="truncate font-medium">{clientLocation}</span>
              <span className="text-rose-200/50">·</span>
              <span className="uppercase tracking-wider text-[10.5px] font-semibold text-rose-200">
                {project.experienceLevel} Tier
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {typeof matchScore === 'number' && (
                <span
                  title={`5-Factor Match Score: ${matchScore}% (${project.matchBreakdown?.tier})`}
                  className="type-numeric inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-black/45 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-rose-200"
                >
                  <Sparkles className="h-3 w-3 text-rose-300" aria-hidden="true" />
                  <span>{matchScore}% Match</span>
                </span>
              )}
              <DemoBadge show={project.isDemo} />
            </div>
          </div>
        </div>

        {/* Card Body Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Client Metadata */}
          <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)] truncate">
              {isClientVerified && (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{clientName}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                project.status === 'open'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : project.status === 'in_progress'
                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  project.status === 'open'
                    ? 'bg-emerald-500'
                    : project.status === 'in_progress'
                    ? 'bg-sky-500'
                    : 'bg-violet-500'
                }`}
              />
              <span>{project.status.replace('_', ' ')}</span>
            </span>
          </div>

          {/* Title & Summary */}
          <div className="space-y-1.5">
            <h3 className="type-card-heading text-[var(--text-primary)] group-hover:text-[var(--brand-rose)] transition-colors">
              <Link to={`/projects/${project._id}`} className="focus:outline-none">
                {project.title}
              </Link>
            </h3>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {project.summary}
            </p>
          </div>

          {/* Structured 3-Column Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 p-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Budget
              </p>
              <p className="type-numeric text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">
                ${project.budgetMin.toLocaleString()}–${project.budgetMax.toLocaleString()}
              </p>
            </div>

            <div className="border-x border-[var(--border-subtle)] px-2.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Duration
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5 inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[var(--brand-rose)] shrink-0" aria-hidden="true" />
                <span>
                  {project.deadlineDays}d ({weeksCount}w)
                </span>
              </p>
            </div>

            <div className="pl-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Milestones
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5 inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[var(--brand-rose)] shrink-0" aria-hidden="true" />
                <span>{milestonesCount} Stages</span>
              </p>
            </div>
          </div>

          {/* Skill Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.requiredSkills.slice(0, featured ? 4 : 5).map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
              >
                {skill}
              </span>
            ))}
            {project.requiredSkills.length > (featured ? 4 : 5) && (
              <span className="rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
                +{project.requiredSkills.length - (featured ? 4 : 5)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
          <Users className="h-3.5 w-3.5 text-[var(--brand-rose)]" aria-hidden="true" />
          <span>
            <strong className="type-numeric text-[var(--text-primary)]">
              {project.proposalCount}
            </strong>{' '}
            {project.proposalCount === 1 ? 'proposal' : 'proposals'}
          </span>
        </span>

        <Link
          to={`/projects/${project._id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] group-hover:bg-[var(--brand-rose)] group-hover:border-[var(--brand-rose)] group-hover:text-white transition-all"
        >
          <span>View Brief</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

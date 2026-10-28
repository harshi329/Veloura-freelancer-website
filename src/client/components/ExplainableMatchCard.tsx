import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from 'lucide-react';
import type { MatchBreakdown } from '../../shared/types.js';

interface ExplainableMatchCardProps {
  match: MatchBreakdown;
  compact?: boolean;
  title?: string;
  projectLink?: string;
}

export const ExplainableMatchCard: React.FC<ExplainableMatchCardProps> = ({
  match,
  compact = false,
  title = '5-Factor Compatibility Breakdown',
  projectLink,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const badgeColors =
    match.totalScore >= 85
      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : match.totalScore >= 70
      ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30'
      : 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30';

  return (
    <div className="veloura-elevated p-4 sm:p-5 transition-all space-y-3.5">
      {/* Top Score Header + Expand/Collapse Control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Circular Score Ring */}
          <div className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/15 to-violet-500/20 border border-rose-400/30">
            <span className="type-numeric text-base font-bold text-[var(--brand-rose)]">
              {match.totalScore}%
            </span>
          </div>
          <div>
            <p className="type-eyebrow text-[var(--text-muted)] !text-[10.5px]">{title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="type-numeric text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {match.totalScore} / 100 pts
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeColors}`}
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>{match.tier}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Hide Explanation' : 'Explain Match'}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Matched & Missing Skills Pills */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Skill Overlap Telemetry ({match.matchedSkills.length} matched
          {match.missingSkills.length > 0 ? ` · ${match.missingSkills.length} missing` : ''})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {match.matchedSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{skill}</span>
            </span>
          ))}
          {match.missingSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
            >
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Missing: {skill}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Five-Factor Score Breakdown with Progress Indicators & Expandable Explanation */}
      <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
        {match.factors.map((factor) => {
          const pct = Math.round((factor.score / factor.maxScore) * 100);
          return (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[var(--text-primary)] font-semibold">{factor.label}</span>
                <span className="type-numeric font-bold text-[var(--brand-rose)]">
                  {factor.score} / {factor.maxScore} pts
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={factor.score}
                aria-valuemin={0}
                aria-valuemax={factor.maxScore}
                aria-label={factor.label}
                className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {expanded && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-0.5">
                  {factor.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {projectLink && (
        <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            Deterministic 5-factor model · Real-time calibration
          </span>
          <Link
            to={projectLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-rose)] hover:underline"
          >
            <span>View Full Project Brief</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};

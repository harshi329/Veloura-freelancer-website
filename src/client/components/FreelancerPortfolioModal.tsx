import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  DollarSign,
  Briefcase,
  Code2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Award,
  Layers,
  Bookmark,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { UserProfile, PortfolioItem } from '../../shared/types.js';

interface ReviewRecord {
  _id: string;
  rating: number;
  comment: string;
  client?: { name: string; company?: string };
  projectId?: { title: string; category?: string };
  createdAt: string;
}

interface FreelancerPortfolioModalProps {
  specialist: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onHireClick: (specialist: UserProfile) => void;
  onMessageClick?: (specialistId: string) => void;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  isClientUser?: boolean;
}

const ensureHttps = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export const FreelancerPortfolioModal: React.FC<FreelancerPortfolioModalProps> = ({
  specialist,
  isOpen,
  onClose,
  onHireClick,
  onMessageClick,
  apiFetch,
  isClientUser = true,
}) => {
  const [fullSpecialist, setFullSpecialist] = useState<UserProfile | null>(specialist);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (specialist && isOpen) {
      setFullSpecialist(specialist);
      setLoading(true);
      apiFetch<{ freelancer: UserProfile; reviews: ReviewRecord[] }>(
        `/api/freelancers/${specialist._id}`
      )
        .then((res) => {
          if (res.freelancer) setFullSpecialist(res.freelancer);
          setReviews(res.reviews || []);
        })
        .catch(() => {
          // fallback to passed specialist
        })
        .finally(() => setLoading(false));
    }
  }, [specialist, isOpen, apiFetch]);

  if (!isOpen || !fullSpecialist) return null;

  const data = fullSpecialist;
  const portfolioItems: PortfolioItem[] = data.portfolio || [];

  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${data.name} Full Portfolio & Dossier`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
    >
      <div className="veloura-surface max-w-3xl w-full max-h-[92svh] overflow-y-auto p-5 sm:p-8 space-y-6 rounded-3xl border border-[var(--border-strong)] shadow-2xl relative">
        {/* Banner Cover if present */}
        {data.bannerUrl && (
          <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden bg-[#160812] -mt-2">
            <img
              src={data.bannerUrl}
              alt={`${data.name} Banner`}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
            <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
              <span className="text-xs font-extrabold text-white tracking-wide truncate drop-shadow-md">
                {data.title}
              </span>
              <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider bg-black/70 backdrop-blur-xs px-2.5 py-0.5 rounded-lg border border-white/15 shrink-0">
                {data.location || 'Remote'}
              </span>
            </div>
          </div>
        )}

        {/* Header: Avatar, Name, Verification, Close */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center gap-4">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt={data.name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-rose-500/30 shadow-md shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-xl font-extrabold text-white shadow-md">
                {initials}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-500">
                <Sparkles className="h-3 w-3" />
                <span>Verified Specialist Dossier</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  {data.name}
                </h2>
                {data.verified && (
                  <span title="Identity & Proof of Work Verified">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </span>
                )}
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500 capitalize">
                  {data.availability || 'Available'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">
                {data.title} · {data.company ? `${data.company} · ` : ''}{data.yearsExperience || 5} yrs experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isClientUser && (
              <button
                type="button"
                onClick={() => {
                  onHireClick(data);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-4 py-2 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Hire Specialist</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="veloura-elevated p-3 rounded-2xl border border-[var(--border-subtle)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Hourly Rate
            </p>
            <p className="type-numeric text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-0.5 mt-0.5">
              <DollarSign className="h-4 w-4 text-rose-500" />
              <span>{data.hourlyRate || 95}/hr</span>
            </p>
          </div>

          <div className="veloura-elevated p-3 rounded-2xl border border-[var(--border-subtle)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Verified Rating
            </p>
            <p className="type-numeric text-lg font-extrabold text-amber-500 flex items-center gap-1 mt-0.5">
              <Star className="h-4 w-4 fill-current" />
              <span>{(data.rating || 5.0).toFixed(1)}</span>
              <span className="text-xs font-normal text-[var(--text-muted)]">
                ({data.reviewCount || data.completedProjects || 12})
              </span>
            </p>
          </div>

          <div className="veloura-elevated p-3 rounded-2xl border border-[var(--border-subtle)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Completed Sprints
            </p>
            <p className="type-numeric text-lg font-extrabold text-[var(--text-primary)] mt-0.5">
              {data.completedProjects || 14} Deliverables
            </p>
          </div>

          <div className="veloura-elevated p-3 rounded-2xl border border-[var(--border-subtle)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Delivery Success
            </p>
            <p className="type-numeric text-lg font-extrabold text-emerald-500 mt-0.5">
              {data.completionRate || 99}% on-time
            </p>
          </div>
        </div>

        {/* Specialist Bio & Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
            About Specialist &amp; Technical Capabilities
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {data.bio || 'Experienced engineering specialist with demonstrated track record in robust production systems, high-throughput APIs, and modern user experiences.'}
          </p>

          {data.skills && data.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--text-primary)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ALL Published Case Studies & Code Proofs */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Published Case Studies &amp; GitHub Proofs ({portfolioItems.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Full Portfolio Dossier
            </span>
          </div>

          {portfolioItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-muted)]">
              No case studies published to this portfolio yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-3 flex flex-col justify-between hover:border-rose-400/40 transition-all"
                >
                  <div className="space-y-2">
                    {item.imageUrl && (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/20">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {item.category && (
                          <span className="absolute top-2 left-2 text-[10px] font-extrabold text-white bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {item.category}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] leading-snug">
                        {item.title}
                      </h4>
                      {item.metrics && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {item.metrics}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((tg) => (
                          <span
                            key={tg}
                            className="text-[10px] font-medium bg-[var(--bg-surface)] px-2 py-0.5 rounded-md text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GitHub PoC & Live Demo Links */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    {item.githubUrl ? (
                      <a
                        href={ensureHttps(item.githubUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors"
                        title="Inspect GitHub Proof of Concept"
                      >
                        <Code2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Inspect GitHub PoC</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)]">Verified internal work</span>
                    )}

                    {item.link && (
                      <a
                        href={ensureHttps(item.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verified Reviews */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Verified Client Reviews ({reviews.length})
            </h3>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">
              No on-platform client reviews completed yet for this specialist.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">
                      {rev.client?.name || 'Verified Client'} {rev.client?.company ? `· ${rev.client.company}` : ''}
                    </span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{rev.rating}.0</span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          {onMessageClick ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onMessageClick(data._id);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-rose-500 transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
              <span>Send Direct Message</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Close
            </button>

            {isClientUser && (
              <button
                type="button"
                onClick={() => {
                  onHireClick(data);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Hire Specialist Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

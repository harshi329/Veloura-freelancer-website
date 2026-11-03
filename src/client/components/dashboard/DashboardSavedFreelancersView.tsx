import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Star,
  ShieldCheck,
  DollarSign,
  MessageSquare,
  Trash2,
  Users,
  Briefcase,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { UserProfile } from '../../../shared/types.js';

interface DashboardSavedFreelancersViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  onNavigateFindTalent: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardSavedFreelancersView: React.FC<DashboardSavedFreelancersViewProps> = ({
  user,
  apiFetch,
  onNavigateFindTalent,
  showToast,
}) => {
  const [savedFreelancers, setSavedFreelancers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSaved = async () => {
    try {
      const res = await apiFetch<{ freelancers: UserProfile[] }>('/api/my/saved-freelancers');
      if (res.freelancers && res.freelancers.length > 0) {
        setSavedFreelancers(res.freelancers);
      } else {
        // Fallback: If none saved yet, fetch top vetted freelancers for instant discovery
        const allRes = await apiFetch<{ freelancers: UserProfile[] }>('/api/freelancers');
        setSavedFreelancers((allRes.freelancers || []).slice(0, 4));
      }
    } catch {
      // Partial error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleToggleBookmark = async (freelancerId: string) => {
    try {
      await apiFetch(`/api/freelancers/${freelancerId}/bookmark`, { method: 'POST' });
      setSavedFreelancers((prev) => prev.filter((f) => f._id !== freelancerId));
      showToast('Removed from saved freelancers.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update bookmark', 'error');
    }
  };

  const filtered = savedFreelancers.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.title.toLowerCase().includes(q) ||
      f.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            <Bookmark className="h-3.5 w-3.5" />
            <span>Shortlisted Talent Bench</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Saved Freelancers
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Your private bench of bookmarked specialists ready for direct commission or project invitation.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateFindTalent}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer"
        >
          <Users className="h-4 w-4" />
          <span>Find More Talent</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter saved talent by skill or title..."
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Grid of Saved Freelancers */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-3">
          <Bookmark className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Saved Freelancers</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Bookmark top engineers, designers, and AI specialists to save them to your private roster.
          </p>
          <button
            type="button"
            onClick={onNavigateFindTalent}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-rose)] px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span>Discover Freelancers</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((freelancer) => {
            const initials = freelancer.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={freelancer._id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 hover:border-rose-400/40 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {freelancer.bannerUrl && (
                    <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden bg-[#160812] -mt-1 mb-2">
                      <img
                        src={freelancer.bannerUrl}
                        alt={`${freelancer.name} Banner`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="text-[11px] font-extrabold text-white tracking-wide drop-shadow-md truncate">
                          {freelancer.title}
                        </span>
                        <span className="text-[9px] font-bold text-rose-200 uppercase tracking-wider bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                          Verified
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Top Bar: Avatar + Name + Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {freelancer.avatarUrl ? (
                        <img
                          src={freelancer.avatarUrl}
                          alt={freelancer.name}
                          className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-rose-500/30 shadow-xs"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white shadow-xs">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">
                            {freelancer.name}
                          </h4>
                          {freelancer.verified && (
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                          {freelancer.title || 'Specialist'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(freelancer._id)}
                      title="Remove Bookmark"
                      className="p-1 text-rose-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  {/* Hourly Rate & Bio */}
                  <div className="flex items-center justify-between text-xs py-1 border-y border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <DollarSign className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-bold text-[var(--text-primary)]">
                        ${freelancer.hourlyRate || 95}/hr
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{freelancer.rating || 5.0} (12 reviews)</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {freelancer.bio || 'Architectural specialist delivering clean, high-performance web systems.'}
                  </p>

                  {/* Skills */}
                  {freelancer.skills && (
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {freelancer.portfolio?.length || 3} Case Studies
                  </span>

                  <a
                    href={`/freelancers?highlight=${freelancer._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline"
                  >
                    <span>Inspect Full Portfolio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

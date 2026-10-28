import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  ShieldCheck,
  XCircle,
  Eye,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import type { ProposalItem, UserProfile } from '../../../shared/types.js';

interface DashboardProposalsViewProps {
  user: UserProfile;
  proposals: ProposalItem[];
  selectedProjectId?: string | null;
  onClearProjectFilter?: () => void;
  onProposalDecision: (
    proposalId: string,
    status: 'shortlisted' | 'accepted' | 'rejected'
  ) => Promise<void>;
  onOpenReviewModal: (proposal: ProposalItem) => void;
  onOpenChat: (projectId: string) => void;
}

export const DashboardProposalsView: React.FC<DashboardProposalsViewProps> = ({
  user,
  proposals,
  selectedProjectId,
  onClearProjectFilter,
  onProposalDecision,
  onOpenReviewModal,
  onOpenChat,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shortlisted' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isClient = user.role === 'client';

  const filteredProposals = proposals.filter((prop) => {
    // Project filter if selected
    if (selectedProjectId) {
      const pId = typeof prop.projectId === 'object' && prop.projectId !== null
        ? (prop.projectId as { _id?: string })._id
        : prop.projectId;
      if (String(pId) !== String(selectedProjectId)) return false;
    }

    if (statusFilter !== 'all' && prop.status !== statusFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const projTitle = typeof prop.projectId === 'object' && prop.projectId !== null
      ? (prop.projectId as { title?: string }).title || ''
      : '';
    const freelancerName = prop.freelancer?.name || '';
    const cover = prop.coverLetter || '';

    return (
      projTitle.toLowerCase().includes(q) ||
      freelancerName.toLowerCase().includes(q) ||
      cover.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Candidate Evaluation Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {isClient ? 'Candidate Proposals' : 'My Submitted Proposals'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Review detailed execution plans, milestone decompositions, and verify candidate alignment.
          </p>
        </div>

        {selectedProjectId && (
          <button
            type="button"
            onClick={onClearProjectFilter}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 underline cursor-pointer"
          >
            <span>Showing proposals for 1 project (Clear filter)</span>
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
          {(['all', 'pending', 'shortlisted', 'accepted', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proposals or candidates..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Proposals Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {isClient
              ? 'No candidate proposals match this status filter.'
              : 'You have not submitted proposals matching this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const project = typeof proposal.projectId === 'object' && proposal.projectId !== null
              ? (proposal.projectId as { _id?: string; title?: string; category?: string })
              : { _id: String(proposal.projectId), title: 'Veloura Project', category: 'General' };

            const freelancer = proposal.freelancer;
            const initials = (freelancer?.name || 'Specialist')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={proposal._id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 hover:border-rose-400/40 transition-all shadow-xs"
              >
                {/* Header: Candidate Details + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                          {freelancer?.name || 'Verified Specialist'}
                        </h4>
                        {freelancer?.verified && (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {freelancer?.title || 'Principal Full-Stack Engineer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        proposal.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : proposal.status === 'shortlisted'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : proposal.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-blue-500/15 text-blue-600'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>
                </div>

                {/* Proposal Bid & Project Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Target Project
                    </span>
                    <span className="font-bold text-[var(--text-primary)] truncate block mt-0.5">
                      {project.title}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Proposed Bid Amount
                    </span>
                    <span className="font-bold text-rose-500 text-sm block mt-0.5">
                      ${proposal.bidAmount.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Delivery Window
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">
                      {proposal.estimatedDays} Days
                    </span>
                  </div>
                </div>

                {/* Cover Letter Snippet */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Execution Plan &amp; Cover Note:
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-canvas)]/50 p-3.5 rounded-xl border border-[var(--border-subtle)]">
                    {proposal.coverLetter}
                  </p>
                </div>

                {/* Milestones if present */}
                {proposal.milestones && proposal.milestones.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Proposed Milestones ({proposal.milestones.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {proposal.milestones.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)] text-xs"
                        >
                          <span className="truncate max-w-[200px] text-[var(--text-secondary)]">
                            {m.title}
                          </span>
                          <span className="font-bold text-rose-500 shrink-0">
                            ${m.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReviewModal(proposal)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-primary)] hover:border-rose-400 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-rose-500" />
                      <span>Full Breakdown</span>
                    </button>

                    {project._id && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(project._id!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-primary)] hover:border-rose-400 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
                        <span>Chat Candidate</span>
                      </button>
                    )}
                  </div>

                  {isClient && proposal.status !== 'accepted' && (
                    <div className="flex items-center gap-2">
                      {proposal.status !== 'shortlisted' && (
                        <button
                          type="button"
                          onClick={() => onProposalDecision(proposal._id, 'shortlisted')}
                          className="px-3 py-1.5 rounded-xl border border-amber-400/40 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                        >
                          Shortlist
                        </button>
                      )}

                      {proposal.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onProposalDecision(proposal._id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl border border-rose-400/40 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          Decline
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onProposalDecision(proposal._id, 'accepted')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept &amp; Form Contract</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

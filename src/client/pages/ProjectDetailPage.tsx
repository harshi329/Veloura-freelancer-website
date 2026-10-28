import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  Flag,
  Sparkles,
  Award,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type {
  ProjectItem,
  ProposalItem,
  ContractItem,
  MessageItem,
  MatchBreakdown,
  UserProfile,
} from '../../shared/types.js';
import { computeExplainableMatch } from '../../shared/matching.js';
import {
  PageTitle,
  SectionHeading,
  CardHeading,
  Eyebrow,
  BodyText,
  SupportText,
  DemoBadge,
} from '../components/Typography.js';
import { ExplainableMatchCard } from '../components/ExplainableMatchCard.js';

interface ProjectDetailResponse {
  project: ProjectItem;
  myMatchBreakdown: MatchBreakdown | null;
  matchedTalent: { freelancer: UserProfile; match: MatchBreakdown }[];
  proposals: ProposalItem[];
  contract: ContractItem | null;
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, apiFetch, showToast, refreshNotifications } = useApp();
  const navigate = useNavigate();

  const [data, setData] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal form state
  const [bidAmount, setBidAmount] = useState<number>(9500);
  const [estimatedDays, setEstimatedDays] = useState<number>(21);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messagesAllowed, setMessagesAllowed] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Scope or Budget Inconsistency');
  const [reportDetails, setReportDetails] = useState('');

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<ProjectDetailResponse>(`/api/projects/${id}`);
      setData(res);
      setBidAmount(Math.round((res.project.budgetMin + res.project.budgetMax) / 2));
      setEstimatedDays(res.project.deadlineDays);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load brief', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id, showToast]);

  const loadMessages = useCallback(async () => {
    if (!id || !user) return;
    try {
      const res = await apiFetch<{ messages: MessageItem[] }>(`/api/messages/${id}`);
      setMessages(res.messages || []);
      setMessagesAllowed(true);
    } catch {
      setMessagesAllowed(false);
    }
  }, [apiFetch, id, user]);

  useEffect(() => {
    loadProject();
    loadMessages();
  }, [loadProject, loadMessages]);

  if (loading || !data) {
    return (
      <div className="veloura-container py-14 space-y-6">
        <div className="veloura-surface h-64 animate-pulse p-8" />
      </div>
    );
  }

  const { project, proposals, matchedTalent, contract } = data;
  const isOwnerClient =
    user &&
    (user.role === 'admin' ||
      String((project.client as { _id?: string })?._id || project.client) === String(user._id));

  const mySubmittedProposal =
    user?.role === 'freelancer'
      ? proposals.find((p) => String(p.freelancer?._id || p.freelancer) === String(user._id))
      : undefined;

  const liveFreelancerMatch =
    user && user.role === 'freelancer'
      ? computeExplainableMatch(user, project, bidAmount)
      : data.myMatchBreakdown;

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingProposal(true);
    try {
      await apiFetch(`/api/projects/${id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          bidAmount: Number(bidAmount),
          estimatedDays: Number(estimatedDays),
          coverLetter,
        }),
      });
      showToast('Proposal submitted with explainable match snapshot!', 'success');
      setCoverLetter('');
      await loadProject();
      await loadMessages();
      await refreshNotifications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit proposal', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleProposalStatus = async (
    proposalId: string,
    status: 'shortlisted' | 'accepted' | 'rejected'
  ) => {
    try {
      await apiFetch(`/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(
        status === 'accepted'
          ? 'Proposal accepted! Atomic contract created.'
          : `Proposal marked as ${status}.`,
        'success'
      );
      await loadProject();
      await refreshNotifications();
      if (status === 'accepted') {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update proposal status', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !messageText.trim()) return;
    try {
      const res = await apiFetch<{ message: MessageItem }>(`/api/messages/${id}`, {
        method: 'POST',
        body: JSON.stringify({ body: messageText }),
      });
      setMessages((prev) => [...prev, res.message]);
      setMessageText('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'project',
          targetId: project._id,
          targetTitle: project.title,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      showToast('Report submitted to Veloura Trust & Safety.', 'success');
      setReportModalOpen(false);
      setReportDetails('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit report', 'error');
    }
  };

  return (
    <div className="veloura-container py-10 sm:py-14 space-y-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to All Briefs</span>
        </Link>

        {user && (
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Report Brief</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Project Specification & Milestones */}
        <div className="lg:col-span-7 space-y-6">
          <div className="veloura-surface p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {project.category}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  project.status === 'open'
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-500/12 text-blue-700 dark:text-blue-300'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>
              <DemoBadge show={project.isDemo} />
            </div>

            <PageTitle>{project.title}</PageTitle>

            <BodyText>{project.description}</BodyText>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)]">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Budget Calibration
                </p>
                <p className="type-numeric text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                  ${project.budgetMin.toLocaleString()} – ${project.budgetMax.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Target Delivery
                </p>
                <p className="type-numeric text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5 inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                  <span>{project.deadlineDays} Days</span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Required Tier
                </p>
                <p className="text-lg sm:text-xl font-bold capitalize text-[var(--text-primary)] mt-0.5">
                  {project.experienceLevel}
                </p>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2 pt-2">
              <p className="type-eyebrow text-[var(--text-muted)]">Required Technical Stack</p>
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Milestone Breakdown */}
            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
              <SectionHeading as="h2">Structured Milestone Schedule</SectionHeading>
              <div className="space-y-2.5">
                {project.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="veloura-elevated p-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{m.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">Target: Day {m.dueDays}</p>
                    </div>
                    <span className="type-numeric text-sm sm:text-base font-bold text-[var(--brand-rose)] shrink-0">
                      ${m.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client Proposal Review & Awarding Panel */}
          {isOwnerClient && (
            <div className="veloura-surface p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Eyebrow>Client Decision Console</Eyebrow>
                  <SectionHeading>Submitted Proposals ({proposals.length})</SectionHeading>
                </div>
              </div>

              {proposals.length === 0 ? (
                <SupportText>No proposals submitted yet for this brief.</SupportText>
              ) : (
                <div className="space-y-5">
                  {proposals.map((prop) => (
                    <div
                      key={prop._id}
                      className="veloura-elevated p-5 space-y-4 border border-[var(--border-subtle)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardHeading>{prop.freelancer?.name || 'Specialist'}</CardHeading>
                            <span className="rounded-full bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold capitalize text-[var(--text-secondary)]">
                              {prop.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {prop.freelancer?.title} · {prop.freelancer?.location}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="type-numeric text-lg font-bold text-[var(--text-primary)]">
                            ${prop.bidAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            in {prop.estimatedDays} days
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {prop.coverLetter}
                      </p>

                      {prop.matchSnapshot && (
                        <ExplainableMatchCard
                          match={prop.matchSnapshot}
                          compact
                          title="Applicant Match Telemetry"
                        />
                      )}

                      {project.status === 'open' && (
                        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                          {prop.status !== 'shortlisted' && (
                            <button
                              type="button"
                              onClick={() => handleProposalStatus(prop._id, 'shortlisted')}
                              className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] cursor-pointer"
                            >
                              Shortlist
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleProposalStatus(prop._id, 'rejected')}
                            className="rounded-full border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProposalStatus(prop._id, 'accepted')}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                          >
                            <Award className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Accept &amp; Activate Contract</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Authorized Stakeholder Messaging Channel */}
          {user && messagesAllowed && (
            <div className="veloura-surface p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--brand-rose)]" aria-hidden="true" />
                <SectionHeading>Authorized Stakeholder Channel</SectionHeading>
              </div>
              <SupportText>
                Protected project thread accessible only to the commissioning client and proposing
                or assigned specialists.
              </SupportText>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4">
                    No messages in this channel yet. Start the technical alignment conversation below.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = String(m.sender?._id) === String(user._id);
                    return (
                      <div
                        key={m._id}
                        className={`rounded-xl p-3.5 text-xs sm:text-sm ${
                          isMe
                            ? 'bg-rose-500/12 border border-rose-500/25 ml-6'
                            : 'veloura-elevated mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {m.sender?.name} ({m.sender?.role})
                          </span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[var(--text-primary)] leading-relaxed">{m.body}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message to project stakeholders..."
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-rose)] px-4 py-2.5 type-btn text-white cursor-pointer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Live Match Telemetry & Proposal Submission */}
        <div className="lg:col-span-5 space-y-6">
          {liveFreelancerMatch && (
            <div className="veloura-surface p-5 sm:p-6 space-y-4">
              <Eyebrow>Your Real-Time Calibration</Eyebrow>
              <ExplainableMatchCard
                match={liveFreelancerMatch}
                compact={false}
                title={`Match Score for ${user?.name}`}
              />
            </div>
          )}

          {/* Freelancer Proposal Form or Status */}
          {user?.role === 'freelancer' && project.status === 'open' && (
            <div className="veloura-surface p-6 space-y-5">
              {mySubmittedProposal ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Proposal Submitted ({mySubmittedProposal.status.toUpperCase()})</span>
                  </div>
                  <CardHeading>
                    Your Bid: ${mySubmittedProposal.bidAmount.toLocaleString()} in{' '}
                    {mySubmittedProposal.estimatedDays} Days
                  </CardHeading>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    {mySubmittedProposal.coverLetter}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <div>
                    <Eyebrow>Submit Proposal</Eyebrow>
                    <CardHeading className="mt-1">Propose Your Sprint Terms</CardHeading>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        Bid Amount ($ USD)
                      </label>
                      <input
                        type="number"
                        min={50}
                        required
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm font-bold text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        Delivery (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        required
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(Number(e.target.value))}
                        className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm font-bold text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      Architectural Approach &amp; Cover Letter
                    </label>
                    <textarea
                      rows={4}
                      required
                      minLength={20}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Explain your system architecture approach, relevant case studies, and milestone delivery plan..."
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-rose)] px-6 py-3 type-btn text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {submittingProposal
                        ? 'Submitting Proposal...'
                        : `Submit Proposal (${liveFreelancerMatch?.totalScore ?? 85}% Match)`}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Active Contract Summary if Awarded */}
          {contract && (
            <div className="veloura-surface p-6 space-y-3 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                <span className="type-eyebrow">Active Contract in Place</span>
              </div>
              <CardHeading>
                Contract Status: <span className="capitalize">{contract.status}</span>
              </CardHeading>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Agreed Escrow: <strong>${contract.agreedAmount.toLocaleString()}</strong> ·{' '}
                <Link to="/dashboard" className="text-[var(--brand-rose)] font-semibold underline">
                  Manage in Workspace →
                </Link>
              </p>
            </div>
          )}

          {/* Top Matched Roster Specialists for This Brief */}
          <div className="veloura-surface p-6 space-y-4">
            <div>
              <Eyebrow>Algorithmic Leaderboard</Eyebrow>
              <CardHeading className="mt-1">
                Top Matched Specialists for This Brief
              </CardHeading>
            </div>

            <div className="space-y-3">
              {matchedTalent.map(({ freelancer, match }) => (
                <div key={freelancer._id} className="veloura-elevated p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {freelancer.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{freelancer.title}</p>
                    </div>
                    <span className="type-numeric rounded-full bg-rose-500/12 border border-rose-500/25 px-2.5 py-0.5 text-xs font-bold text-[var(--brand-rose)]">
                      {match.totalScore}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report Project Brief"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <CardHeading>Submit Trust &amp; Safety Report</CardHeading>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                >
                  <option value="Scope or Budget Inconsistency">
                    Scope or Budget Inconsistency
                  </option>
                  <option value="Unverified External Contact Request">
                    Unverified External Contact Request
                  </option>
                  <option value="Policy or IP Concern">Policy or IP Concern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Details
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide specific details for the Veloura Trust Council..."
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--brand-rose)] px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

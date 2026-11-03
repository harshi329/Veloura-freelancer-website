import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
  MessageSquare,
  ShieldCheck,
  Award,
  ExternalLink,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { ContractItem, UserProfile } from '../../../shared/types.js';

interface DashboardContractsViewProps {
  user: UserProfile;
  contracts: ContractItem[];
  onSubmitDeliverable: (contract: ContractItem) => void;
  onCompleteContract: (contract: ContractItem) => void;
  onRequestRevision: (contract: ContractItem) => void;
  onOpenDispute: (contract: ContractItem) => void;
  onOpenChat: (projectId: string) => void;
  onAcceptContract?: (contractId: string) => Promise<void>;
  onRejectContract?: (contractId: string, reason?: string) => Promise<void>;
}

export const DashboardContractsView: React.FC<DashboardContractsViewProps> = ({
  user,
  contracts,
  onSubmitDeliverable,
  onCompleteContract,
  onRequestRevision,
  onOpenDispute,
  onOpenChat,
  onAcceptContract,
  onRejectContract,
}) => {
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [rejectModalContract, setRejectModalContract] = useState<ContractItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  const isClient = user.role === 'client';

  // Fix: Include 'pending_acceptance', 'active', 'submitted', 'in_revision', and 'disputed' contracts in the 'active' tab view
  const filteredContracts = contracts.filter((c) => {
    if (tabFilter === 'active') return c.status !== 'completed' && c.status !== 'cancelled';
    if (tabFilter === 'completed') return c.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/30';
      case 'cancelled':
        return 'bg-gray-500/15 text-gray-500 border-gray-400/30';
      case 'completed':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-400/30';
      case 'submitted':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/30';
      case 'in_revision':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/30';
      case 'disputed':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-400/30';
      case 'active':
      default:
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return isClient ? 'Offer Sent (Awaiting Acceptance)' : 'Offer Received (Action Required)';
      case 'cancelled':
        return 'Declined / Cancelled';
      case 'completed':
        return 'Completed';
      case 'submitted':
        return 'Deliverables Submitted';
      case 'in_revision':
        return 'Revision Requested';
      case 'disputed':
        return 'Escrow Disputed';
      case 'active':
      default:
        return 'Active Sprint';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Escrow-Protected Commission Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Active &amp; Completed Contracts
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Track locked milestone funds, review code deliverables, and release payments upon defect-free delivery.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                tabFilter === tab
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-3">
          <FileCheck className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Contracts in this View</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            When a proposal is accepted, an atomic contract with milestone escrow is created here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const project = typeof contract.projectId === 'object' && contract.projectId !== null
              ? (contract.projectId as { _id?: string; title?: string; category?: string })
              : { _id: String(contract.projectId), title: 'Veloura Contract', category: 'General' };

            const isCompleted = contract.status === 'completed';
            const isSubmitted = contract.status === 'submitted';
            const isInRevision = contract.status === 'in_revision';
            const isDisputed = contract.status === 'disputed';
            const isPendingAcceptance = contract.status === 'pending_acceptance';
            const isCancelled = contract.status === 'cancelled';
            const hasDeliverables = Boolean(contract.deliverableSummary);

            return (
              <div
                key={contract._id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-rose-400/40 transition-all shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-300/30">
                        {project.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          contract.status
                        )}`}
                      >
                        {getStatusLabel(contract.status)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                      {project.title}
                    </h3>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                      Agreed Escrow Value
                    </span>
                    <span className="text-xl font-extrabold text-rose-500">
                      ${contract.agreedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Counterparty & Timelines */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)] text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Client
                    </span>
                    <span className="font-bold text-[var(--text-primary)] block mt-0.5">
                      {typeof contract.client === 'object' && contract.client !== null
                        ? (contract.client as { name?: string }).name || 'Client'
                        : 'Client Partner'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Specialist
                    </span>
                    <span className="font-bold text-[var(--text-primary)] block mt-0.5">
                      {typeof contract.freelancer === 'object' && contract.freelancer !== null
                        ? (contract.freelancer as { name?: string }).name || 'Specialist'
                        : 'Verified Specialist'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Escrow State
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{isCompleted ? 'Funds Released' : isDisputed ? 'Escrow Disputed / Frozen' : isCancelled ? 'Escrow Unlocked' : 'Locked in Escrow'}</span>
                    </span>
                  </div>
                </div>

                {/* Pending Acceptance Action Banner for Freelancer */}
                {isPendingAcceptance && !isClient && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      <span>Contract Offer Awaiting Your Decision</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      <strong>{(contract.client as { name?: string })?.name || 'Client'}</strong> has commissioned you for this sprint at <strong>${contract.agreedAmount.toLocaleString()}</strong> ({contract.estimatedDays} days). Funds are secured in Velora Escrow. You can accept to officially start work, or decline the offer to reopen the project for other specialists.
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onAcceptContract && onAcceptContract(contract._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Accept Offer &amp; Begin Sprint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectModalContract(contract)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-400/40 text-rose-500 hover:bg-rose-500/10 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Decline / Reject Offer</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Acceptance Banner for Client */}
                {isPendingAcceptance && isClient && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span>
                        Hiring offer sent to <strong>{(contract.freelancer as { name?: string })?.name || 'Specialist'}</strong>. Awaiting their acceptance.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRejectModalContract(contract)}
                      className="px-3 py-1.5 rounded-xl border border-rose-400/40 text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      Withdraw / Cancel Offer
                    </button>
                  </div>
                )}

                {/* Cancelled / Declined Banner */}
                {isCancelled && (
                  <div className="rounded-2xl border border-gray-400/30 bg-gray-500/5 p-3 text-xs text-[var(--text-muted)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">Contract Declined / Cancelled</span>
                    <p className="italic">
                      {contract.rejectionReason || 'This contract offer was declined and the project brief has been reopened for talent.'}
                    </p>
                  </div>
                )}

                {/* Revision Notes Section */}
                {contract.revisionNotes && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Client Revision Request:</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {contract.revisionNotes}
                    </p>
                  </div>
                )}

                {/* Dispute Reason Section */}
                {contract.disputeReason && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Formal Dispute on Record:</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {contract.disputeReason}
                    </p>
                  </div>
                )}

                {/* Deliverables Section */}
                {hasDeliverables && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-300/30 text-xs">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      Submitted Sprint Deliverables:
                    </span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {contract.deliverableSummary}
                    </p>
                    {contract.deliverableUrl && (
                      <a
                        href={contract.deliverableUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-semibold text-rose-500 hover:underline pt-1"
                      >
                        <span>Inspect Deployment / Repository</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    {project._id && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(project._id!)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] hover:text-rose-500 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
                        <span>Project Collaboration Chat</span>
                      </button>
                    )}

                    {!isCompleted && !isDisputed && (
                      <button
                        type="button"
                        onClick={() => onOpenDispute(contract)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Dispute / Report</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Freelancer actions */}
                    {!isCompleted && !isClient && (
                      <>
                        {(contract.status === 'active' || contract.status === 'in_revision') && (
                          <button
                            type="button"
                            onClick={() => onSubmitDeliverable(contract)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-rose-500 hover:to-rose-400 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{isInRevision ? 'Submit Revised Deliverables' : 'Submit Deliverables'}</span>
                          </button>
                        )}

                        {contract.status === 'active' && !hasDeliverables && (
                          <button
                            type="button"
                            onClick={() => setRejectModalContract(contract)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-300/40 cursor-pointer transition-colors"
                          >
                            <X className="h-3 w-3" />
                            <span>Decline Contract</span>
                          </button>
                        )}

                        {isSubmitted && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-400/20">
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            <span>Deliverables Under Client Review</span>
                          </div>
                        )}

                        {isDisputed && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-400/20">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Escrow Locked (Under Mediation)</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Client actions */}
                    {!isCompleted && isClient && (
                      <>
                        {isSubmitted && (
                          <>
                            <button
                              type="button"
                              onClick={() => onRequestRevision(contract)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Request Changes</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onCompleteContract(contract)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve Deliverables &amp; Release Escrow</span>
                            </button>
                          </>
                        )}

                        {contract.status === 'active' && (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs font-medium border border-[var(--border-subtle)]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Awaiting Specialist Deliverables</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRejectModalContract(contract)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-300/40 cursor-pointer transition-colors"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel &amp; Refund</span>
                            </button>
                          </div>
                        )}

                        {isInRevision && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-400/20">
                            <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                            <span>Revision Requested — Awaiting Updates</span>
                          </div>
                        )}

                        {isDisputed && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-400/20">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Escrow Locked (Under Mediation)</span>
                          </div>
                        )}
                      </>
                    )}

                    {isCompleted && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Award className="h-4 w-4" />
                        <span>Contract Completed &amp; Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline / Cancel Contract Modal */}
      {rejectModalContract && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isClient ? 'Withdraw Contract Offer' : 'Decline Contract Offer'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border-strong)] shadow-2xl relative">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  {isClient ? 'Withdraw / Cancel Contract Offer' : 'Decline Contract Offer'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {isClient
                    ? 'Cancel this contract and unlock escrow funds back to your balance.'
                    : 'Decline this contract offer and reopen the project brief for other talent.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectModalContract(null);
                  setRejectionReason('');
                }}
                className="rounded-xl p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                Reason for Declining (Optional note to counterparty)
              </label>

              {/* Quick reason chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Availability / Schedule Conflict',
                  'Scope / Timeline Misalignment',
                  'Budget / Rate Discrepancy',
                  'Need Further Discussion',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectionReason(chip)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      rejectionReason === chip
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Briefly explain why you are declining or cancelling this contract..."
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setRejectModalContract(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                Nevermind
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!rejectModalContract || !onRejectContract) return;
                  setIsSubmittingAction(true);
                  try {
                    await onRejectContract(rejectModalContract._id, rejectionReason.trim());
                    setRejectModalContract(null);
                    setRejectionReason('');
                  } finally {
                    setIsSubmittingAction(false);
                  }
                }}
                disabled={isSubmittingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmittingAction ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Confirm &amp; Decline Contract</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

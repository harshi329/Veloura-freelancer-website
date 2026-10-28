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
} from 'lucide-react';
import type { ContractItem, UserProfile } from '../../../shared/types.js';

interface DashboardContractsViewProps {
  user: UserProfile;
  contracts: ContractItem[];
  onSubmitDeliverable: (contract: ContractItem) => void;
  onCompleteContract: (contract: ContractItem) => void;
  onOpenChat: (projectId: string) => void;
}

export const DashboardContractsView: React.FC<DashboardContractsViewProps> = ({
  user,
  contracts,
  onSubmitDeliverable,
  onCompleteContract,
  onOpenChat,
}) => {
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'completed'>('all');

  const isClient = user.role === 'client';

  const filteredContracts = contracts.filter((c) => {
    if (tabFilter === 'active') return c.status === 'active';
    if (tabFilter === 'completed') return c.status === 'completed';
    return true;
  });

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
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {contract.status}
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
                      <span>{isCompleted ? 'Funds Released' : 'Locked in Escrow'}</span>
                    </span>
                  </div>
                </div>

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

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isClient && (
                      <button
                        type="button"
                        onClick={() => onSubmitDeliverable(contract)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-rose-500 hover:to-rose-400 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Deliverables</span>
                      </button>
                    )}

                    {!isCompleted && isClient && (
                      <button
                        type="button"
                        onClick={() => onCompleteContract(contract)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve Deliverables &amp; Release Escrow</span>
                      </button>
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
    </div>
  );
};

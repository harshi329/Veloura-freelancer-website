import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  ShieldCheck,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react';
import type { UserProfile, ProjectItem } from '../../shared/types.js';

interface HireSpecialistModalProps {
  freelancer: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  clientProjects?: ProjectItem[];
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: (contractId: string) => void;
}

export const HireSpecialistModal: React.FC<HireSpecialistModalProps> = ({
  freelancer,
  isOpen,
  onClose,
  clientProjects = [],
  apiFetch,
  showToast,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'existing' | 'direct'>('existing');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [agreedAmount, setAgreedAmount] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(14);
  const [coverNote, setCoverNote] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const openProjects = clientProjects.filter((p) => p.status === 'open');

  useEffect(() => {
    if (freelancer) {
      if (openProjects.length > 0) {
        setMode('existing');
        const first = openProjects[0];
        setSelectedProjectId(first._id);
        setAgreedAmount(first.budgetMax || first.budgetMin || 1000);
        setEstimatedDays(first.deadlineDays || 14);
      } else {
        setMode('direct');
        setAgreedAmount(freelancer.hourlyRate ? freelancer.hourlyRate * 20 : 1200);
        setEstimatedDays(14);
      }
      setCoverNote(`Hi ${freelancer.name}, I reviewed your verified portfolio and would like to hire you for this sprint!`);
      setCustomTitle(`Engineering Sprint with ${freelancer.name}`);
      setCustomDescription(`Commissioned deliverable focusing on ${freelancer.title || 'specialist deliverables'}.`);
    }
  }, [freelancer, openProjects.length]);

  if (!isOpen || !freelancer) return null;

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const proj = openProjects.find((p) => p._id === projId);
    if (proj) {
      setAgreedAmount(proj.budgetMax || proj.budgetMin || 1000);
      setEstimatedDays(proj.deadlineDays || 14);
    }
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === 'existing' && !selectedProjectId) {
      showToast('Please select an open brief to award, or switch to Direct Commission.', 'error');
      return;
    }

    if (mode === 'direct' && (!customTitle.trim() || !customDescription.trim())) {
      showToast('Please specify a title and scope description for this sprint.', 'error');
      return;
    }

    if (agreedAmount <= 0) {
      showToast('Please provide a valid contract budget amount.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        freelancerId: freelancer._id,
        agreedAmount: Number(agreedAmount),
        estimatedDays: Number(estimatedDays),
        coverNote: coverNote.trim(),
      };

      if (mode === 'existing') {
        payload.projectId = selectedProjectId;
      } else {
        payload.title = customTitle.trim();
        payload.description = customDescription.trim();
      }

      const res = await apiFetch<{
        success: boolean;
        message: string;
        contract: { _id: string };
      }>('/api/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      showToast(res.message || `Successfully hired ${freelancer.name}!`, 'success');
      onClose();
      if (onSuccess && res.contract?._id) {
        onSuccess(res.contract._id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to hire specialist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = freelancer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Hire ${freelancer.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="veloura-surface max-w-xl w-full max-h-[92svh] overflow-y-auto p-5 sm:p-7 space-y-5 rounded-3xl border border-[var(--border-strong)] shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3.5">
            {freelancer.avatarUrl ? (
              <img
                src={freelancer.avatarUrl}
                alt={freelancer.name}
                className="h-13 w-13 rounded-2xl object-cover ring-2 ring-rose-500/30 shrink-0"
              />
            ) : (
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white shadow-xs">
                {initials}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Select &amp; Commission Specialist</span>
              </div>
              <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                Hire {freelancer.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {freelancer.title} · ${freelancer.hourlyRate || 95}/hr
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'existing'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Award Open Brief ({openProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'direct'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Instant Direct Commission
          </button>
        </div>

        <form onSubmit={handleHireSubmit} className="space-y-4">
          {mode === 'existing' ? (
            <div className="space-y-3">
              {openProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-rose-500/30 p-4 text-center space-y-2 bg-rose-500/5">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    You don't have any open project briefs at the moment.
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Switch to <strong>Instant Direct Commission</strong> to hire {freelancer.name} immediately with a custom scope.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('direct')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <span>Switch to Direct Commission</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">
                    Select Your Open Project Brief
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                  >
                    {openProjects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} (${p.budgetMin?.toLocaleString()} – ${p.budgetMax?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  Sprint / Commission Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Web Application Sprint"
                  required
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                  Sprint Scope &amp; Target Deliverables
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Outline the core technical deliverables, tech stack, and goals..."
                  required
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Budget & Timeline Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                Agreed Contract Budget ($ USD)
              </label>
              <div className="relative flex items-center">
                <DollarSign className="h-3.5 w-3.5 text-rose-500 absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={agreedAmount || ''}
                  onChange={(e) => setAgreedAmount(Number(e.target.value))}
                  placeholder="1000"
                  required
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-8 pr-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                Estimated Timeline (Days)
              </label>
              <div className="relative flex items-center">
                <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={estimatedDays || ''}
                  onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  placeholder="14"
                  required
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-8 pr-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Cover Note */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">
              Direct Message / Welcome Note to Specialist
            </label>
            <textarea
              rows={2}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Add any specific instructions or kick-off greetings..."
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Escrow Guarantee Notice */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Protected by Velora Escrow:</strong> Your funds remain secured in smart escrow and will only be released once you inspect and approve the submitted deliverables.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || (mode === 'existing' && openProjects.length === 0)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Securing Contract...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirm &amp; Award Contract (${agreedAmount.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

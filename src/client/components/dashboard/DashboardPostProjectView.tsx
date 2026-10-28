import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Clock,
  Layers,
  Trash2,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import type { UserProfile, ProjectItem, MilestoneItem } from '../../../shared/types.js';

interface DashboardPostProjectViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  onProjectCreated: (newProject: ProjectItem) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPostProjectView: React.FC<DashboardPostProjectViewProps> = ({
  user,
  apiFetch,
  onProjectCreated,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Full-Stack Development');
  const [skillsText, setSkillsText] = useState('React, TypeScript, TailwindCSS, Node.js');
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3500);
  const [deadlineDays, setDeadlineDays] = useState(21);
  const [experienceLevel, setExperienceLevel] = useState<'mid' | 'senior' | 'principal'>('senior');
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { title: 'Sprint 1: Architecture, Data Models & Core APIs', amount: 1500, dueDays: 7 },
    { title: 'Sprint 2: Front-End Execution & Design System Polish', amount: 2000, dueDays: 21 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}: Final Integration & QA`,
        amount: 1000,
        dueDays: 28,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneItem,
    value: string | number
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      showToast('Title must be at least 5 characters.', 'error');
      return;
    }
    if (summary.trim().length < 10) {
      showToast('Executive summary must be at least 10 characters.', 'error');
      return;
    }
    if (description.trim().length < 20) {
      showToast('Detailed requirements must be at least 20 characters.', 'error');
      return;
    }

    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      showToast('Specify at least one required skill.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch<{ project: ProjectItem }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          category,
          requiredSkills: skills,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          budgetType,
          deadlineDays: Number(deadlineDays),
          experienceLevel,
          milestones,
        }),
      });

      showToast(`Project "${res.project.title}" created successfully!`, 'success');
      onProjectCreated(res.project);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Curated Commission Studio</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Post a New Project
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Publish your project to Veloura&apos;s network of verified specialists. Proposals will arrive in your Proposals inbox.
        </p>
      </div>

      {/* Creation Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-sm"
      >
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Project Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next.js 15 Luxury E-Commerce Platform with Stripe Treasury"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Category & Experience Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
            >
              <option value="Full-Stack Development">Full-Stack Development</option>
              <option value="UI/UX & Product Design">UI/UX &amp; Product Design</option>
              <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="DevOps & Cloud Systems">DevOps &amp; Cloud Systems</option>
              <option value="Smart Contracts & Web3">Smart Contracts &amp; Web3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Target Specialist Tier
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as 'mid' | 'senior' | 'principal')}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
            >
              <option value="principal">Principal (Architectural Mastery &amp; Strategy)</option>
              <option value="senior">Senior (Independent Full-Lifecycle Delivery)</option>
              <option value="mid">Mid-Level (Solid Implementation Execution)</option>
            </select>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Executive Summary (Brief Overview) *
          </label>
          <input
            type="text"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="High-level 1-line mission statement of the initiative..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Detailed Scope */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Comprehensive Scope &amp; Acceptance Criteria *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the technical specifications, integrations, performance targets, and security expectations..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Required Technical Skills (comma-separated) *
          </label>
          <input
            type="text"
            required
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, TypeScript, GraphQL, PostgreSQL, TailwindCSS"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Budget & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Minimum Budget ($)
            </label>
            <input
              type="number"
              min={50}
              required
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Maximum Budget ($)
            </label>
            <input
              type="number"
              min={50}
              required
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Estimated Timeline (Days)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              required
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm font-semibold"
            />
          </div>
        </div>

        {/* Milestone Decomposition */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Structured Milestones ({milestones.length})
            </label>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Sprint Milestone</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
              >
                <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  required
                  value={m.title}
                  onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                  placeholder="Milestone Deliverable Title"
                  className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3 py-1.5 text-xs font-medium"
                />
                <div className="w-28 relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-[var(--text-muted)]">$</span>
                  <input
                    type="number"
                    min={10}
                    required
                    value={m.amount}
                    onChange={(e) => handleMilestoneChange(idx, 'amount', Number(e.target.value))}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 pl-6 pr-2 py-1.5 text-xs font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(idx)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Publish Project Now</span>
          </button>
        </div>
      </form>
    </div>
  );
};

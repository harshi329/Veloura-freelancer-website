import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type { ProjectItem, ExperienceLevel, MilestoneItem } from '../../shared/types.js';
import { PageTitle, SectionHeading, Eyebrow, SupportText } from '../components/Typography.js';

export const NewProjectPage: React.FC = () => {
  const { user, apiFetch, showToast } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Design Systems & FinTech');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Design Systems, TailwindCSS');
  const [budgetMin, setBudgetMin] = useState(7500);
  const [budgetMax, setBudgetMax] = useState(11000);
  const [deadlineDays, setDeadlineDays] = useState(21);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('senior');
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { title: 'Phase 1 — Architecture & Design System Foundations', amount: 4000, dueDays: 8 },
    { title: 'Phase 2 — Production Implementation & Verification', amount: 6000, dueDays: 21 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!user || (user.role !== 'client' && user.role !== 'admin')) {
    return (
      <div className="veloura-container py-16 text-center space-y-4">
        <PageTitle>Client Role Required</PageTitle>
        <SupportText className="mx-auto">
          Only verified Client or Admin accounts can publish new marketplace briefs.
        </SupportText>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (requiredSkills.length === 0) {
      showToast('Please provide at least one required skill.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ project: ProjectItem }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          summary,
          description,
          category,
          requiredSkills,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          budgetType: 'fixed',
          deadlineDays: Number(deadlineDays),
          experienceLevel,
          milestones,
        }),
      });
      showToast('Project brief published to MongoDB!', 'success');
      navigate(`/projects/${res.project._id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish brief', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="veloura-container py-10 sm:py-14">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
          <Eyebrow>Commission a Sprint</Eyebrow>
          <PageTitle>Publish a Structured Project Brief</PageTitle>
          <SupportText>
            Define your technical stack, budget band, and milestone deliverables to immediately
            score and rank matching specialists.
          </SupportText>
        </div>

        <div className="veloura-surface p-6 sm:p-8 space-y-5">
          <SectionHeading>Scope &amp; Requirements</SectionHeading>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              minLength={5}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multi-Brand Design System & Fluid Typography Overhaul"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-3 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Domain Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="Design Systems & FinTech">Design Systems &amp; FinTech</option>
                <option value="AI & LLM Engineering">AI &amp; LLM Engineering</option>
                <option value="Brand & Editorial UI">Brand &amp; Editorial UI</option>
                <option value="Backend & Distributed Systems">
                  Backend &amp; Distributed Systems
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Required Seniority Tier
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="mid">Mid-Level Specialist</option>
                <option value="senior">Senior Specialist</option>
                <option value="principal">Principal / Staff Architect</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Executive Summary (1–2 sentences)
            </label>
            <input
              type="text"
              required
              minLength={10}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Concise summary displayed on marketplace cards..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Detailed Architectural Specification &amp; Deliverables
            </label>
            <textarea
              rows={4}
              required
              minLength={20}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the technical context, performance targets, and acceptance criteria..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Required Skills (Comma-Separated — Used by Explainable Match Engine)
            </label>
            <input
              type="text"
              required
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Minimum Budget ($ USD)
              </label>
              <input
                type="number"
                min={100}
                required
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Maximum Budget ($ USD)
              </label>
              <input
                type="number"
                min={100}
                required
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Target Delivery (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Milestones Editor */}
        <div className="veloura-surface p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading>Milestone Schedule</SectionHeading>
            <button
              type="button"
              onClick={() =>
                setMilestones([
                  ...milestones,
                  { title: `Milestone ${milestones.length + 1}`, amount: 2500, dueDays: 14 },
                ])
              }
              className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="veloura-elevated p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) =>
                      setMilestones(
                        milestones.map((item, i) =>
                          i === idx ? { ...item, title: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Milestone title"
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) =>
                      setMilestones(
                        milestones.map((item, i) =>
                          i === idx ? { ...item, amount: Number(e.target.value) } : item
                        )
                      )
                    }
                    placeholder="Amount ($)"
                    className="type-numeric w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs sm:text-sm font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={m.dueDays}
                    onChange={(e) =>
                      setMilestones(
                        milestones.map((item, i) =>
                          i === idx ? { ...item, dueDays: Number(e.target.value) } : item
                        )
                      )
                    }
                    placeholder="Days"
                    className="type-numeric w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                    aria-label="Remove milestone"
                    className="text-rose-500 hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-rose)] px-7 py-3.5 type-btn text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{submitting ? 'Publishing Brief...' : 'Publish Brief to Marketplace'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};

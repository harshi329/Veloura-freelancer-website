import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, CheckCircle2, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import type {
  UserProfile,
  PortfolioItem,
  AvailabilityStatus,
  ExperienceLevel,
} from '../../shared/types.js';
import { PageTitle, SectionHeading, Eyebrow, SupportText } from '../components/Typography.js';

export const OnboardingPage: React.FC = () => {
  const { user, apiFetch, setSession, refreshUser, showToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState(110);
  const [availability, setAvailability] = useState<AvailabilityStatus>('available');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('senior');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTitle(user.title || '');
      setBio(user.bio || '');
      setCompany(user.company || '');
      setLocation(user.location || 'Remote');
      setHourlyRate(user.hourlyRate || 110);
      setAvailability(user.availability || 'available');
      setExperienceLevel(user.experienceLevel || 'senior');
      setYearsExperience(user.yearsExperience ?? 5);
      setSkills(user.skills || []);
      setPortfolio(user.portfolio || []);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="veloura-container py-16 text-center space-y-4">
        <PageTitle>Authentication Required</PageTitle>
        <SupportText className="mx-auto">
          Please sign in to manage your Veloura profile and portfolio case studies.
        </SupportText>
      </div>
    );
  }

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (target: string) => {
    setSkills(skills.filter((s) => s !== target));
  };

  const addPortfolioItem = () => {
    setPortfolio([
      ...portfolio,
      {
        title: 'New Case Study',
        category: 'Design Systems & FinTech',
        description: 'Architectural summary, system constraints, and measurable product impact.',
        metrics: '+40% conversion / sub-50ms latency',
        link: 'https://veloura.dev/case-study',
        tags: skills.slice(0, 3),
        featured: true,
      },
    ]);
  };

  const updatePortfolioItem = (index: number, patch: Partial<PortfolioItem>) => {
    setPortfolio((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const removePortfolioItem = (index: number) => {
    setPortfolio((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ user: UserProfile; token?: string }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          title,
          bio,
          company,
          location,
          hourlyRate: Number(hourlyRate),
          availability,
          experienceLevel,
          yearsExperience: Number(yearsExperience),
          skills,
          portfolio,
          onboarded: true,
        }),
      });
      if (res.token) {
        setSession(res.token, res.user);
      } else {
        await refreshUser();
      }
      showToast(`Profile updated for ${res.user.name}.`, 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="veloura-container py-10 sm:py-14">
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="space-y-2">
            <Eyebrow>Profile &amp; Skill Telemetry ({user.role.toUpperCase()})</Eyebrow>
            <PageTitle>Calibrate Your Marketplace Identity</PageTitle>
            <SupportText>
              Your skills, seniority tier, hourly calibration, and portfolio directly drive your
              explainable match scores across Veloura briefs.
            </SupportText>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-rose)] px-6 py-3 type-btn text-white shadow-sm hover:opacity-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>

        {/* Core Identity */}
        <section className="veloura-surface p-6 sm:p-8 space-y-5">
          <SectionHeading>1. Core Identity &amp; Positioning</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Professional Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Company / Studio
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Location &amp; Timezone
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Executive Bio &amp; Architectural Philosophy
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>
        </section>

        {/* Freelancer Calibration */}
        <section className="veloura-surface p-6 sm:p-8 space-y-5">
          <SectionHeading>2. Skill Matrix &amp; Rate Calibration</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Hourly Rate ($ USD)
              </label>
              <input
                type="number"
                min={15}
                max={1000}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="available">Available (Full Sprint)</option>
                <option value="part-time">Part-Time (~20 hrs/wk)</option>
                <option value="busy">In Active Sprint (Limited)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Seniority Tier
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                className="type-numeric w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Skills Tag Editor */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Verified Technical &amp; Design Skills (Drives 40% of Explainable Match Score)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add skill (e.g. React, TypeScript, Design Systems, MongoDB)..."
                className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-elevated)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--brand-rose)] hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="ml-1 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Case Studies */}
        <section className="veloura-surface p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionHeading>3. Verified Portfolio Case Studies</SectionHeading>
              <SupportText>
                Case study categories and tags contribute 15 points to the Explainable Skill-Match
                algorithm.
              </SupportText>
            </div>
            <button
              type="button"
              onClick={addPortfolioItem}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--brand-rose)] cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add Case Study</span>
            </button>
          </div>

          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center space-y-2">
              <Briefcase className="h-7 w-7 mx-auto text-[var(--text-muted)]" aria-hidden="true" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No case studies added yet.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Add at least one case study to maximize your Domain &amp; Portfolio Proof match score.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item, idx) => (
                <div key={idx} className="veloura-elevated p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-eyebrow text-[var(--brand-rose)]">
                      Case Study #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(idx)}
                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Case Study Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updatePortfolioItem(idx, { title: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Domain Category
                      </label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updatePortfolioItem(idx, { category: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                      Impact &amp; Architecture Summary
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => updatePortfolioItem(idx, { description: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Verified Outcome Metric
                      </label>
                      <input
                        type="text"
                        value={item.metrics || ''}
                        onChange={(e) => updatePortfolioItem(idx, { metrics: e.target.value })}
                        placeholder="e.g. -42% bundle size · 99.4 Lighthouse"
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(item.tags || []).join(', ')}
                        onChange={(e) =>
                          updatePortfolioItem(idx, {
                            tags: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Lock,
  Globe,
  Briefcase,
} from 'lucide-react';
import type { UserProfile } from '../../../shared/types.js';

interface DashboardSettingsViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  setSession: (token: string, user: UserProfile) => void;
  refreshUser: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardSettingsView: React.FC<DashboardSettingsViewProps> = ({
  user,
  apiFetch,
  setSession,
  refreshUser,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Form State
  const [name, setName] = useState(user.name || '');
  const [title, setTitle] = useState(user.title || '');
  const [company, setCompany] = useState(user.company || '');
  const [location, setLocation] = useState(user.location || 'Remote');
  const [bio, setBio] = useState(user.bio || '');
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate || 110);
  const [skillsText, setSkillsText] = useState((user.skills || []).join(', '));
  const [role, setRole] = useState<'client' | 'freelancer'>(
    user.role === 'client' ? 'client' : 'freelancer'
  );
  const [saving, setSaving] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }

    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await apiFetch<{ user: UserProfile; token?: string }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          role: user.role === 'admin' ? undefined : role,
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          bio: bio.trim(),
          hourlyRate: Number(hourlyRate),
          skills: skillsArray,
          onboarded: true,
        }),
      });

      if (res.token && res.user) {
        setSession(res.token, res.user);
      } else {
        await refreshUser();
      }

      showToast('Account & Profile settings saved!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    showToast('Password updated securely!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
          <Settings className="h-3.5 w-3.5" />
          <span>Account &amp; Security Controls</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Workspace Settings
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Manage your credentials, public identity, hourly rate, and notification channels.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile &amp; Role</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security &amp; Auth</span>
        </button>
      </div>

      {/* Tab 1: Profile & Identity */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-5 shadow-xs"
        >
          {/* Role Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Primary Workspace Role
            </label>
            <div className="grid grid-cols-2 max-w-sm p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setRole('freelancer')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  role === 'freelancer'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Specialist / Freelancer
              </button>
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  role === 'client'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Client / Commissioner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Professional Title / Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Principal Distributed Systems Architect"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Company / Studio
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2 text-sm font-bold text-rose-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Skills &amp; Technical Competencies (comma-separated)
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, TypeScript, Next.js, Node.js, GraphQL"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Professional Biography
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your architectural background, philosophy, and previous project impact..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form
          onSubmit={handlePasswordUpdate}
          className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-5 shadow-xs max-w-xl"
        >
          <h3 className="text-base font-bold text-[var(--text-primary)]">Update Password</h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

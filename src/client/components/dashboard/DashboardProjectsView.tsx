import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  DollarSign,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { ProjectItem, ProposalItem, UserProfile } from '../../../shared/types.js';

interface DashboardProjectsViewProps {
  user: UserProfile;
  projects: ProjectItem[];
  proposals: ProposalItem[];
  onSelectProjectProposals: (projectId: string) => void;
  onOpenProjectChat: (projectId: string) => void;
  onNavigatePost: () => void;
}

export const DashboardProjectsView: React.FC<DashboardProjectsViewProps> = ({
  user,
  projects,
  proposals,
  onSelectProjectProposals,
  onOpenProjectChat,
  onNavigatePost,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isClient = user.role === 'client';

  const myProjects = isClient
    ? projects.filter((p) => {
        const clientVal = typeof p.client === 'object' && p.client !== null ? (p.client as { _id?: string })._id : p.client;
        return String(clientVal) === String(user._id);
      })
    : projects;

  const displayProjects = myProjects.length > 0 ? myProjects : projects;

  const filteredProjects = displayProjects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.requiredSkills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const getProposalCount = (projectId: string) => {
    return proposals.filter((prop) => {
      const pId = typeof prop.projectId === 'object' && prop.projectId !== null
        ? (prop.projectId as { _id?: string })._id
        : prop.projectId;
      return String(pId) === String(projectId);
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {isClient ? 'My Projects' : 'Projects Directory'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Manage your project lifecycles, active milestones, and candidate pipelines.
          </p>
        </div>

        {isClient && (
          <button
            type="button"
            onClick={onNavigatePost}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Post a Project</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((tab) => (
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
              {tab === 'in_progress' ? 'In Progress' : tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-3">
          <Briefcase className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Projects Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {isClient
              ? 'You have not created any projects matching this filter yet. Commission a new initiative to begin.'
              : 'No projects match your current filter query.'}
          </p>
          {isClient && (
            <button
              type="button"
              onClick={onNavigatePost}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-rose)] px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Post a Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const proposalCount = getProposalCount(project._id);

            return (
              <div
                key={project._id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 hover:border-rose-400/40 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-300/30">
                      {project.category}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        project.status === 'open'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : project.status === 'in_progress'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-500/15 text-purple-600'
                      }`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-2">
                    {project.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {project.summary || project.description}
                  </p>

                  {/* Skills Pills */}
                  {project.requiredSkills && project.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.requiredSkills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <DollarSign className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        ${project.budgetMin.toLocaleString()} – ${project.budgetMax.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <Clock className="h-3.5 w-3.5 text-rose-500" />
                      <span>{project.deadlineDays} Days</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectProjectProposals(project._id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Proposals ({proposalCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenProjectChat(project._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-primary)] hover:border-rose-400 cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
                    <span>Open Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

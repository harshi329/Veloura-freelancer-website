import React from 'react';

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const PageTitle: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Tag = 'h1',
}) => <Tag className={`type-page-title text-[var(--text-primary)] ${className}`}>{children}</Tag>;

export const SectionHeading: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Tag = 'h2',
}) => (
  <Tag className={`type-section-heading text-[var(--text-primary)] ${className}`}>{children}</Tag>
);

export const CardHeading: React.FC<HeadingProps> = ({
  children,
  className = '',
  as: Tag = 'h3',
}) => <Tag className={`type-card-heading text-[var(--text-primary)] ${className}`}>{children}</Tag>;

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`type-eyebrow text-[var(--brand-rose)] ${className}`}>{children}</p>;

export const BodyText: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`type-body text-[var(--text-secondary)] ${className}`}>{children}</p>;

export const SupportText: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`type-support ${className}`}>{children}</p>;

export const NumericStat: React.FC<{
  value: string | number;
  label: string;
  sublabel?: string;
  className?: string;
}> = ({ value, label, sublabel, className = '' }) => (
  <div className={`veloura-surface p-4 sm:p-5 ${className}`}>
    <p className="type-eyebrow text-[var(--text-muted)] mb-1.5">{label}</p>
    <p className="type-numeric text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
      {value}
    </p>
    {sublabel && <p className="text-xs text-[var(--text-muted)] mt-1">{sublabel}</p>}
  </div>
);

export const DemoBadge: React.FC<{ show?: boolean }> = ({ show = true }) => {
  if (!show) return null;
  return (
    <span
      title="Curated demonstration record"
      className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
    >
      Demo Data
    </span>
  );
};

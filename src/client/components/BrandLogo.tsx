import React from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  layout?: 'row' | 'col';
  variant?: 'default' | 'on-dark' | 'on-light';
}

/**
 * 3D Metallic Rose-Gold & Garnet Crest Emblem
 */
export const BrandCrest: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const dimMap = {
    xs: 'w-6 h-6 rounded-full',
    sm: 'w-8 h-8 sm:w-9 sm:h-9 rounded-full',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-full',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-full',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-full',
  };

  return (
    <div
      className={`relative ${dimMap[size]} overflow-hidden border border-rose-400/35 dark:border-rose-400/40 bg-[#16080e] shadow-md shadow-rose-950/40 shrink-0 group-hover:border-rose-300 dark:group-hover:border-rose-300 transition-all duration-300 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <img
        src="/images/veloura-crest.png"
        alt="Veloura Emblem"
        className="w-full h-full object-cover select-none pointer-events-none scale-105"
        loading="eager"
      />
      {/* Subtle Specular Ambient Rim */}
      <div className="absolute inset-0 rounded-inherit border border-white/20 pointer-events-none" />
    </div>
  );
};

/**
 * Couture Luxury Wordmark: "VELOURA" with Sparkle-Diamond "O" + "TALENT MEETS OPPORTUNITY"
 */
export const BrandWordmark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
  variant?: 'default' | 'on-dark' | 'on-light';
}> = ({
  size = 'md',
  showSubtitle = true,
  subtitle = 'TALENT MEETS OPPORTUNITY',
  className = '',
  align = 'left',
  variant = 'default',
}) => {
  const titleSizeMap = {
    xs: 'text-xs sm:text-sm tracking-[0.12em] sm:tracking-[0.14em]',
    sm: 'text-sm sm:text-base tracking-[0.14em] sm:tracking-[0.16em]',
    md: 'text-lg sm:text-xl tracking-[0.16em] sm:tracking-[0.18em]',
    lg: 'text-2xl sm:text-3xl tracking-[0.18em] sm:tracking-[0.2em]',
    xl: 'text-3xl sm:text-4xl tracking-[0.2em] sm:tracking-[0.22em]',
  };

  const subSizeMap = {
    xs: 'text-[5.5px] tracking-[0.06em]',
    sm: 'text-[6px] sm:text-[6.5px] tracking-[0.06em] sm:tracking-[0.08em]',
    md: 'text-[7px] sm:text-[8px] tracking-[0.08em] sm:tracking-[0.1em]',
    lg: 'text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.13em]',
    xl: 'text-[11.5px] sm:text-[13px] tracking-[0.12em] sm:tracking-[0.15em]',
  };

  const titleGradient =
    variant === 'on-dark'
      ? 'veloura-wordmark-title-on-dark'
      : variant === 'on-light'
      ? 'veloura-wordmark-title-on-light'
      : 'veloura-wordmark-title';

  const subGradient =
    variant === 'on-dark'
      ? 'veloura-wordmark-subtitle-on-dark'
      : variant === 'on-light'
      ? 'veloura-wordmark-subtitle-on-light'
      : 'veloura-wordmark-subtitle';

  const diamondColor =
    variant === 'on-dark'
      ? 'veloura-wordmark-diamond-on-dark'
      : variant === 'on-light'
      ? 'veloura-wordmark-diamond-on-light'
      : 'veloura-wordmark-diamond';

  return (
    <div
      className={`inline-flex flex-col leading-none shrink-0 whitespace-nowrap select-none overflow-visible ${
        align === 'center' ? 'items-center text-center' : 'items-start text-left'
      } ${className}`}
    >
      {/* VELOURA: Guaranteed never to wrap or break */}
      <span
        style={{ fontFamily: "'Cinzel', 'DM Serif Display', Georgia, serif" }}
        className={`font-bold uppercase select-none transition-all duration-300 whitespace-nowrap inline-flex items-center shrink-0 leading-none ${titleSizeMap[size]} ${titleGradient} group-hover:opacity-95`}
      >
        <span className="whitespace-nowrap">VEL</span>
        {/* Diamond Star embedded in the 'O' matching the official emblem */}
        <span className="relative inline-flex items-center justify-center mx-[0.02em] whitespace-nowrap shrink-0">
          <span>O</span>
          <span
            className={`absolute inset-0 flex items-center justify-center text-[0.42em] ${diamondColor} pointer-events-none select-none font-sans transform -translate-y-[0.04em]`}
            aria-hidden="true"
          >
            ✦
          </span>
        </span>
        <span className="whitespace-nowrap">URA</span>
      </span>

      {/* Second Image Words: "TALENT MEETS OPPORTUNITY" (or custom subtitle) */}
      {showSubtitle && subtitle && (
        <span
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
          className={`font-bold uppercase select-none transition-colors duration-300 mt-1 whitespace-nowrap shrink-0 leading-none overflow-visible ${subSizeMap[size]} ${subGradient}`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

/**
 * Universal BrandLogo Component
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = true,
  subtitle = 'TALENT MEETS OPPORTUNITY',
  className = '',
  layout = 'row',
  variant = 'default',
}) => {
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap ${
        layout === 'col' ? 'flex-col items-center text-center gap-2.5 sm:gap-3' : 'items-center gap-2.5 sm:gap-3'
      } select-none group cursor-pointer ${className}`}
    >
      <BrandCrest size={size} />

      {showWordmark && (
        <BrandWordmark
          size={size}
          showSubtitle={showSubtitle}
          subtitle={subtitle}
          align={layout === 'col' ? 'center' : 'left'}
          variant={variant}
        />
      )}
    </span>
  );
};

export const StarGlyph: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-6 h-6',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z"
      fill="currentColor"
    />
  </svg>
);

export const BrandedLoadingScreen: React.FC<{ label?: string }> = ({
  label = 'Calibrating curated marketplace & skill-matching engine...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-canvas)] px-6 text-center"
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{ animation: 'velouraWordmarkPulse 2.2s var(--ease-out-expo) infinite' }}
      >
        <BrandCrest size="xl" className="shadow-2xl shadow-rose-950/60 ring-2 ring-rose-500/30" />
        <BrandWordmark
          size="lg"
          align="center"
          subtitle="TALENT MEETS OPPORTUNITY"
        />
      </div>
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-rose-700 animate-pulse" />
      </div>
      <p className="mt-4 text-xs text-[var(--text-muted)] max-w-xs">{label}</p>
    </div>
  );
};

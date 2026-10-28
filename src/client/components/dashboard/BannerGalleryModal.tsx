import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, RotateCcw, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import { VELOURA_BANNERS, DEFAULT_VELOURA_BANNER, VelouraBannerPreset } from '../../data/velouraPresets.js';

interface BannerGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string;
  onApplyBanner: (bannerUrl: string) => Promise<void> | void;
  userName?: string;
  userTitle?: string;
  userAvatarUrl?: string;
}

type CategoryFilter = 'all' | 'branded' | 'workspace' | 'scenic' | 'abstract' | 'minimal' | 'light' | 'dark';

export const BannerGalleryModal: React.FC<BannerGalleryModalProps> = ({
  isOpen,
  onClose,
  currentBannerUrl,
  onApplyBanner,
  userName = 'Harshitha Lakshmi',
  userTitle = 'Full Stack Developer & Cybersecurity Enthusiast',
  userAvatarUrl = '/images/presets/avatar_veloura_dark_ribbon_girl.png'
}) => {
  // Temporary selection inside modal before user hits "Apply Cover"
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string>(
    currentBannerUrl || DEFAULT_VELOURA_BANNER
  );
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [isApplying, setIsApplying] = useState(false);

  // Sync selection when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedBannerUrl(currentBannerUrl || DEFAULT_VELOURA_BANNER);
    }
  }, [isOpen, currentBannerUrl]);

  // Selected banner metadata for live preview
  const selectedBanner = useMemo(() => {
    return (
      VELOURA_BANNERS.find((b) => b.imageUrl === selectedBannerUrl) ||
      VELOURA_BANNERS[0]
    );
  }, [selectedBannerUrl]);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    if (activeCategory === 'all') return VELOURA_BANNERS;
    if (activeCategory === 'light') return VELOURA_BANNERS.filter((b) => b.theme === 'light');
    if (activeCategory === 'dark') return VELOURA_BANNERS.filter((b) => b.theme === 'dark');
    return VELOURA_BANNERS.filter((b) => b.category === activeCategory);
  }, [activeCategory]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: VELOURA_BANNERS.length,
      branded: VELOURA_BANNERS.filter((b) => b.category === 'branded').length,
      workspace: VELOURA_BANNERS.filter((b) => b.category === 'workspace').length,
      scenic: VELOURA_BANNERS.filter((b) => b.category === 'scenic').length,
      abstract: VELOURA_BANNERS.filter((b) => b.category === 'abstract').length,
      minimal: VELOURA_BANNERS.filter((b) => b.category === 'minimal').length,
      light: VELOURA_BANNERS.filter((b) => b.theme === 'light').length,
      dark: VELOURA_BANNERS.filter((b) => b.theme === 'dark').length
    };
  }, []);

  if (!isOpen) return null;

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApplyBanner(selectedBannerUrl);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = () => {
    setSelectedBannerUrl(currentBannerUrl || DEFAULT_VELOURA_BANNER);
    onClose();
  };

  const handleRestoreDefault = () => {
    setSelectedBannerUrl(DEFAULT_VELOURA_BANNER);
  };

  const categories: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Banners', count: counts.all },
    { id: 'branded', label: 'Veloura Collection', count: counts.branded },
    { id: 'workspace', label: 'Workspace', count: counts.workspace },
    { id: 'scenic', label: 'Scenic', count: counts.scenic },
    { id: 'abstract', label: 'Abstract', count: counts.abstract },
    { id: 'minimal', label: 'Minimal & Neutral', count: counts.minimal },
    { id: 'light', label: 'Light Mode', count: counts.light },
    { id: 'dark', label: 'Dark Mode', count: counts.dark }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-gallery-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl dark:shadow-[0_0_60px_rgba(255,77,121,0.35)] text-gray-900 dark:text-white overflow-hidden">
        
        {/* =========================================================================
            1. GALLERY HEADER
        ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-rose-200/80 dark:border-white/10 flex items-start justify-between gap-4 bg-gradient-to-b from-rose-50/50 to-transparent dark:from-white/[0.02] dark:to-transparent shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-gradient-to-r from-[#ff2a6d] to-[#ff6699] text-white shadow-xs">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h2 id="banner-gallery-title" className="text-lg sm:text-xl font-black text-gray-950 dark:text-white tracking-tight">
                Choose Your Cover
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
              Personalize your profile with a cover that reflects your style. ({counts.all} Official Designs)
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close Banner Gallery"
            className="p-2 rounded-full text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white hover:bg-rose-100/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            2. LIVE HEADER PREVIEW (Actual 5:1 Ratio In-Context Preview)
        ========================================================================= */}
        <div className="px-5 sm:px-6 pt-4 pb-3 bg-rose-50/30 dark:bg-black/30 border-b border-rose-200/60 dark:border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4d79]" />
              <span>Live Profile Cover Preview</span>
            </span>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate max-w-xs sm:max-w-md">
              {selectedBanner.name}
            </span>
          </div>

          <div className="relative aspect-[5/1] w-full rounded-2xl overflow-hidden border border-rose-300 dark:border-[#ff4d79]/40 bg-[#160812] shadow-inner">
            <img
              src={selectedBanner.imageUrl}
              alt={selectedBanner.alt}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Profile Avatar & Title Overlay Preview */}
            <div className="absolute bottom-2 left-3 sm:bottom-3 sm:left-4 flex items-center gap-2.5 sm:gap-3 pointer-events-none">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-white ring-2 ring-[#ff4d79] overflow-hidden shadow-lg bg-[#1f0a17] shrink-0">
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="text-white drop-shadow-md min-w-0">
                <div className="text-xs sm:text-sm font-extrabold truncate leading-tight">
                  {userName}
                </div>
                <div className="text-[10px] sm:text-xs text-rose-200 font-semibold truncate leading-tight opacity-90">
                  {userTitle}
                </div>
              </div>
            </div>

            {/* Selected Tag Indicator */}
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-3 flex items-center gap-1.5 pointer-events-none">
              <span className="text-[9px] uppercase font-bold text-white bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                {selectedBanner.tag}
              </span>
              <span className="text-[9px] uppercase font-bold text-rose-200 bg-[#ff4d79]/80 backdrop-blur-md px-2 py-0.5 rounded-full">
                {selectedBanner.theme}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. CATEGORY NAVIGATION TABS
        ========================================================================= */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-rose-200/80 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-[#12050e]">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff2a6d] to-[#ff4d79] text-white shadow-xs scale-102'
                    : 'bg-rose-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-rose-100/70 dark:hover:bg-white/10'
                }`}
              >
                {cat.id === 'light' && <Sun className="w-3 h-3 text-amber-400" />}
                {cat.id === 'dark' && <Moon className="w-3 h-3 text-rose-300" />}
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. GALLERY GRID (44 High-Fidelity 5:1 Banners)
        ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredBanners.map((banner: VelouraBannerPreset) => {
              const isSelected = selectedBannerUrl === banner.imageUrl;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setSelectedBannerUrl(banner.imageUrl)}
                  aria-label={`Select banner: ${banner.name}`}
                  className={`group relative rounded-2xl overflow-hidden border text-left transition-all cursor-pointer p-1.5 flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-[#ff4d79] ring-2 ring-[#ff4d79] bg-rose-50/70 dark:bg-[#ff4d79]/15 shadow-[0_0_15px_rgba(255,77,121,0.35)] scale-[1.01]'
                      : 'border-rose-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-rose-400 dark:hover:border-[#ff4d79]/50 hover:bg-rose-50/40 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Thumbnail (Exact 5:1 Aspect Ratio) */}
                  <div className="relative aspect-[5/1] w-full rounded-xl overflow-hidden bg-black/30">
                    <img
                      src={banner.thumbUrl}
                      alt={banner.alt}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#ff4d79] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Theme Badge */}
                    <span className="absolute bottom-1 right-1.5 text-[8px] font-bold text-white uppercase bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded">
                      {banner.theme}
                    </span>
                  </div>

                  {/* Card Title and Tag */}
                  <div className="px-1 flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-gray-950 dark:text-white truncate">
                        {banner.name}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                        {banner.tag}
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-[#ff4d79] text-white'
                        : 'bg-rose-100 dark:bg-white/10 text-rose-600 dark:text-rose-300'
                    }`}>
                      {isSelected ? 'Selected' : 'Choose'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            5. MODAL ACTIONS FOOTER
        ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-rose-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-[#0d030a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRestoreDefault}
              title="Restore Default Veloura Cover"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-[#ff4d79] hover:bg-rose-100/50 dark:hover:bg-white/5 transition-all cursor-pointer w-full sm:w-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isApplying}
              className="px-4 py-2 rounded-full border border-rose-200 dark:border-white/20 bg-white dark:bg-white/[0.04] text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-white/10 transition-all cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff2a6d] via-[#ff4d79] to-[#ff7597] text-white text-xs font-bold shadow-md shadow-rose-500/30 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isApplying ? 'Applying Cover...' : 'Apply Cover'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

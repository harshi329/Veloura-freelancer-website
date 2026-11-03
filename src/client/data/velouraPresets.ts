import bannersJson from './banners.json';

export interface VelouraBannerPreset {
  id: string;
  name: string;
  category: 'branded' | 'workspace' | 'scenic' | 'abstract' | 'minimal';
  theme: 'light' | 'dark';
  tag: string;
  imageUrl: string;
  thumbUrl: string;
  alt: string;
  aspectRatio: string;
}

export interface VelouraAvatarPreset {
  name: string;
  url: string;
  theme: 'light' | 'dark';
  category: 'signature' | 'girls' | 'guys' | 'aesthetic' | 'mascots';
  tag: string;
}

// 44 Official Veloura Panoramic Banners (5:1 Ratio, 2000x400 High-Res & 500x100 Thumbs)
export const VELOURA_BANNERS: VelouraBannerPreset[] = bannersJson as VelouraBannerPreset[];

// Default Veloura Banner (Dark Sakura Balcony)
export const DEFAULT_VELOURA_BANNER = VELOURA_BANNERS[0].imageUrl;

// Official Veloura High-Res Profile Avatars (512x512 Clean Circular Alpha Mask)
export const VELOURA_AVATARS: VelouraAvatarPreset[] = [
  {
    name: "Harshitha Ribbon Girl (Light)",
    url: "/images/presets/avatar_veloura_light_ribbon_girl.png",
    theme: "light",
    category: "signature",
    tag: "Veloura Signature"
  },
  {
    name: "Harshitha Ribbon Girl (Dark)",
    url: "/images/presets/avatar_veloura_dark_ribbon_girl.png",
    theme: "dark",
    category: "signature",
    tag: "Veloura Signature"
  },
  {
    name: "Gamer Girl with Headphones (Light)",
    url: "/images/presets/avatar_veloura_light_gamer_headphone_girl.png",
    theme: "light",
    category: "signature",
    tag: "Anime & Specialist"
  },
  {
    name: "Gamer Girl with Headphones (Dark)",
    url: "/images/presets/avatar_veloura_dark_gamer_headphone_girl.png",
    theme: "dark",
    category: "signature",
    tag: "Anime & Specialist"
  },
  {
    name: "Headphone Studio Cat (Light)",
    url: "/images/presets/avatar_veloura_light_headphone_white_cat.png",
    theme: "light",
    category: "signature",
    tag: "Mascot & Pet"
  },
  {
    name: "Headphone Studio Cat (Dark)",
    url: "/images/presets/avatar_veloura_dark_headphone_white_cat.png",
    theme: "dark",
    category: "signature",
    tag: "Mascot & Pet"
  },
  {
    name: "Good Code Developer Girl (Light)",
    url: "/images/presets/avatar_veloura_light_good_code_girl.png",
    theme: "light",
    category: "signature",
    tag: "Tech & Specialist"
  },
  {
    name: "Good Code Developer Girl (Dark)",
    url: "/images/presets/avatar_veloura_dark_good_code_girl.png",
    theme: "dark",
    category: "signature",
    tag: "Tech & Specialist"
  },
  {
    name: "Creative Architect with Glasses (Light)",
    url: "/images/presets/avatar_veloura_light_round_glasses_girl.png",
    theme: "light",
    category: "signature",
    tag: "Design & Creator"
  },
  {
    name: "Creative Architect with Glasses (Dark)",
    url: "/images/presets/avatar_veloura_dark_round_glasses_girl.png",
    theme: "dark",
    category: "signature",
    tag: "Design & Creator"
  },
  {
    name: "Veloura Rose Gold Crest (Light)",
    url: "/images/presets/avatar_veloura_light_rose_crest_v.png",
    theme: "light",
    category: "aesthetic",
    tag: "Veloura Brand"
  },
  {
    name: "Veloura Rose Gold Crest (Dark)",
    url: "/images/presets/avatar_veloura_dark_rose_crest_v.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Veloura Brand"
  },
  {
    name: "Mount Fuji Sakura Horizon (Light)",
    url: "/images/presets/avatar_veloura_light_fuji_sakura_landscape.png",
    theme: "light",
    category: "aesthetic",
    tag: "Scenic Landscape"
  },
  {
    name: "Mount Fuji Sakura Horizon (Dark)",
    url: "/images/presets/avatar_veloura_dark_fuji_sakura_landscape.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Scenic Landscape"
  },
  {
    name: "Pink Peonies Bloom Bouquet (Light)",
    url: "/images/presets/avatar_veloura_light_pink_peonies_bouquet.png",
    theme: "light",
    category: "aesthetic",
    tag: "Botanical Bloom"
  },
  {
    name: "Pink Peonies Bloom Bouquet (Dark)",
    url: "/images/presets/avatar_veloura_dark_pink_peonies_bouquet.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Botanical Bloom"
  },
  {
    name: "Sunset Horizon Girl Silhouette (Light)",
    url: "/images/presets/avatar_veloura_light_sunset_girl_silhouette.png",
    theme: "light",
    category: "girls",
    tag: "Sunset Horizon"
  },
  {
    name: "Sunset Horizon Girl Silhouette (Dark)",
    url: "/images/presets/avatar_veloura_dark_sunset_girl_silhouette.png",
    theme: "dark",
    category: "girls",
    tag: "Sunset Horizon"
  },
  {
    name: "Sky Melody Headphones Muse (Light)",
    url: "/images/presets/avatar_veloura_light_music_girl_sky.png",
    theme: "light",
    category: "girls",
    tag: "Melody & Sky"
  },
  {
    name: "Sky Melody Headphones Muse (Dark)",
    url: "/images/presets/avatar_veloura_dark_music_girl_sky.png",
    theme: "dark",
    category: "girls",
    tag: "Melody & Sky"
  },
  {
    name: "Veloura Rose Leaf Botanical (Light)",
    url: "/images/presets/avatar_veloura_light_rose_leaf_foliage.png",
    theme: "light",
    category: "aesthetic",
    tag: "Nature & Flora"
  },
  {
    name: "Veloura Rose Leaf Botanical (Dark)",
    url: "/images/presets/avatar_veloura_dark_rose_leaf_foliage.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Nature & Flora"
  },
  {
    name: "Rose Nebula Crescent Moon (Light)",
    url: "/images/presets/avatar_veloura_light_crescent_moon_pink.png",
    theme: "light",
    category: "aesthetic",
    tag: "Celestial Cosmic"
  },
  {
    name: "Rose Nebula Crescent Moon (Dark)",
    url: "/images/presets/avatar_veloura_dark_crescent_moon_pink.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Celestial Cosmic"
  },
  {
    name: "Veloura Artisan Coffee Cup (Light)",
    url: "/images/presets/avatar_veloura_light_coffee_cup_veloura.png",
    theme: "light",
    category: "aesthetic",
    tag: "Coffee & Cozy"
  },
  {
    name: "Veloura Artisan Coffee Cup (Dark)",
    url: "/images/presets/avatar_veloura_dark_coffee_cup_veloura.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Coffee & Cozy"
  },
  {
    name: "Cozy Laptop Studio Window (Light)",
    url: "/images/presets/avatar_veloura_light_desk_laptop_window.png",
    theme: "light",
    category: "aesthetic",
    tag: "Workspace Studio"
  },
  {
    name: "Cozy Laptop Studio Window (Dark)",
    url: "/images/presets/avatar_veloura_dark_desk_laptop_window.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Workspace Studio"
  },
  {
    name: "Black Cat at Evening Window (Light)",
    url: "/images/presets/avatar_veloura_light_black_cat_window.png",
    theme: "light",
    category: "aesthetic",
    tag: "Mascot & Pet"
  },
  {
    name: "Black Cat at Evening Window (Dark)",
    url: "/images/presets/avatar_veloura_dark_black_cat_window.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Mascot & Pet"
  },
  {
    name: "Spring Sakura Girl Profile (Light)",
    url: "/images/presets/avatar_veloura_light_cherry_blossom_silhouette.png",
    theme: "light",
    category: "girls",
    tag: "Sakura Blossom"
  },
  {
    name: "Spring Sakura Girl Profile (Dark)",
    url: "/images/presets/avatar_veloura_dark_cherry_blossom_silhouette.png",
    theme: "dark",
    category: "girls",
    tag: "Sakura Blossom"
  },
  {
    name: "Full Moon Sakura Lake (Light)",
    url: "/images/presets/avatar_veloura_light_full_moon_lake.png",
    theme: "light",
    category: "aesthetic",
    tag: "Scenic Landscape"
  },
  {
    name: "Full Moon Sakura Lake (Dark)",
    url: "/images/presets/avatar_veloura_dark_full_moon_lake.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Scenic Landscape"
  },
  {
    name: "Cherry Blossom Dew Drops (Light)",
    url: "/images/presets/avatar_veloura_light_macro_sakura_dew.png",
    theme: "light",
    category: "aesthetic",
    tag: "Botanical Bloom"
  },
  {
    name: "Cherry Blossom Dew Drops (Dark)",
    url: "/images/presets/avatar_veloura_dark_macro_sakura_dew.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Botanical Bloom"
  },
  {
    name: "Sunset Skyline Rooftop Girl",
    url: "/images/presets/avatar_veloura_sunset_skyline_girl.png",
    theme: "dark",
    category: "girls",
    tag: "Rooftop Twilight"
  },
  {
    name: "Night City Headphone Boy",
    url: "/images/presets/avatar_veloura_night_city_headphone_boy.png",
    theme: "dark",
    category: "signature",
    tag: "Cyber City Studio"
  },
  {
    name: "Cosmic Stargazing Girl",
    url: "/images/presets/avatar_veloura_cosmic_stargazing_girl.png",
    theme: "dark",
    category: "girls",
    tag: "Starlit Galaxy"
  },
  {
    name: "Meteor Sky Dreamer Boy",
    url: "/images/presets/avatar_veloura_meteor_sky_dreamer_boy.png",
    theme: "dark",
    category: "signature",
    tag: "Celestial Wonder"
  },
  {
    name: "Sunset Balcony Silhouette",
    url: "/images/presets/avatar_veloura_sunset_balcony_silhouette.png",
    theme: "dark",
    category: "girls",
    tag: "Golden Hour"
  },
  {
    name: "Black Cat Glowing Butterfly",
    url: "/images/presets/avatar_veloura_black_cat_glowing_butterfly.png",
    theme: "dark",
    category: "mascots",
    tag: "Mystic Familiar"
  },
  {
    name: "Moonlit Wolf Silhouette",
    url: "/images/presets/avatar_veloura_moonlit_wolf_silhouette.png",
    theme: "dark",
    category: "mascots",
    tag: "Lunar Guardian"
  },
  {
    name: "Cosmic Deep Space Astronaut",
    url: "/images/presets/avatar_veloura_deep_space_astronaut.png",
    theme: "dark",
    category: "signature",
    tag: "Orbit Explorer"
  },
  {
    name: "Sakura Night Moon Blossoms",
    url: "/images/presets/avatar_veloura_sakura_night_moon_blossoms.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Sakura Nocturne"
  },
  {
    name: "Alpine Sunset Mountain Peak",
    url: "/images/presets/avatar_veloura_alpine_sunset_peak.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Mountain Ridge"
  },
  {
    name: "Crescent Moon Ocean Waves",
    url: "/images/presets/avatar_veloura_crescent_moon_ocean.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Ocean Moonlight"
  },
  {
    name: "Twilight Cliff Cat Vista",
    url: "/images/presets/avatar_veloura_twilight_cliff_cat.png",
    theme: "dark",
    category: "mascots",
    tag: "Sunset Horizon"
  },
  {
    name: "Lofi Study Laptop Girl",
    url: "/images/presets/avatar_veloura_lofi_study_laptop_girl.png",
    theme: "dark",
    category: "girls",
    tag: "Late Night Focus"
  },
  {
    name: "Golden Crystal Lotus Bloom",
    url: "/images/presets/avatar_veloura_crystal_lotus_bloom.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Golden Petals"
  },
  {
    name: "Ringed Celestial Planet",
    url: "/images/presets/avatar_veloura_ringed_celestial_planet.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Golden Rings"
  },
  {
    name: "Ocean Sunset Cresting Wave",
    url: "/images/presets/avatar_veloura_sunset_cresting_wave.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Golden Tide"
  },
  {
    name: "Moonlit Pine Lake Reflection",
    url: "/images/presets/avatar_veloura_moonlit_pine_lake.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Pine Wilderness"
  },
  {
    name: "Cherry Blossom Pagoda Night",
    url: "/images/presets/avatar_veloura_cherry_blossom_pagoda.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Kyoto Twilight"
  },
  {
    name: "Rainy Cyberpunk Neon Alley",
    url: "/images/presets/avatar_veloura_cyberpunk_neon_alley.png",
    theme: "dark",
    category: "signature",
    tag: "Neon Rain"
  },
  {
    name: "Golden Coastal Village Sunset",
    url: "/images/presets/avatar_veloura_coastal_village_sunset.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Harbor Sunset"
  },
  {
    name: "Luminous Glass Butterfly",
    url: "/images/presets/avatar_veloura_luminous_glass_butterfly.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Crystal Wings"
  },
  {
    name: "Golden Metallic Autumn Leaf",
    url: "/images/presets/avatar_veloura_golden_metallic_leaf.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Kintsugi Botanical"
  },
  {
    name: "Cosmic Spiral Galaxy Core",
    url: "/images/presets/avatar_veloura_cosmic_spiral_galaxy.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Nebula Vortex"
  },
  {
    name: "Pink Moon Sakura Reflection",
    url: "/images/presets/avatar_veloura_pink_moon_sakura_lake.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Pink Blossom Lake"
  },
  {
    name: "Zen Stone Golden Halo",
    url: "/images/presets/avatar_veloura_zen_stone_golden_halo.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Zen Sanctuary"
  },
  {
    name: "Sunrise Mountain Mist Ridges",
    url: "/images/presets/avatar_veloura_sunrise_mist_mountains.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Morning Mist"
  },
  {
    name: "Cozy Bedroom Window Skyline",
    url: "/images/presets/avatar_veloura_cozy_bedroom_window.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Twilight Rest"
  },
  {
    name: "Flowing Golden Light Ribbons",
    url: "/images/presets/avatar_veloura_golden_light_ribbons.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Silk Spectrum"
  },
  {
    name: "Full Moon Cloud Haven",
    url: "/images/presets/avatar_veloura_full_moon_cloud_haven.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Lunar Canopy"
  },
  {
    name: "Soft White Spring Blossoms",
    url: "/images/presets/avatar_veloura_soft_white_blossoms.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Floral Bloom"
  },
  {
    name: "Sunbeam Woodland Forest Path",
    url: "/images/presets/avatar_veloura_sunbeam_forest_path.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Forest Canopy"
  },
  {
    name: "Emerald Aurora Glacial Lake",
    url: "/images/presets/avatar_veloura_emerald_aurora_lake.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Northern Lights"
  },
  {
    name: "Penthouse Balcony Night View",
    url: "/images/presets/avatar_veloura_penthouse_night_view.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Metropolis Heights"
  },
  {
    name: "Sunset Cloud Ocean Vista",
    url: "/images/presets/avatar_veloura_sunset_cloud_ocean.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Stratosphere Sunset"
  },
  {
    name: "Deep Sea Bioluminescent Jellyfish",
    url: "/images/presets/avatar_veloura_bioluminescent_jellyfish.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Abyssal Glow"
  },
  {
    name: "Glistening Shoreline Golden Hour",
    url: "/images/presets/avatar_veloura_glistening_shoreline.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Tidal Mirror"
  },
  {
    name: "Golden Ginkgo Dew Leaves",
    url: "/images/presets/avatar_veloura_golden_ginkgo_leaves.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Golden Foliage"
  },
  {
    name: "Floating Sky Lanterns River",
    url: "/images/presets/avatar_veloura_floating_lanterns_river.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Festival of Lights"
  },
  {
    name: "Snowy Pine Cabin Winter Night",
    url: "/images/presets/avatar_veloura_snowy_pine_cabin.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Winter Solitude"
  },
  {
    name: "Candlelit Window Tea & Book",
    url: "/images/presets/avatar_veloura_candlelit_window_tea.png",
    theme: "dark",
    category: "aesthetic",
    tag: "Cozy Reading"
  }
];

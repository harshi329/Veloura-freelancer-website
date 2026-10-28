import type { MatchBreakdown, MatchFactor, PortfolioItem, ExperienceLevel, AvailabilityStatus } from './types.js';

export interface MatchableFreelancer {
  skills: string[];
  hourlyRate: number;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  rating: number;
  completedProjects: number;
  completionRate: number;
  availability: AvailabilityStatus;
  portfolio: PortfolioItem[];
}

export interface MatchableProject {
  title?: string;
  category: string;
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  deadlineDays: number;
  experienceLevel: ExperienceLevel;
}

const SKILL_SYNONYMS: Record<string, string> = {
  reactjs: 'react',
  'react.js': 'react',
  nextjs: 'next.js',
  nodejs: 'node.js',
  node: 'node.js',
  ts: 'typescript',
  js: 'javascript',
  tailwind: 'tailwindcss',
  'tailwind css': 'tailwindcss',
  postgres: 'postgresql',
  mongo: 'mongodb',
  figma: 'figma',
  'design systems': 'design systems',
  'design system': 'design systems',
  'ui/ux': 'product design',
  'ux design': 'product design',
  'ui design': 'product design',
  llm: 'ai engineering',
  openai: 'ai engineering',
  gemini: 'ai engineering',
};

export function normalizeSkill(skill: string): string {
  const cleaned = skill.trim().toLowerCase();
  return SKILL_SYNONYMS[cleaned] ?? cleaned;
}

const LEVEL_RANK: Record<ExperienceLevel, number> = {
  mid: 1,
  senior: 2,
  principal: 3,
};

export function computeExplainableMatch(
  freelancer: MatchableFreelancer,
  project: MatchableProject,
  proposedBid?: number
): MatchBreakdown {
  const freelancerNormalizedMap = new Map<string, string>();
  for (const s of freelancer.skills || []) {
    freelancerNormalizedMap.set(normalizeSkill(s), s);
  }
  for (const item of freelancer.portfolio || []) {
    for (const tag of item.tags || []) {
      const norm = normalizeSkill(tag);
      if (!freelancerNormalizedMap.has(norm)) {
        freelancerNormalizedMap.set(norm, tag);
      }
    }
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of project.requiredSkills || []) {
    const normReq = normalizeSkill(reqSkill);
    let found = freelancerNormalizedMap.has(normReq);
    if (!found) {
      for (const [k] of freelancerNormalizedMap) {
        if (k.includes(normReq) || normReq.includes(k)) {
          found = true;
          break;
        }
      }
    }
    if (found) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  // 1. Skill Overlap (Max 40)
  const totalReq = Math.max((project.requiredSkills || []).length, 1);
  const skillRatio = matchedSkills.length / totalReq;
  const skillScore = Math.round(skillRatio * 40);
  const skillExplanation =
    matchedSkills.length === totalReq
      ? `Covers all ${totalReq} required skills (${matchedSkills.join(', ')}).`
      : matchedSkills.length > 0
      ? `Matches ${matchedSkills.length} of ${totalReq} required skills (${matchedSkills.join(', ')}); missing ${missingSkills.join(', ')}.`
      : `No direct overlap with required skills (${missingSkills.join(', ')}).`;

  // 2. Budget Alignment (Max 20)
  let budgetScore = 14;
  let budgetExplanation = '';
  const hourly = freelancer.hourlyRate || 95;

  if (project.budgetType === 'hourly') {
    if (hourly >= project.budgetMin && hourly <= project.budgetMax) {
      budgetScore = 20;
      budgetExplanation = `Hourly rate ($${hourly}/hr) sits directly inside the $${project.budgetMin}–$${project.budgetMax}/hr target band.`;
    } else if (hourly < project.budgetMin) {
      budgetScore = 18;
      budgetExplanation = `Hourly rate ($${hourly}/hr) is competitively below the $${project.budgetMin}/hr floor.`;
    } else {
      const overPct = (hourly - project.budgetMax) / Math.max(project.budgetMax, 1);
      budgetScore = Math.max(4, Math.round(20 - overPct * 35));
      budgetExplanation = `Hourly rate ($${hourly}/hr) is ${Math.round(overPct * 100)}% above the $${project.budgetMax}/hr ceiling.`;
    }
  } else {
    const referenceAmount =
      proposedBid && proposedBid > 0
        ? proposedBid
        : Math.round(hourly * Math.min(Math.max(project.deadlineDays, 7) * 4.5, 140));

    if (referenceAmount >= project.budgetMin && referenceAmount <= project.budgetMax) {
      budgetScore = 20;
      budgetExplanation = `${proposedBid ? 'Proposed bid' : 'Estimated engagement'} ($${referenceAmount.toLocaleString()}) aligns with the $${project.budgetMin.toLocaleString()}–$${project.budgetMax.toLocaleString()} budget.`;
    } else if (referenceAmount < project.budgetMin) {
      const diffRatio = (project.budgetMin - referenceAmount) / Math.max(project.budgetMin, 1);
      budgetScore = diffRatio < 0.35 ? 18 : 14;
      budgetExplanation = `${proposedBid ? 'Proposed bid' : 'Estimated rate'} ($${referenceAmount.toLocaleString()}) is below the $${project.budgetMin.toLocaleString()} minimum budget.`;
    } else {
      const overRatio = (referenceAmount - project.budgetMax) / Math.max(project.budgetMax, 1);
      budgetScore = Math.max(5, Math.round(20 - overRatio * 30));
      budgetExplanation = `${proposedBid ? 'Proposed bid' : 'Estimated rate'} ($${referenceAmount.toLocaleString()}) exceeds the $${project.budgetMax.toLocaleString()} ceiling.`;
    }
  }

  // 3. Experience & Seniority Fit (Max 15)
  const freelancerRank = LEVEL_RANK[freelancer.experienceLevel || 'senior'] ?? 2;
  const projectRank = LEVEL_RANK[project.experienceLevel || 'senior'] ?? 2;
  let expScore = 10;
  if (freelancerRank >= projectRank) {
    expScore = 12;
  } else {
    expScore = 7;
  }
  const ratingBonus = freelancer.rating >= 4.8 ? 3 : freelancer.rating >= 4.5 ? 2 : 1;
  expScore = Math.min(15, expScore + ratingBonus);
  const expExplanation = `${capitalize(freelancer.experienceLevel)} level (${freelancer.yearsExperience || 5} yrs, ${
    freelancer.rating ? freelancer.rating.toFixed(1) : '5.0'
  }★ across ${freelancer.completedProjects || 0} completed briefs) vs ${capitalize(project.experienceLevel)} requirement.`;

  // 4. Portfolio & Category Relevance (Max 15)
  const portfolioItems = freelancer.portfolio || [];
  const categoryNorm = (project.category || '').toLowerCase();
  const matchingPortfolio = portfolioItems.filter((item) => {
    const itemCat = (item.category || '').toLowerCase();
    const catMatch =
      itemCat.includes(categoryNorm) ||
      categoryNorm.includes(itemCat) ||
      item.tags?.some((t) => matchedSkills.some((ms) => normalizeSkill(ms) === normalizeSkill(t)));
    return catMatch;
  });

  let portfolioScore = 0;
  let portfolioExplanation = '';
  if (matchingPortfolio.length >= 2) {
    portfolioScore = 15;
    portfolioExplanation = `${matchingPortfolio.length} verified case studies directly match ${project.category} & core stack.`;
  } else if (matchingPortfolio.length === 1) {
    portfolioScore = 12;
    portfolioExplanation = `Includes a verified case study ("${matchingPortfolio[0].title}") in ${project.category}.`;
  } else if (portfolioItems.length > 0) {
    portfolioScore = 7;
    portfolioExplanation = `${portfolioItems.length} portfolio case studies on file, adjacent to ${project.category}.`;
  } else {
    portfolioScore = 3;
    portfolioExplanation = `No published case studies in ${project.category} yet.`;
  }

  // 5. Availability & Reliability (Max 10)
  const availPoints =
    freelancer.availability === 'available' ? 6 : freelancer.availability === 'part-time' ? 4 : 1;
  const completionRate = freelancer.completionRate ?? 98;
  const reliabilityPoints = completionRate >= 95 ? 4 : completionRate >= 85 ? 3 : 2;
  const availabilityScore = Math.min(10, availPoints + reliabilityPoints);
  const availabilityExplanation = `${
    freelancer.availability === 'available'
      ? 'Immediately available for full sprint allocation'
      : freelancer.availability === 'part-time'
      ? 'Part-time bandwidth (~20 hrs/wk) available'
      : 'Currently in active sprint (limited bandwidth)'
  } with ${completionRate}% historical delivery rate.`;

  const factors: MatchFactor[] = [
    {
      key: 'skills',
      label: 'Skill Architecture Overlap',
      score: skillScore,
      maxScore: 40,
      explanation: skillExplanation,
    },
    {
      key: 'budget',
      label: 'Budget & Rate Calibration',
      score: budgetScore,
      maxScore: 20,
      explanation: budgetExplanation,
    },
    {
      key: 'experience',
      label: 'Seniority & Verified Track Record',
      score: expScore,
      maxScore: 15,
      explanation: expExplanation,
    },
    {
      key: 'portfolio',
      label: 'Portfolio & Domain Proof',
      score: portfolioScore,
      maxScore: 15,
      explanation: portfolioExplanation,
    },
    {
      key: 'availability',
      label: 'Bandwidth & Delivery Reliability',
      score: availabilityScore,
      maxScore: 10,
      explanation: availabilityExplanation,
    },
  ];

  const totalScore = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.score, 0)
  );

  const tier: MatchBreakdown['tier'] =
    totalScore >= 85
      ? 'Exceptional Match'
      : totalScore >= 70
      ? 'Strong Match'
      : totalScore >= 55
      ? 'Balanced Match'
      : 'Exploratory Match';

  return {
    totalScore,
    tier,
    matchedSkills,
    missingSkills,
    factors,
  };
}

function capitalize(str: string = ''): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

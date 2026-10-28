import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './connect.js';
import {
  User,
  Project,
  Proposal,
  Contract,
  Review,
  Message,
  Notification,
  Report,
} from '../models/index.js';
import { computeExplainableMatch } from '../../shared/matching.js';

export async function seedDatabase(forceReset = false): Promise<void> {
  await connectDB();

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !forceReset) {
    console.log('[Veloura Seed] Database already contains data. Skipping seed.');
    return;
  }

  if (forceReset) {
    console.log('[Veloura Seed] Clearing existing collections for clean seed...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Proposal.deleteMany({}),
      Contract.deleteMany({}),
      Review.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
    ]);
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Clients & Admin (Daniel Park as primary Client Demo)
  const [clientDaniel, clientElena, adminUser] = await User.create([
    {
      name: 'Daniel Park',
      email: 'client@veloura.dev',
      passwordHash,
      role: 'client',
      title: 'VP of Product & Brand Strategy',
      company: 'Aethelgard & Park Ventures',
      location: 'San Francisco, CA',
      avatarUrl: '/images/presets/avatar_s1_r1_c2.png',
      bio: 'Commissioning high-impact SaaS products, brand systems, and AI experiences with top independent talent.',
      skills: ['Product Strategy', 'SaaS', 'Design Systems'],
      hourlyRate: 0,
      verified: true,
      onboarded: true,
      isDemo: true,
    },
    {
      name: 'Elena Rostova',
      email: 'elena@veloura.dev',
      passwordHash,
      role: 'client',
      title: 'CTO & Co-Founder',
      company: 'Kinetix AI Labs',
      location: 'Zurich · Hybrid',
      avatarUrl: '/images/presets/avatar_veloura_light_round_glasses_girl.png',
      bio: 'Building next-generation multimodal AI workflows and developer infrastructure.',
      skills: ['AI Engineering', 'TypeScript', 'Next.js'],
      hourlyRate: 0,
      verified: true,
      onboarded: true,
      isDemo: true,
    },
    {
      name: 'Aria Chen',
      email: 'admin@veloura.dev',
      passwordHash,
      role: 'admin',
      title: 'Head of Marketplace Trust & Curation',
      company: 'Veloura Trust Council',
      location: 'New York, NY',
      avatarUrl: '/images/presets/avatar_veloura_dark_round_glasses_girl.png',
      bio: 'Overseeing marketplace quality, contract arbitration, and talent verification.',
      skills: ['Trust & Safety', 'Marketplace Operations'],
      hourlyRate: 0,
      verified: true,
      onboarded: true,
      isDemo: true,
    },
  ]);

  // 2. Create Curated Freelancers (Olivia Carter as primary Freelancer Demo)
  const [freelancerOlivia, freelancerAlex, freelancerSarah, freelancerMichael] =
    await User.create([
      {
        name: 'Olivia Carter',
        email: 'freelancer@veloura.dev',
        passwordHash,
        role: 'freelancer',
        title: 'Principal Full-Stack & UI/UX Architect',
        company: 'Carter Digital Atelier',
        location: 'London, UK',
        avatarUrl: '/images/presets/avatar_veloura_dark_ribbon_girl.png',
        bannerUrl: '/images/banners/veloura-dark-cozy-sakura.png',
        bio: 'Crafting high-converting SaaS interfaces, design systems, and AI-powered web applications with React, Next.js, TypeScript, and Figma.',
        skills: [
          'React',
          'UI/UX Design',
          'Next.js',
          'TypeScript',
          'Figma',
          'Tailwind CSS',
          'Design Systems',
        ],
        hourlyRate: 135,
        availability: 'available',
        experienceLevel: 'principal',
        yearsExperience: 8,
        rating: 4.98,
        reviewCount: 24,
        completedProjects: 28,
        completionRate: 100,
        verified: true,
        onboarded: true,
        isDemo: true,
        portfolio: [
          {
            title: 'Lumina SaaS Analytics & Design System',
            category: 'Design Systems & FinTech',
            description:
              'Designed and engineered a multi-theme React + TypeScript component library and real-time revenue telemetry dashboard.',
            metrics: '+44% activation · 99.6 Lighthouse score',
            link: 'https://veloura.dev/case-studies/lumina',
            tags: ['React', 'TypeScript', 'Tailwind CSS', 'Figma'],
            featured: true,
          },
          {
            title: 'Vespera AI Copilot & Luxury E-Commerce Flagship',
            category: 'AI & LLM Engineering',
            description:
              'Built an interactive Next.js storefront with embedded conversational product discovery.',
            metrics: '2.8x checkout conversion lift',
            link: 'https://veloura.dev/case-studies/vespera',
            tags: ['Next.js', 'UI/UX Design', 'TypeScript'],
            featured: true,
          },
        ],
      },
      {
        name: 'Alex Morgan',
        email: 'alex@veloura.dev',
        passwordHash,
        role: 'freelancer',
        title: 'Senior E-Commerce & Frontend Engineer',
        company: 'Morgan Studio',
        location: 'Toronto, Canada',
        avatarUrl: '/images/presets/avatar_s1_r2_c1.png',
        bio: 'High-performance Next.js storefronts, headless commerce, and interactive motion systems.',
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Shopify', 'GraphQL'],
        hourlyRate: 120,
        availability: 'available',
        experienceLevel: 'senior',
        yearsExperience: 7,
        rating: 4.94,
        reviewCount: 19,
        completedProjects: 22,
        completionRate: 99,
        verified: true,
        onboarded: true,
        isDemo: true,
        portfolio: [
          {
            title: 'Aura Headless Luxury Retail Platform',
            category: 'Brand & Editorial UI',
            description: 'Sub-second page transitions and bespoke editorial lookbooks.',
            metrics: '+62% mobile revenue',
            link: 'https://veloura.dev/case-studies/aura',
            tags: ['Next.js', 'React', 'Tailwind CSS'],
            featured: true,
          },
        ],
      },
      {
        name: 'Sarah Kim',
        email: 'sarah@veloura.dev',
        passwordHash,
        role: 'freelancer',
        title: 'Lead Mobile & Product Designer',
        company: 'Atelier Kim',
        location: 'Seoul · Remote',
        avatarUrl: '/images/presets/avatar_veloura_light_gamer_headphone_girl.png',
        bio: 'iOS/Android design systems, interactive Figma prototypes, and consumer fintech experiences.',
        skills: ['UI/UX Design', 'Figma', 'Product Design', 'Brand Identity', 'Design Systems'],
        hourlyRate: 125,
        availability: 'available',
        experienceLevel: 'senior',
        yearsExperience: 6,
        rating: 4.96,
        reviewCount: 16,
        completedProjects: 21,
        completionRate: 100,
        verified: true,
        onboarded: true,
        isDemo: true,
        portfolio: [
          {
            title: 'NovaPay Mobile Banking Super-App',
            category: 'Design Systems & FinTech',
            description: 'Complete mobile UI kit, biometric flows, and dark mode token system.',
            metrics: '4.9★ App Store rating across 90k reviews',
            link: 'https://veloura.dev/case-studies/novapay',
            tags: ['UI/UX Design', 'Figma', 'Design Systems'],
            featured: true,
          },
        ],
      },
      {
        name: 'Michael Chen',
        email: 'michael@veloura.dev',
        passwordHash,
        role: 'freelancer',
        title: 'Principal AI & Distributed Systems Architect',
        company: 'Chen Systems',
        location: 'Seattle, WA',
        avatarUrl: '/images/presets/avatar_s1_r3_c2.png',
        bio: 'Full-stack SaaS architecture, OpenAI/Gemini orchestration, Node.js, and MongoDB.',
        skills: ['Next.js', 'OpenAI', 'TypeScript', 'Node.js', 'MongoDB', 'React'],
        hourlyRate: 155,
        availability: 'part-time',
        experienceLevel: 'principal',
        yearsExperience: 9,
        rating: 4.95,
        reviewCount: 20,
        completedProjects: 25,
        completionRate: 98,
        verified: true,
        onboarded: true,
        isDemo: true,
        portfolio: [
          {
            title: 'Nexus Autonomous Support Agent',
            category: 'AI & LLM Engineering',
            description: 'Multi-tenant RAG pipeline and analytics dashboard.',
            metrics: '74% automated ticket resolution',
            link: 'https://veloura.dev/case-studies/nexus',
            tags: ['Next.js', 'OpenAI', 'TypeScript', 'MongoDB'],
            featured: true,
          },
        ],
      },
    ]);

  // 3. Create Projects matching both the Freelancer & Client views in the screenshot
  const [
    projModernSaas,
    projAiChatbot,
    projBrandIdentity,
    projEcommerceRedesign,
    projMobileAppUx,
    projSaasDashboard,
  ] = await Project.create([
    {
      title: 'Modern Landing Page for SaaS Product',
      summary:
        'Design and build a high-converting, responsive SaaS flagship landing page with fluid typography and interactive product previews.',
      description:
        'We are launching our next-generation B2B SaaS platform and need a Principal Frontend & UI Architect to craft an art-directed landing experience with React, TypeScript, and Tailwind CSS.',
      category: 'Design Systems & FinTech',
      requiredSkills: ['React', 'TypeScript', 'Tailwind CSS'],
      budgetMin: 1500,
      budgetMax: 2500,
      budgetType: 'fixed',
      deadlineDays: 14,
      experienceLevel: 'senior',
      status: 'open',
      client: clientDaniel._id,
      proposalCount: 12,
      isDemo: true,
      milestones: [
        {
          title: 'Milestone 1 — Visual Direction, Fluid Typography & Hero Prototype',
          amount: 1000,
          dueDays: 6,
          status: 'pending',
        },
        {
          title: 'Milestone 2 — Production React + Tailwind Build & QA',
          amount: 1200,
          dueDays: 14,
          status: 'pending',
        },
      ],
    },
    {
      title: 'AI Chatbot Integration',
      summary:
        'Integrate a streaming conversational AI assistant with context retrieval, custom tool calling, and real-time analytics.',
      description:
        'Seeking a full-stack AI engineer to embed an intelligent assistant into our customer workspace with Next.js, LLM streaming, and persistent conversation history.',
      category: 'AI & LLM Engineering',
      requiredSkills: ['Next.js', 'OpenAI', 'TypeScript', 'React'],
      budgetMin: 2000,
      budgetMax: 3500,
      budgetType: 'fixed',
      deadlineDays: 28,
      experienceLevel: 'principal',
      status: 'open',
      client: clientElena._id,
      proposalCount: 8,
      isDemo: true,
      milestones: [
        {
          title: 'Milestone 1 — Streaming Assistant API & Prompt Guardrails',
          amount: 1500,
          dueDays: 12,
          status: 'pending',
        },
        {
          title: 'Milestone 2 — Interactive Chat UI & Telemetry Dashboard',
          amount: 1600,
          dueDays: 28,
          status: 'pending',
        },
      ],
    },
    {
      title: 'Brand Identity & Logo Design',
      summary:
        'Create a luxury rose-gold visual identity, custom SVG emblem, typography guidelines, and web brand book.',
      description:
        'Complete brand identity system including vector logo marks, color palette tokens, Space Grotesk + DM Serif Display typography hierarchy, and social/web templates.',
      category: 'Brand & Editorial UI',
      requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems'],
      budgetMin: 800,
      budgetMax: 1200,
      budgetType: 'fixed',
      deadlineDays: 21,
      experienceLevel: 'senior',
      status: 'open',
      client: clientDaniel._id,
      proposalCount: 12,
      isDemo: true,
      milestones: [
        {
          title: 'Milestone 1 — Brand Concept Exploration & SVG Crest Marks',
          amount: 500,
          dueDays: 10,
          status: 'pending',
        },
        {
          title: 'Milestone 2 — Full Brand Guidelines & Component Tokens',
          amount: 600,
          dueDays: 21,
          status: 'pending',
        },
      ],
    },
    {
      title: 'E-commerce Website Redesign',
      summary:
        'Full editorial redesign and performance overhaul for a luxury direct-to-consumer storefront.',
      description:
        'Redesigning the product detail, lookbook, and express checkout flows to achieve sub-second page loads and elevated brand storytelling.',
      category: 'Brand & Editorial UI',
      requiredSkills: ['React', 'Next.js', 'TypeScript', 'UI/UX Design'],
      budgetMin: 1800,
      budgetMax: 2400,
      budgetType: 'fixed',
      deadlineDays: 14,
      experienceLevel: 'senior',
      status: 'in_progress',
      client: clientDaniel._id,
      assignedFreelancerId: freelancerOlivia._id,
      proposalCount: 6,
      isDemo: true,
      milestones: [
        {
          title: 'Phase 1 — Storefront Architecture & Checkout Redesign',
          amount: 2000,
          dueDays: 14,
          status: 'pending',
        },
      ],
    },
    {
      title: 'Mobile App UI/UX Design',
      summary:
        'Design a sleek dark-mode mobile experience with intuitive bottom navigation, micro-interactions, and Figma component tokens.',
      description:
        'End-to-end iOS and Android UI/UX design for our flagship mobile companion app.',
      category: 'Design Systems & FinTech',
      requiredSkills: ['UI/UX Design', 'Figma', 'Design Systems'],
      budgetMin: 1000,
      budgetMax: 1500,
      budgetType: 'fixed',
      deadlineDays: 21,
      experienceLevel: 'senior',
      status: 'open',
      client: clientDaniel._id,
      proposalCount: 8,
      isDemo: true,
      milestones: [
        {
          title: 'Mobile Wireframes, High-Fidelity Screens & Interactive Prototype',
          amount: 1200,
          dueDays: 21,
          status: 'pending',
        },
      ],
    },
    {
      title: 'SaaS Dashboard Development',
      summary:
        'Build an executive analytics dashboard with circular progress rings, revenue charts, and role-based workspaces.',
      description:
        'Full-stack implementation of our multi-role analytics and project management command center.',
      category: 'Backend & Distributed Systems',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      budgetMin: 2000,
      budgetMax: 3000,
      budgetType: 'fixed',
      deadlineDays: 28,
      experienceLevel: 'principal',
      status: 'open',
      client: clientDaniel._id,
      proposalCount: 15,
      isDemo: true,
      milestones: [
        {
          title: 'Dashboard Shell, KPI Telemetry & MongoDB Integration',
          amount: 2500,
          dueDays: 28,
          status: 'pending',
        },
      ],
    },
  ]);

  // 4. Create Proposals with Explainable Match Snapshots
  const oliviaMatchEcommerce = computeExplainableMatch(
    freelancerOlivia,
    projEcommerceRedesign,
    2000
  );
  const oliviaMatchMobile = computeExplainableMatch(freelancerOlivia, projMobileAppUx, 1200);
  const oliviaMatchBrand = computeExplainableMatch(freelancerOlivia, projBrandIdentity, 900);
  const oliviaMatchSaas = computeExplainableMatch(freelancerOlivia, projSaasDashboard, 2500);
  const alexMatchModern = computeExplainableMatch(freelancerAlex, projModernSaas, 2000);
  const sarahMatchMobile = computeExplainableMatch(freelancerSarah, projMobileAppUx, 1200);
  const michaelMatchSaas = computeExplainableMatch(freelancerMichael, projSaasDashboard, 2500);

  const [propOliviaEcommerce] = await Proposal.create([
    {
      projectId: projEcommerceRedesign._id,
      freelancer: freelancerOlivia._id,
      coverLetter:
        'I have led luxury e-commerce redesigns that lifted checkout conversion by 2.8x. Ready to deliver the complete Next.js + Figma system within 2 weeks.',
      bidAmount: 2000,
      estimatedDays: 14,
      status: 'accepted',
      matchSnapshot: oliviaMatchEcommerce,
      milestones: [
        {
          title: 'Storefront Redesign & Checkout Optimization',
          amount: 2000,
          dueDays: 14,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projMobileAppUx._id,
      freelancer: freelancerOlivia._id,
      coverLetter:
        'I will craft a tactile dark & light mobile UI system in Figma with interactive component tokens and ergonomic bottom-navigation flows.',
      bidAmount: 1200,
      estimatedDays: 21,
      status: 'shortlisted',
      matchSnapshot: oliviaMatchMobile,
      milestones: [
        {
          title: 'Mobile Design System & Interactive Prototype',
          amount: 1200,
          dueDays: 21,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projBrandIdentity._id,
      freelancer: freelancerOlivia._id,
      coverLetter:
        'Complete rose-gold vector emblem, typography scale, and brand guidelines package.',
      bidAmount: 900,
      estimatedDays: 14,
      status: 'rejected',
      matchSnapshot: oliviaMatchBrand,
      milestones: [
        {
          title: 'Brand Identity & Logo Package',
          amount: 900,
          dueDays: 14,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projSaasDashboard._id,
      freelancer: freelancerOlivia._id,
      coverLetter:
        'Having architected Lumina SaaS Analytics, I can build your executive dashboard with circular progress rings, sparklines, and MongoDB persistence.',
      bidAmount: 2500,
      estimatedDays: 28,
      status: 'pending',
      matchSnapshot: oliviaMatchSaas,
      milestones: [
        {
          title: 'Executive SaaS Dashboard & Telemetry',
          amount: 2500,
          dueDays: 28,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projModernSaas._id,
      freelancer: freelancerAlex._id,
      coverLetter:
        'I specialize in high-converting React + Tailwind CSS SaaS flagships with sub-second load times.',
      bidAmount: 2000,
      estimatedDays: 14,
      status: 'pending',
      matchSnapshot: alexMatchModern,
      milestones: [
        {
          title: 'Modern SaaS Landing Page Delivery',
          amount: 2000,
          dueDays: 14,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projMobileAppUx._id,
      freelancer: freelancerSarah._id,
      coverLetter:
        'As Lead Designer of the NovaPay mobile app (4.9★), I would love to design your mobile UI/UX system.',
      bidAmount: 1200,
      estimatedDays: 21,
      status: 'pending',
      matchSnapshot: sarahMatchMobile,
      milestones: [
        {
          title: 'Complete iOS & Android UI Kit',
          amount: 1200,
          dueDays: 21,
          status: 'pending',
        },
      ],
    },
    {
      projectId: projSaasDashboard._id,
      freelancer: freelancerMichael._id,
      coverLetter:
        'I can architect both the React analytics frontend and the high-throughput MongoDB aggregation backend.',
      bidAmount: 2500,
      estimatedDays: 28,
      status: 'pending',
      matchSnapshot: michaelMatchSaas,
      milestones: [
        {
          title: 'Full-Stack SaaS Dashboard Implementation',
          amount: 2500,
          dueDays: 28,
          status: 'pending',
        },
      ],
    },
  ]);

  projEcommerceRedesign.acceptedProposalId = propOliviaEcommerce._id;
  await projEcommerceRedesign.save();

  // 5. Create Active Contract & Reviews
  const activeContract = await Contract.create({
    projectId: projEcommerceRedesign._id,
    proposalId: propOliviaEcommerce._id,
    client: clientDaniel._id,
    freelancer: freelancerOlivia._id,
    agreedAmount: 2000,
    estimatedDays: 14,
    status: 'active',
    milestones: [
      {
        title: 'Storefront Redesign & Checkout Optimization',
        amount: 2000,
        dueDays: 14,
        status: 'pending',
      },
    ],
  });

  await Review.create({
    contractId: activeContract._id,
    projectId: projEcommerceRedesign._id,
    client: clientDaniel._id,
    freelancer: freelancerOlivia._id,
    rating: 5,
    comment:
      'Olivia delivered extraordinary visual polish, clean React architecture, and effortless collaboration.',
  });

  // 6. Seed Authorized Collaboration Messages
  await Message.create([
    {
      projectId: projEcommerceRedesign._id,
      sender: clientDaniel._id,
      recipient: freelancerOlivia._id,
      body: 'Hi Olivia — thrilled to kick off the E-commerce Website Redesign! Your rose-gold typographic hierarchy looks incredible.',
    },
    {
      projectId: projEcommerceRedesign._id,
      sender: freelancerOlivia._id,
      recipient: clientDaniel._id,
      body: 'Thank you, Daniel! I have finalized the responsive grid tokens and will share the interactive checkout preview this afternoon.',
    },
  ]);

  // 7. Seed Notifications matching the Recent Activity feed
  await Notification.create([
    {
      userId: clientDaniel._id,
      type: 'proposal',
      title: 'New proposal received',
      body: 'for Mobile App UI/UX Design from Sarah Kim ($1,200 · 3 weeks)',
      link: `/projects/${projMobileAppUx._id}`,
      read: false,
    },
    {
      userId: clientDaniel._id,
      type: 'contract',
      title: 'Project marked as in progress',
      body: 'E-commerce Website Redesign with Olivia Carter',
      link: `/projects/${projEcommerceRedesign._id}`,
      read: false,
    },
    {
      userId: clientDaniel._id,
      type: 'message',
      title: 'New message from Sarah Kim',
      body: 'Re: Mobile App UI/UX Design prototype tokens',
      link: `/projects/${projMobileAppUx._id}`,
      read: false,
    },
    {
      userId: freelancerOlivia._id,
      type: 'contract',
      title: 'Proposal Accepted — E-commerce Website Redesign',
      body: 'Daniel Park accepted your $2,000 proposal and activated your contract.',
      link: `/projects/${projEcommerceRedesign._id}`,
      read: false,
    },
    {
      userId: freelancerOlivia._id,
      type: 'proposal',
      title: 'Proposal Under Review — Mobile App UI/UX Design',
      body: `Your proposal (${oliviaMatchMobile.totalScore}% Match) was shortlisted by Daniel Park.`,
      link: `/projects/${projMobileAppUx._id}`,
      read: false,
    },
  ]);

  await Report.create({
    reporter: clientDaniel._id,
    targetType: 'project',
    targetId: String(projAiChatbot._id),
    targetTitle: projAiChatbot.title,
    reason: 'Milestone Escrow Verification',
    details: 'Demo moderation item: Verifying milestone schedule for AI Chatbot Integration.',
    status: 'open',
  });

  console.log('[Veloura Seed] Demo data seeded successfully.');
  console.log('  -> Freelancer Demo (Olivia Carter): freelancer@veloura.dev / Password123!');
  console.log('  -> Client Demo     (Daniel Park):   client@veloura.dev     / Password123!');
  console.log('  -> Admin Demo      (Aria Chen):     admin@veloura.dev      / Password123!');
  void adminUser;
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));

if (isMain) {
  seedDatabase(true)
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Veloura Seed] Error seeding database:', err);
      process.exit(1);
    });
}

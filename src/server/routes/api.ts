import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
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
import {
  requireAuth,
  optionalAuth,
  requireRole,
  signToken,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { computeExplainableMatch } from '../../shared/matching.js';
import { rateLimited } from './authExtras.js';

export const apiRouter = Router();

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// --- Validation Schemas ---
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['client', 'freelancer']).default('freelancer'),
  title: z.string().optional(),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['client', 'freelancer']).optional(),
});

const portfolioItemSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  category: z.string().min(2, 'Category required'),
  description: z.string().min(5, 'Provide a short description of the work'),
  metrics: z.string().optional(),
  link: z.string().optional(),
  githubUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  verifiedRealWork: z.boolean().optional(),
  verificationScore: z.number().optional(),
  templateVariant: z.string().optional(),
});

const experienceItemSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  period: z.string().min(1, 'Period is required'),
  description: z.string().default(''),
});

const customReviewItemSchema = z.object({
  _id: z.string().optional(),
  reviewerName: z.string().min(1, 'Reviewer name is required'),
  rating: z.number().min(1).max(5).default(5),
  dateText: z.string().default('Recently'),
  comment: z.string().min(1, 'Review comment is required'),
});

const certificateItemSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  credentialUrl: z.string().optional(),
  credentialId: z.string().optional(),
  fileDataUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.enum(['image', 'pdf']).optional(),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['client', 'freelancer']).optional(),
  title: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  company: z.string().max(120).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().max(500).optional(),
  bannerUrl: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  experiences: z.array(experienceItemSchema).optional(),
  customReviews: z.array(customReviewItemSchema).optional(),
  certificates: z.array(certificateItemSchema).optional(),
  hourlyRate: z.number().min(0).max(1000).optional(),
  availability: z.enum(['available', 'part-time', 'busy']).optional(),
  experienceLevel: z.enum(['mid', 'senior', 'principal']).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  completedProjects: z.number().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  portfolio: z.array(portfolioItemSchema).optional(),
  onboarded: z.boolean().optional(),
});

const createProjectSchema = z.object({
  title: z.string().min(5, 'Project title must be at least 5 characters'),
  summary: z.string().min(10, 'Provide a concise executive summary'),
  description: z.string().min(20, 'Provide detailed scope requirements'),
  category: z.string().min(2),
  requiredSkills: z.array(z.string()).min(1, 'Specify at least one required skill'),
  budgetMin: z.number().min(50),
  budgetMax: z.number().min(50),
  budgetType: z.enum(['fixed', 'hourly']).default('fixed'),
  deadlineDays: z.number().min(1).max(365).default(21),
  experienceLevel: z.enum(['mid', 'senior', 'principal']).default('senior'),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2),
        amount: z.number().min(10),
        dueDays: z.number().min(1),
      })
    )
    .optional(),
});

const createProposalSchema = z.object({
  coverLetter: z.string().min(20, 'Cover letter must be at least 20 characters'),
  bidAmount: z.number().min(20),
  estimatedDays: z.number().min(1).max(365),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2),
        amount: z.number().min(10),
        dueDays: z.number().min(1),
      })
    )
    .optional(),
});

const directHireSchema = z.object({
  freelancerId: z.string().min(1, 'Freelancer ID is required'),
  projectId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  agreedAmount: z.number().min(10).optional(),
  estimatedDays: z.number().min(1).max(365).optional(),
  coverNote: z.string().optional(),
});

function setAuthCookie(res: Response, token: string): void {
  res.cookie('veloura_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// --- 1. Health & Live Marketplace Statistics ---
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'veloura-api',
    database: 'mongodb-local',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/stats', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [
      openProjectsCount,
      completedProjectsCount,
      freelancersCount,
      activeContractsCount,
      featuredFreelancers,
      featuredProjects,
      contracts,
      totalProjectsCount,
      reviewAgg,
    ] = await Promise.all([
      Project.countDocuments({ status: 'open' }),
      Project.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'freelancer' }),
      Contract.countDocuments({ status: { $in: ['active', 'submitted', 'completed'] } }),
      User.find({ role: 'freelancer' }).sort({ rating: -1, completedProjects: -1 }).limit(6).lean(),
      Project.find({ status: 'open' })
        .populate('client', 'name company location verified')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Contract.find({}, 'agreedAmount').lean(),
      Project.countDocuments({}),
      Review.aggregate<{ avg: number; count: number }>([
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalContractValue = contracts.reduce((acc, c) => acc + (c.agreedAmount || 0), 0);
    const reviewStats = reviewAgg[0];
    // Client satisfaction = average published review rating as a percentage (null when no reviews exist yet).
    const clientSatisfaction =
      reviewStats && reviewStats.count > 0 ? Math.round((reviewStats.avg / 5) * 100) : null;

    const enrichedProjects = featuredProjects.map((proj) => {
      if (req.user && req.user.role === 'freelancer') {
        return {
          ...proj,
          matchBreakdown: computeExplainableMatch(req.user, proj),
        };
      }
      if (featuredFreelancers.length > 0) {
        const bestMatch = featuredFreelancers
          .map((f) => computeExplainableMatch(f, proj))
          .sort((a, b) => b.totalScore - a.totalScore)[0];
        return {
          ...proj,
          matchBreakdown: bestMatch,
        };
      }
      return proj;
    });

    res.json({
      metrics: {
        openProjects: openProjectsCount,
        completedProjects: completedProjectsCount,
        verifiedFreelancers: freelancersCount,
        activeContracts: activeContractsCount,
        totalVolumeUsd: totalContractValue,
        totalProjects: totalProjectsCount,
        reviewCount: reviewStats?.count ?? 0,
        clientSatisfaction,
      },
      featuredFreelancers,
      featuredProjects: enrichedProjects,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load marketplace statistics' });
  }
});

// --- 2. Authentication & Profile Onboarding ---
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (rateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'Too many registration attempts. Please try again in an hour.' });
      return;
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data' });
      return;
    }
    const { name, email, password, role, title, company } = parsed.data;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      title:
        title ||
        (role === 'client' ? 'Product & Engineering Lead' : 'Senior Full-Stack Specialist'),
      company: company || '',
      bio: '',
      skills: role === 'freelancer' ? ['TypeScript', 'React', 'System Architecture'] : [],
      hourlyRate: role === 'freelancer' ? 110 : 0,
      onboarded: false,
      verified: false,
      emailVerified: false,
    });

    const token = signToken(String(user._id), user.role);
    setAuthCookie(res, token);

    const { passwordHash: _ignoredRegisterPw, ...userObj } = user.toObject();

    res.status(201).json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (rateLimited(`login:${ip}`, 10, 15 * 60 * 1000)) {
      res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }
    const { email, password, role: requestedRole } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // The Client / Freelancer toggle must match the account's role (admins may use either).
    if (requestedRole && user.role !== 'admin' && user.role !== requestedRole) {
      res.status(403).json({
        error: `This account is registered as a ${user.role}. Switch to "${
          user.role === 'client' ? 'Client' : 'Freelancer'
        }" to sign in.`,
        accountRole: user.role,
      });
      return;
    }

    const token = signToken(String(user._id), user.role);
    setAuthCookie(res, token);

    const { passwordHash: _ignoredLoginPw, ...userObj } = user.toObject();

    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('veloura_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ message: 'Signed out successfully.' });
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  // Also returns a fresh bearer token so cookie-based sessions (e.g. after OAuth) can be restored client-side.
  const token = signToken(String(req.user!._id), req.user!.role);
  res.json({ user: req.user, token });
});

apiRouter.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile fields' });
      return;
    }
    const updates = { ...parsed.data, onboarded: true };
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: updates },
      { new: true }
    );
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const token = signToken(String(updatedUser._id), updatedUser.role);
    setAuthCookie(res, token);
    res.json({ user: updatedUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// --- Fast 1-Click Role Switcher (Client <-> Freelancer) ---
apiRouter.post('/auth/switch-role', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetRole = (req.body as { role?: 'client' | 'freelancer' }).role;
    const newRole = targetRole || (req.user!.role === 'client' ? 'freelancer' : 'client');

    if (newRole !== 'client' && newRole !== 'freelancer') {
      res.status(400).json({ error: 'Role must be either client or freelancer.' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { role: newRole } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const token = signToken(String(updatedUser._id), updatedUser.role);
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: `Switched to ${newRole === 'client' ? 'Client' : 'Freelancer'} Workspace`,
      user: updatedUser,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch workspace role' });
  }
});

// --- Dedicated Portfolio Management Endpoints ---
apiRouter.post('/profile/portfolio', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = portfolioItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid portfolio data' });
      return;
    }
    const userDoc = await User.findById(req.user!._id);
    if (!userDoc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const newItem = {
      ...parsed.data,
      tags: parsed.data.tags || [],
      featured: Boolean(parsed.data.featured),
    };
    userDoc.portfolio.push(newItem as unknown as (typeof userDoc.portfolio)[0]);
    await userDoc.save();

    res.status(201).json({
      message: 'Portfolio item added successfully',
      portfolio: userDoc.portfolio,
      item: userDoc.portfolio[userDoc.portfolio.length - 1],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add portfolio item' });
  }
});

apiRouter.put('/profile/portfolio/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = portfolioItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid portfolio data' });
      return;
    }
    const userDoc = await User.findById(req.user!._id);
    if (!userDoc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const item = userDoc.portfolio.find((p) => String(p._id) === String(req.params.id));
    if (!item) {
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }
    Object.assign(item, parsed.data);
    await userDoc.save();

    res.json({
      message: 'Portfolio item updated successfully',
      portfolio: userDoc.portfolio,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
});

apiRouter.delete('/profile/portfolio/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userDoc = await User.findById(req.user!._id);
    if (!userDoc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    userDoc.portfolio = userDoc.portfolio.filter((p) => String(p._id) !== String(req.params.id)) as unknown as typeof userDoc.portfolio;
    await userDoc.save();

    res.json({
      message: 'Portfolio item removed successfully',
      portfolio: userDoc.portfolio,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

// --- 3. Freelancer Directory & Profiles ---
apiRouter.get('/freelancers', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { q, skill, availability, experienceLevel, maxRate, projectId } = req.query;
    
    // Match any specialist who has a freelancer role OR has published portfolio projects
    const baseCondition = {
      $or: [
        { role: 'freelancer' },
        { 'portfolio.0': { $exists: true } },
      ],
    };

    const andConditions: Record<string, unknown>[] = [baseCondition];

    if (availability && typeof availability === 'string' && availability !== 'all') {
      andConditions.push({ availability });
    }
    if (experienceLevel && typeof experienceLevel === 'string' && experienceLevel !== 'all') {
      andConditions.push({ experienceLevel });
    }
    if (maxRate && !Number.isNaN(Number(maxRate))) {
      andConditions.push({ hourlyRate: { $lte: Number(maxRate) } });
    }
    if (skill && typeof skill === 'string' && skill.trim()) {
      andConditions.push({ skills: { $regex: new RegExp(escapeRegex(skill.trim()), 'i') } });
    }
    if (q && typeof q === 'string' && q.trim()) {
      // Split requirements string by spaces/commas to match multi-skill briefs safely
      const terms = q.trim().split(/[\s,]+/).filter(Boolean);
      const orClauses = terms.map((term) => {
        const r = new RegExp(escapeRegex(term), 'i');
        return {
          $or: [
            { name: r },
            { title: r },
            { bio: r },
            { skills: r },
            { company: r },
            { 'portfolio.title': r },
            { 'portfolio.description': r },
            { 'portfolio.tags': r },
            { 'portfolio.category': r },
          ],
        };
      });

      andConditions.push({
        $or: orClauses.flatMap((c) => c.$or),
      });
    }

    const filter: Record<string, unknown> = andConditions.length > 1
      ? { $and: andConditions }
      : baseCondition;

    const freelancers = await User.find(filter)
      .sort({ rating: -1, completedProjects: -1 })
      .lean();

    let referenceProject = null;
    if (projectId && typeof projectId === 'string') {
      referenceProject = await Project.findById(projectId).lean();
    }

    const results = freelancers.map((f) => {
      if (referenceProject) {
        return {
          ...f,
          matchBreakdown: computeExplainableMatch(f, referenceProject),
        };
      }
      return f;
    });

    if (referenceProject) {
      results.sort(
        (a, b) =>
          ((b as { matchBreakdown?: { totalScore: number } }).matchBreakdown?.totalScore || 0) -
          ((a as { matchBreakdown?: { totalScore: number } }).matchBreakdown?.totalScore || 0)
      );
    }

    res.json({ freelancers: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch freelancers' });
  }
});

apiRouter.get('/freelancers/:id', optionalAuth, async (req, res) => {
  try {
    const freelancer = await User.findById(req.params.id).lean();
    if (!freelancer) {
      res.status(404).json({ error: 'Freelancer profile not found.' });
      return;
    }
    const reviews = await Review.find({ freelancer: freelancer._id })
      .populate('client', 'name company')
      .populate('projectId', 'title category')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ freelancer, reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load freelancer profile' });
  }
});

// --- 4. Projects Marketplace & Explainable Matching ---
apiRouter.get('/projects', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { q, category, skill, status, experienceLevel, maxBudget } = req.query;
    const filter: Record<string, unknown> = {};

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }
    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }
    if (experienceLevel && typeof experienceLevel === 'string' && experienceLevel !== 'all') {
      filter.experienceLevel = experienceLevel;
    }
    if (maxBudget && !Number.isNaN(Number(maxBudget))) {
      filter.budgetMin = { $lte: Number(maxBudget) };
    }
    if (skill && typeof skill === 'string' && skill.trim()) {
      filter.requiredSkills = { $regex: new RegExp(escapeRegex(skill.trim()), 'i') };
    }
    if (q && typeof q === 'string' && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [
        { title: regex },
        { summary: regex },
        { description: regex },
        { requiredSkills: regex },
      ];
    }

    const projects = await Project.find(filter)
      .populate('client', 'name company location verified')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = projects.map((proj) => {
      if (req.user && req.user.role === 'freelancer') {
        return {
          ...proj,
          matchBreakdown: computeExplainableMatch(req.user, proj),
        };
      }
      return proj;
    });

    res.json({ projects: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Persistent Project Bookmark Toggle (MongoDB)
apiRouter.post('/projects/:id/bookmark', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const projectId = String(req.params.id);
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project brief not found.' });
      return;
    }

    const userDoc = await User.findById(req.user!._id);
    if (!userDoc) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const currentSaved = Array.isArray(userDoc.savedProjects) ? userDoc.savedProjects : [];
    const alreadySaved = currentSaved.includes(projectId);
    const updatedSaved = alreadySaved
      ? currentSaved.filter((id) => id !== projectId)
      : [...currentSaved, projectId];

    userDoc.savedProjects = updatedSaved;
    await userDoc.save();

    res.json({
      bookmarked: !alreadySaved,
      savedProjects: updatedSaved,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

apiRouter.get('/my/bookmarks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const savedIds = req.user?.savedProjects || [];
    const projects = await Project.find({ _id: { $in: savedIds } })
      .populate('client', 'name company location verified')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ projects, savedIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarked projects' });
  }
});

// Persistent Freelancer Bookmark Toggle (MongoDB)
apiRouter.post('/freelancers/:id/bookmark', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetFreelancerId = String(req.params.id);
    const targetExists = await User.exists({ _id: targetFreelancerId });
    if (!targetExists) {
      res.status(404).json({ error: 'Freelancer profile not found.' });
      return;
    }

    const userDoc = await User.findById(req.user!._id);
    if (!userDoc) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const currentSaved = Array.isArray(userDoc.savedFreelancers) ? userDoc.savedFreelancers : [];
    const alreadySaved = currentSaved.includes(targetFreelancerId);
    const updatedSaved = alreadySaved
      ? currentSaved.filter((id) => id !== targetFreelancerId)
      : [...currentSaved, targetFreelancerId];

    userDoc.savedFreelancers = updatedSaved;
    await userDoc.save();

    res.json({
      bookmarked: !alreadySaved,
      savedFreelancers: updatedSaved,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update saved freelancer' });
  }
});

apiRouter.get('/my/saved-freelancers', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userDoc = await User.findById(req.user!._id).lean();
    const savedIds = userDoc?.savedFreelancers || [];
    const freelancers = await User.find({ _id: { $in: savedIds }, role: 'freelancer' })
      .select('-passwordHash')
      .sort({ rating: -1, createdAt: -1 })
      .lean();
    res.json({ freelancers, savedIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved freelancers' });
  }
});

apiRouter.get('/projects/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name company location verified email title')
      .lean();

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    // Compute match score for logged-in freelancer
    let myMatchBreakdown = null;
    if (req.user && req.user.role === 'freelancer') {
      myMatchBreakdown = computeExplainableMatch(req.user, project);
    }

    // Compute top matched freelancers for this project
    const allFreelancers = await User.find({ role: 'freelancer' }).lean();
    const matchedTalent = allFreelancers
      .map((f) => ({
        freelancer: f,
        match: computeExplainableMatch(f, project),
      }))
      .sort((a, b) => b.match.totalScore - a.match.totalScore)
      .slice(0, 5);

    // Load proposals based on role permissions
    let proposals: unknown[] = [];
    const clientObj = project.client as { _id?: unknown };
    const isOwnerClient =
      req.user && String(clientObj?._id || project.client) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    if (isOwnerClient || isAdmin) {
      proposals = await Proposal.find({ projectId: project._id })
        .populate('freelancer', 'name email title location skills hourlyRate rating reviewCount completedProjects completionRate availability experienceLevel yearsExperience portfolio verified')
        .sort({ 'matchSnapshot.totalScore': -1, createdAt: -1 })
        .lean();
    } else if (req.user && req.user.role === 'freelancer') {
      proposals = await Proposal.find({
        projectId: project._id,
        freelancer: req.user._id,
      })
        .populate('freelancer', 'name email title location skills hourlyRate rating completedProjects availability experienceLevel portfolio verified')
        .lean();
    }

    const contract = await Contract.findOne({ projectId: project._id })
      .populate('client', 'name email company location')
      .populate('freelancer', 'name email title location skills hourlyRate')
      .lean();

    res.json({
      project,
      myMatchBreakdown,
      matchedTalent,
      proposals,
      contract,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load project details' });
  }
});

apiRouter.post(
  '/projects',
  requireAuth,
  requireRole('client', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data' });
        return;
      }
      const data = parsed.data;
      if (data.budgetMax < data.budgetMin) {
        res.status(400).json({ error: 'Maximum budget must be greater than or equal to minimum budget.' });
        return;
      }

      const defaultMilestones =
        data.milestones && data.milestones.length > 0
          ? data.milestones
          : [
              {
                title: 'Architecture, Discovery & System Specification',
                amount: Math.round(data.budgetMax * 0.35),
                dueDays: Math.max(3, Math.round(data.deadlineDays * 0.3)),
              },
              {
                title: 'Core Implementation, QA & Production Handoff',
                amount: Math.round(data.budgetMax * 0.65),
                dueDays: data.deadlineDays,
              },
            ];

      const project = await Project.create({
        ...data,
        milestones: defaultMilestones,
        client: req.user!._id,
        status: 'open',
      });

      const populated = await Project.findById(project._id).populate(
        'client',
        'name company location verified'
      );

      res.status(201).json({ project: populated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to publish project' });
    }
  }
);

apiRouter.patch(
  '/projects/:id/close',
  requireAuth,
  requireRole('client', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }

      if (req.user!.role !== 'admin' && String(project.client) !== String(req.user!._id)) {
        res.status(403).json({ error: 'Forbidden: Only the project owner or admin can close this project.' });
        return;
      }

      if (project.status !== 'open') {
        res.status(400).json({
          error: `Cannot close project with status '${project.status}'. Only open projects can be closed.`,
        });
        return;
      }

      project.status = 'cancelled';
      await project.save();

      // Automatically reject pending proposals
      await Proposal.updateMany(
        { projectId: project._id, status: { $in: ['pending', 'shortlisted'] } },
        { $set: { status: 'rejected' } }
      );

      res.json({ project, message: 'Project closed successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to close project' });
    }
  }
);

// --- 5. Proposals & Atomic Acceptance Workflow ---
apiRouter.post(
  '/projects/:id/proposals',
  requireAuth,
  requireRole('freelancer'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      if (project.status !== 'open') {
        res.status(400).json({ error: `Cannot submit proposal: project status is '${project.status}'.` });
        return;
      }

      const parsed = createProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid proposal data' });
        return;
      }

      const existing = await Proposal.findOne({
        projectId: project._id,
        freelancer: req.user!._id,
      });
      if (existing) {
        res.status(409).json({ error: 'You have already submitted a proposal for this project.' });
        return;
      }

      const { coverLetter, bidAmount, estimatedDays, milestones } = parsed.data;

      // Validate milestone allocations against proposal bid
      if (milestones && milestones.length > 0) {
        const milestoneTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
        if (Math.abs(milestoneTotal - bidAmount) > 0.01) {
          res.status(400).json({
            error: `Total milestone allocations ($${milestoneTotal.toLocaleString()}) must equal proposal bid amount ($${bidAmount.toLocaleString()}).`,
          });
          return;
        }
      }

      // Check that bid is reasonable relative to maximum project budget
      if (bidAmount > project.budgetMax * 3) {
        res.status(400).json({
          error: `Proposal bid ($${bidAmount.toLocaleString()}) exceeds the project budget ceiling ($${project.budgetMax.toLocaleString()}).`,
        });
        return;
      }

      const matchSnapshot = computeExplainableMatch(req.user!, project, bidAmount);

      const proposal = await Proposal.create({
        projectId: project._id,
        freelancer: req.user!._id,
        coverLetter,
        bidAmount,
        estimatedDays,
        milestones:
          milestones && milestones.length > 0
            ? milestones
            : [
                {
                  title: 'Milestone 1 — Discovery & Core Architecture',
                  amount: Math.round(bidAmount * 0.4),
                  dueDays: Math.max(2, Math.round(estimatedDays * 0.4)),
                },
                {
                  title: 'Milestone 2 — Final Polish & Production Delivery',
                  amount: Math.round(bidAmount * 0.6),
                  dueDays: estimatedDays,
                },
              ],
        status: 'pending',
        matchSnapshot,
      });

      await Project.findByIdAndUpdate(project._id, { $inc: { proposalCount: 1 } });

      await Notification.create({
        userId: project.client,
        type: 'proposal',
        title: `New Proposal (${matchSnapshot.totalScore}% Match)`,
        body: `${req.user!.name} submitted a $${bidAmount.toLocaleString()} proposal for "${project.title}".`,
        link: `/projects/${project._id}`,
      });

      const populated = await Proposal.findById(proposal._id).populate(
        'freelancer',
        'name email title location skills hourlyRate rating completedProjects availability experienceLevel portfolio verified'
      );

      res.status(201).json({ proposal: populated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit proposal' });
    }
  }
);

apiRouter.get('/my/proposals', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role === 'freelancer') {
      const proposals = await Proposal.find({ freelancer: req.user!._id })
        .populate({
          path: 'projectId',
          populate: { path: 'client', select: 'name company location verified' },
        })
        .sort({ createdAt: -1 })
        .lean();
      res.json({ proposals });
      return;
    }

    // For client: all proposals across their projects
    const myProjects = await Project.find({ client: req.user!._id }, '_id').lean();
    const projectIds = myProjects.map((p) => p._id);
    const proposals = await Proposal.find({ projectId: { $in: projectIds } })
      .populate('projectId', 'title category budgetMin budgetMax status')
      .populate('freelancer', 'name email title location skills hourlyRate rating completedProjects availability experienceLevel')
      .sort({ 'matchSnapshot.totalScore': -1, createdAt: -1 })
      .lean();
    res.json({ proposals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load proposals' });
  }
});

apiRouter.patch(
  '/proposals/:id/status',
  requireAuth,
  requireRole('client', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body as { status?: 'shortlisted' | 'accepted' | 'rejected' };
      if (!status || !['shortlisted', 'accepted', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Valid status (shortlisted, accepted, rejected) is required.' });
        return;
      }

      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) {
        res.status(404).json({ error: 'Proposal not found.' });
        return;
      }

      const project = await Project.findById(proposal.projectId);
      if (!project) {
        res.status(404).json({ error: 'Associated project not found.' });
        return;
      }

      if (req.user!.role !== 'admin' && String(project.client) !== String(req.user!._id)) {
        res.status(403).json({ error: 'Forbidden: Only the project owner can manage proposals.' });
        return;
      }

      if (status === 'shortlisted' || status === 'rejected') {
        if (project.status !== 'open') {
          res.status(409).json({ error: 'Cannot modify proposal status after project has been awarded.' });
          return;
        }
        proposal.status = status;
        await proposal.save();

        await Notification.create({
          userId: proposal.freelancer,
          type: 'proposal',
          title:
            status === 'shortlisted'
              ? `Proposal Shortlisted — ${project.title}`
              : `Proposal Update — ${project.title}`,
          body:
            status === 'shortlisted'
              ? `Your proposal for "${project.title}" has been shortlisted by ${req.user!.name}.`
              : `Your proposal for "${project.title}" was not selected for this sprint.`,
          link: `/projects/${project._id}`,
        });

        res.json({ proposal, project });
        return;
      }

      // Status === 'accepted': Prevent accepting already resolved proposals
      if (proposal.status !== 'pending' && proposal.status !== 'shortlisted') {
        res.status(409).json({
          error: `Cannot accept proposal: proposal status is already '${proposal.status}'.`,
        });
        return;
      }

      // Atomic conditional transition to prevent race conditions
      const lockedProject = await Project.findOneAndUpdate(
        {
          _id: project._id,
          status: 'open',
        },
        {
          $set: {
            status: 'in_progress',
            acceptedProposalId: proposal._id,
            assignedFreelancerId: proposal.freelancer,
          },
        },
        { new: true }
      );

      if (!lockedProject) {
        res.status(409).json({
          error: 'Conflict: Project is no longer open or another proposal has already been accepted.',
        });
        return;
      }

      try {
        proposal.status = 'accepted';
        await proposal.save();

        // Reject all other pending/shortlisted proposals on this project
        await Proposal.updateMany(
          { projectId: project._id, _id: { $ne: proposal._id } },
          { $set: { status: 'rejected' } }
        );

        const contract = await Contract.create({
          projectId: project._id,
          proposalId: proposal._id,
          client: project.client,
          freelancer: proposal.freelancer,
          agreedAmount: proposal.bidAmount,
          estimatedDays: proposal.estimatedDays,
          status: 'active',
          milestones: proposal.milestones,
        });

        await Notification.create({
          userId: proposal.freelancer,
          type: 'contract',
          title: `Contract Awarded — ${project.title}`,
          body: `${req.user!.name} accepted your $${proposal.bidAmount.toLocaleString()} proposal and activated Contract #${String(contract._id).slice(-6)}.`,
          link: `/dashboard`,
        });

        res.json({ proposal, project: lockedProject, contract });
      } catch (innerErr) {
        // Rollback project & proposal if subsequent creation fails
        await Project.findByIdAndUpdate(project._id, {
          $set: { status: 'open' },
          $unset: { acceptedProposalId: 1, assignedFreelancerId: 1 },
        });
        await Proposal.findByIdAndUpdate(proposal._id, { $set: { status: 'pending' } });
        await Proposal.updateMany(
          { projectId: project._id, _id: { $ne: proposal._id }, status: 'rejected' },
          { $set: { status: 'pending' } }
        );
        throw innerErr;
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to update proposal status' });
    }
  }
);

apiRouter.delete('/proposals/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && String(proposal.freelancer) !== String(req.user!._id)) {
      res.status(403).json({ error: 'Forbidden: You can only withdraw your own proposals.' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({
        error: `Cannot withdraw proposal with status '${proposal.status}'. Only pending proposals can be withdrawn.`,
      });
      return;
    }

    await Proposal.findByIdAndDelete(proposal._id);
    await Project.findByIdAndUpdate(proposal.projectId, { $inc: { proposalCount: -1 } });

    res.json({ success: true, message: 'Proposal withdrawn successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to withdraw proposal' });
  }
});

// --- 5.1 Direct Hire & Talent Commissioning ---
apiRouter.post('/hire', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role !== 'client' && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Only clients can hire or commission talent.' });
      return;
    }

    const parsed = directHireSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid hiring parameters' });
      return;
    }

    const { freelancerId, projectId, title, description, agreedAmount, estimatedDays, coverNote } =
      parsed.data;

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || (freelancer.role !== 'freelancer' && req.user!.role !== 'admin')) {
      res.status(404).json({ error: 'Specialist account not found or is not available for hire.' });
      return;
    }

    if (String(freelancer._id) === String(req.user!._id)) {
      res.status(400).json({ error: 'You cannot hire yourself.' });
      return;
    }

    // Branch 1: Assign to an existing open brief
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ error: 'Project brief not found.' });
        return;
      }

      if (req.user!.role !== 'admin' && String(project.client) !== String(req.user!._id)) {
        res.status(403).json({ error: 'Forbidden: You can only award your own project briefs.' });
        return;
      }

      if (project.status !== 'open') {
        res.status(409).json({ error: `Cannot award project: status is already '${project.status}'.` });
        return;
      }

      // Check if this freelancer already submitted a proposal
      let proposal = await Proposal.findOne({ projectId: project._id, freelancer: freelancer._id });
      const finalAmount =
        agreedAmount ||
        (proposal ? proposal.bidAmount : project.budgetMax || project.budgetMin || 1000);
      const finalDays =
        estimatedDays || (proposal ? proposal.estimatedDays : project.deadlineDays || 14);

      if (!proposal) {
        proposal = await Proposal.create({
          projectId: project._id,
          freelancer: freelancer._id,
          coverLetter:
            coverNote || `Direct hiring offer from ${req.user!.name} for "${project.title}".`,
          bidAmount: finalAmount,
          estimatedDays: finalDays,
          milestones: [
            {
              title: `${project.title} Sprint Delivery`,
              amount: finalAmount,
              dueDays: finalDays,
              status: 'pending',
            },
          ],
          status: 'accepted',
          matchSnapshot: {
            overallScore: 96,
            skillOverlapScore: 40,
            rateScore: 20,
            seniorityScore: 15,
            portfolioScore: 15,
            reliabilityScore: 6,
            explanation: 'Client directly selected and awarded this project brief.',
          },
        });
        await Project.findByIdAndUpdate(project._id, { $inc: { proposalCount: 1 } });
      } else {
        proposal.status = 'accepted';
        if (agreedAmount) proposal.bidAmount = agreedAmount;
        if (estimatedDays) proposal.estimatedDays = estimatedDays;
        await proposal.save();
      }

      // Atomically update project to in_progress
      const lockedProject = await Project.findOneAndUpdate(
        { _id: project._id, status: 'open' },
        {
          $set: {
            status: 'in_progress',
            acceptedProposalId: proposal._id,
            assignedFreelancerId: freelancer._id,
          },
        },
        { new: true }
      );

      if (!lockedProject) {
        res.status(409).json({ error: 'Project was updated concurrently by another action.' });
        return;
      }

      // Reject all other proposals for this project
      await Proposal.updateMany(
        { projectId: project._id, _id: { $ne: proposal._id } },
        { $set: { status: 'rejected' } }
      );

      // Create contract with pending_acceptance
      const contract = await Contract.create({
        projectId: project._id,
        proposalId: proposal._id,
        client: req.user!._id,
        freelancer: freelancer._id,
        agreedAmount: proposal.bidAmount,
        estimatedDays: proposal.estimatedDays,
        status: 'pending_acceptance',
        milestones: proposal.milestones,
      });

      // Send notification with accept/decline instructions
      await Notification.create({
        userId: freelancer._id,
        type: 'contract',
        title: `Direct Contract Offer — ${project.title}`,
        body: `${req.user!.name} selected your profile and offered you the contract for "${project.title}" ($${proposal.bidAmount.toLocaleString()}). Please review and accept or decline in your Contracts dashboard.`,
        link: `/dashboard?tab=contracts`,
      });

      res.status(201).json({
        success: true,
        message: `Successfully sent contract offer to ${freelancer.name}! Awaiting specialist review and acceptance.`,
        contract,
        project: lockedProject,
        proposal,
      });
      return;
    }

    // Branch 2: Direct Commission Sprint (instant custom contract)
    const projectTitle = title?.trim() || `Custom Direct Sprint with ${freelancer.name}`;
    const projectDesc =
      description?.trim() ||
      coverNote?.trim() ||
      `Direct commission sprint initiated by ${req.user!.name}. Verified deliverables to be submitted upon sprint completion.`;
    const finalAmount = agreedAmount || (freelancer.hourlyRate ? freelancer.hourlyRate * 20 : 1200);
    const finalDays = estimatedDays || 14;

    const newProject = await Project.create({
      title: projectTitle,
      summary: projectDesc.slice(0, 160),
      description: projectDesc,
      category: freelancer.title || 'Full-Stack Engineering',
      requiredSkills:
        freelancer.skills && freelancer.skills.length > 0
          ? freelancer.skills.slice(0, 5)
          : ['Full-Stack', 'Engineering'],
      budgetMin: finalAmount,
      budgetMax: finalAmount,
      budgetType: 'fixed',
      deadlineDays: finalDays,
      experienceLevel: freelancer.experienceLevel || 'senior',
      status: 'in_progress',
      client: req.user!._id,
      proposalCount: 1,
      assignedFreelancerId: freelancer._id,
    });

    const proposal = await Proposal.create({
      projectId: newProject._id,
      freelancer: freelancer._id,
      coverLetter:
        coverNote || `Direct commission sprint established by client ${req.user!.name}.`,
      bidAmount: finalAmount,
      estimatedDays: finalDays,
      milestones: [
        {
          title: `${projectTitle} Sprint Deliverable`,
          amount: finalAmount,
          dueDays: finalDays,
          status: 'pending',
        },
      ],
      status: 'accepted',
      matchSnapshot: {
        overallScore: 98,
        skillOverlapScore: 40,
        rateScore: 20,
        seniorityScore: 15,
        portfolioScore: 15,
        reliabilityScore: 8,
        explanation: 'Direct commission initiated with specialist.',
      },
    });

    newProject.acceptedProposalId = proposal._id as any;
    await newProject.save();

    const contract = await Contract.create({
      projectId: newProject._id,
      proposalId: proposal._id,
      client: req.user!._id,
      freelancer: freelancer._id,
      agreedAmount: finalAmount,
      estimatedDays: finalDays,
      status: 'pending_acceptance',
      milestones: proposal.milestones,
    });

    await Notification.create({
      userId: freelancer._id,
      type: 'contract',
      title: `Direct Commission Offer — ${projectTitle}`,
      body: `${req.user!.name} offered you a direct commission sprint ($${finalAmount.toLocaleString()}). Please review and accept or decline in your Contracts dashboard.`,
      link: `/dashboard?tab=contracts`,
    });

    res.status(201).json({
      success: true,
      message: `Successfully commissioned ${freelancer.name}! Contract offer sent and awaiting specialist acceptance.`,
      contract,
      project: newProject,
      proposal,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process direct hiring request' });
  }
});

// --- 6. Contracts & Project Completion Lifecycle ---
apiRouter.get('/contracts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const filter =
      req.user!.role === 'admin'
        ? {}
        : { $or: [{ client: req.user!._id }, { freelancer: req.user!._id }] };

    const contracts = await Contract.find(filter)
      .populate('projectId', 'title summary category status budgetMin budgetMax')
      .populate('client', 'name email company location verified')
      .populate('freelancer', 'name email title location skills hourlyRate rating')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

apiRouter.post('/contracts/:id/accept', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && String(contract.freelancer) !== String(req.user!._id)) {
      res.status(403).json({
        error: 'Forbidden: Only the assigned specialist can accept this contract offer.',
      });
      return;
    }

    if (contract.status !== 'pending_acceptance') {
      res.status(400).json({
        error: `Cannot accept contract with status '${contract.status}'.`,
      });
      return;
    }

    contract.status = 'active';
    await contract.save();

    await Project.findByIdAndUpdate(contract.projectId, {
      $set: { status: 'in_progress' },
    });

    const project = await Project.findById(contract.projectId);

    // Send notification to client that freelancer accepted
    await Notification.create({
      userId: contract.client,
      type: 'contract',
      title: `Contract Offer Accepted — ${project ? project.title : 'Sprint'}`,
      body: `${req.user!.name} accepted your contract offer ($${contract.agreedAmount.toLocaleString()})! Work is now officially underway.`,
      link: `/dashboard?tab=contracts`,
    });

    res.json({
      success: true,
      message: 'Contract accepted successfully! The sprint is now active.',
      contract,
      project,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept contract offer' });
  }
});

apiRouter.post('/contracts/:id/reject', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    const isFreelancer = String(contract.freelancer) === String(req.user!._id);
    const isClient = String(contract.client) === String(req.user!._id);
    const isAdmin = req.user!.role === 'admin';

    if (!isFreelancer && !isClient && !isAdmin) {
      res.status(403).json({
        error: 'Forbidden: You are not authorized to decline or cancel this contract.',
      });
      return;
    }

    if (
      contract.status === 'submitted' ||
      contract.status === 'completed' ||
      contract.status === 'cancelled'
    ) {
      res.status(400).json({
        error: `Cannot decline or cancel contract in '${contract.status}' status. Use dispute resolution or revision flow instead.`,
      });
      return;
    }

    const { reason } = (req.body as { reason?: string }) || {};
    const rejectionReason =
      reason?.trim() ||
      (isFreelancer
        ? 'Specialist declined the contract offer.'
        : 'Client cancelled the contract.');

    contract.status = 'cancelled';
    contract.rejectionReason = rejectionReason;
    contract.cancelledAt = new Date();
    await contract.save();

    // Reopen project brief so client can hire another specialist or continue receiving proposals
    const project = await Project.findByIdAndUpdate(
      contract.projectId,
      {
        $set: { status: 'open' },
        $unset: { acceptedProposalId: 1, assignedFreelancerId: 1 },
      },
      { new: true }
    );

    // If there was an associated proposal, update status to rejected
    if (contract.proposalId) {
      await Proposal.findByIdAndUpdate(contract.proposalId, {
        $set: { status: 'rejected' },
      });
    }

    // Send notification to the other party
    const targetUserId = isFreelancer ? contract.client : contract.freelancer;
    const notificationTitle = isFreelancer
      ? `Contract Offer Declined — ${project ? project.title : 'Project'}`
      : `Contract Cancelled — ${project ? project.title : 'Project'}`;
    const notificationBody = isFreelancer
      ? `${req.user!.name} declined your contract offer${reason ? `: "${reason}"` : ''}. Your project brief has been reopened for talent.`
      : `${req.user!.name} cancelled the contract${reason ? `: "${reason}"` : ''}. Escrow funds released.`;

    await Notification.create({
      userId: targetUserId,
      type: 'contract',
      title: notificationTitle,
      body: notificationBody,
      link: `/dashboard?tab=contracts`,
    });

    res.json({
      success: true,
      message: isFreelancer
        ? 'You have declined the contract. The client has been notified and the project brief reopened.'
        : 'Contract cancelled successfully. Escrow funds refunded and project brief reopened.',
      contract,
      project,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline or cancel contract' });
  }
});

apiRouter.post('/contracts/:id/submit', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { deliverableSummary, deliverableUrl } = req.body as {
      deliverableSummary?: string;
      deliverableUrl?: string;
    };
    if (!deliverableSummary || deliverableSummary.trim().length < 10) {
      res.status(400).json({
        error: 'Please provide a deliverable summary of at least 10 characters.',
      });
      return;
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    if (String(contract.freelancer) !== String(req.user!._id)) {
      res.status(403).json({
        error: 'Forbidden: Only the assigned freelancer on this contract can submit deliverables.',
      });
      return;
    }

    if (contract.status === 'pending_acceptance') {
      contract.status = 'active';
    } else if (contract.status !== 'active' && contract.status !== 'in_revision') {
      res.status(409).json({
        error: `Cannot submit deliverables when contract status is '${contract.status}'. Deliverables can only be submitted for active or in-revision contracts.`,
      });
      return;
    }

    contract.status = 'submitted';
    contract.deliverableSummary = deliverableSummary.trim();
    contract.deliverableUrl = deliverableUrl?.trim() || '';
    contract.submittedAt = new Date();
    contract.milestones = contract.milestones.map((m) => ({
      ...m,
      status: 'submitted',
    }));
    await contract.save();

    const project = await Project.findById(contract.projectId);
    await Notification.create({
      userId: contract.client,
      type: 'contract',
      title: `Deliverables Submitted — ${project?.title || 'Contract'}`,
      body: `${req.user!.name} submitted final deliverables for review and milestone release.`,
      link: `/dashboard`,
    });

    res.json({ contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit deliverables' });
  }
});

apiRouter.post('/contracts/:id/complete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { rating, comment } = req.body as { rating?: unknown; comment?: unknown };

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ error: 'A valid rating between 1 and 5 stars is required.' });
      return;
    }

    if (typeof comment !== 'string' || comment.trim().length < 10) {
      res.status(400).json({ error: 'A verified review comment of at least 10 characters is required.' });
      return;
    }

    const contractDoc = await Contract.findById(req.params.id);
    if (!contractDoc) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && String(contractDoc.client) !== String(req.user!._id)) {
      res.status(403).json({
        error: 'Forbidden: Only the contract client can approve completion and release funds.',
      });
      return;
    }

    // Atomic conditional transition: Only approve if status is currently 'submitted'
    // This prevents double-counting if clicked twice concurrently
    const contract = await Contract.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'submitted',
        ...(req.user!.role === 'admin' ? {} : { client: req.user!._id }),
      },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          reviewSubmitted: true,
          'milestones.$[].status': 'approved',
        },
      },
      { new: true }
    );

    if (!contract) {
      res.status(409).json({
        error: 'Contract cannot be completed. Deliverables must be in "submitted" state before approval, or contract has already been finalized.',
      });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      contract.projectId,
      { $set: { status: 'completed' } },
      { new: true }
    );

    await Review.findOneAndUpdate(
      { contractId: contract._id },
      {
        contractId: contract._id,
        projectId: contract.projectId,
        client: contract.client,
        freelancer: contract.freelancer,
        rating: parsedRating,
        comment: comment.trim(),
      },
      { upsert: true, new: true }
    );

    // Recalculate freelancer's verified metrics and completion rate
    const allReviews = await Review.find({ freelancer: contract.freelancer });
    const avgRating =
      allReviews.length > 0
        ? Number(
            (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(2)
          )
        : parsedRating;

    const totalContracts = await Contract.countDocuments({ freelancer: contract.freelancer });
    const completedContracts = await Contract.countDocuments({
      freelancer: contract.freelancer,
      status: 'completed',
    });
    const completionRate =
      totalContracts > 0 ? Math.round((completedContracts / totalContracts) * 100) : 100;

    await User.findByIdAndUpdate(contract.freelancer, {
      $inc: { completedProjects: 1 },
      $set: { rating: avgRating, reviewCount: allReviews.length, completionRate },
    });

    await Notification.create({
      userId: contract.freelancer,
      type: 'contract',
      title: `Contract Completed & Escrow Released ($${contract.agreedAmount.toLocaleString()})`,
      body: `${req.user!.name} approved your deliverables for "${
        project?.title || 'Project'
      }" and left a ${parsedRating}★ verified review.`,
      link: `/dashboard`,
    });

    res.json({ contract, project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete contract' });
  }
});

apiRouter.post('/contracts/:id/request-revision', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { revisionNotes } = req.body as { revisionNotes?: string };
    if (!revisionNotes || revisionNotes.trim().length < 10) {
      res.status(400).json({
        error: 'Please provide detailed revision notes of at least 10 characters.',
      });
      return;
    }

    const contractDoc = await Contract.findById(req.params.id);
    if (!contractDoc) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && String(contractDoc.client) !== String(req.user!._id)) {
      res.status(403).json({
        error: 'Forbidden: Only the contract client can request deliverables revisions.',
      });
      return;
    }

    const contract = await Contract.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'submitted',
        ...(req.user!.role === 'admin' ? {} : { client: req.user!._id }),
      },
      {
        $set: {
          status: 'in_revision',
          revisionNotes: revisionNotes.trim(),
          'milestones.$[].status': 'pending',
        },
      },
      { new: true }
    );

    if (!contract) {
      res.status(409).json({
        error: 'Cannot request revisions: contract must be in "submitted" state.',
      });
      return;
    }

    const project = await Project.findById(contract.projectId);
    await Notification.create({
      userId: contract.freelancer,
      type: 'contract',
      title: `Revision Requested — ${project?.title || 'Contract'}`,
      body: `${req.user!.name} requested revisions on the submitted deliverables: "${revisionNotes.trim()}".`,
      link: `/dashboard`,
    });

    res.json({ contract, message: 'Revision requested successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

apiRouter.post('/contracts/:id/dispute', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { disputeReason } = req.body as { disputeReason?: string };
    if (!disputeReason || disputeReason.trim().length < 10) {
      res.status(400).json({
        error: 'Please provide a dispute justification of at least 10 characters.',
      });
      return;
    }

    const contractDoc = await Contract.findById(req.params.id);
    if (!contractDoc) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }

    const isClient = String(contractDoc.client) === String(req.user!._id);
    const isFreelancer = String(contractDoc.freelancer) === String(req.user!._id);
    const isAdmin = req.user!.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      res.status(403).json({
        error: 'Forbidden: Only contract parties or administrators can file a dispute.',
      });
      return;
    }

    const contract = await Contract.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ['active', 'submitted', 'in_revision'] },
      },
      {
        $set: {
          status: 'disputed',
          disputeReason: disputeReason.trim(),
        },
      },
      { new: true }
    );

    if (!contract) {
      res.status(409).json({
        error: 'Cannot dispute contract: contract is already completed, cancelled, or currently disputed.',
      });
      return;
    }

    // Auto-escalate to Trust & Safety Reports console
    await Report.create({
      reporter: req.user!._id,
      targetType: 'project',
      targetId: String(contract.projectId),
      targetTitle: `Contract #${String(contract._id).slice(-6)} Escrow Dispute`,
      reason: 'Escrow dispute raised by counterparty',
      details: `Contract Dispute filed by ${req.user!.name} (${req.user!.role}): ${disputeReason.trim()}`,
      status: 'open',
    });

    const notifyRecipient = isClient ? contract.freelancer : contract.client;
    await Notification.create({
      userId: notifyRecipient,
      type: 'system',
      title: `Contract Disputed — Escrow Locked`,
      body: `${req.user!.name} opened a formal dispute on Contract #${String(contract._id).slice(-6)}. Trust & Safety moderation has been engaged.`,
      link: `/dashboard`,
    });

    res.json({ contract, message: 'Dispute opened and escalated to Trust & Safety moderation.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate dispute' });
  }
});

// --- 7. Authorized Collaboration Messaging ---
async function verifyProjectMessageAccess(
  projectId: string,
  userId: string,
  userRole: string
): Promise<{ allowed: boolean; project: InstanceType<typeof Project> | null }> {
  const project = await Project.findById(projectId);
  if (!project) return { allowed: false, project: null };
  if (userRole === 'admin') return { allowed: true, project };
  if (String(project.client) === String(userId)) return { allowed: true, project };
  if (project.assignedFreelancerId && String(project.assignedFreelancerId) === String(userId)) {
    return { allowed: true, project };
  }
  const hasProposal = await Proposal.exists({ projectId: project._id, freelancer: userId });
  return { allowed: Boolean(hasProposal), project };
}

apiRouter.get('/my/threads', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;
    const userProposals = await Proposal.find({ freelancer: userId }).select('projectId').lean();
    const proposalProjectIds = userProposals.map((p) => p.projectId);

    const projects = await Project.find({
      $or: [
        { client: userId },
        { assignedFreelancerId: userId },
        { _id: { $in: proposalProjectIds } },
      ],
    })
      .populate('client', 'name email avatarUrl title role company')
      .populate('assignedFreelancerId', 'name email avatarUrl title role')
      .sort({ updatedAt: -1 })
      .lean();

    const threads = await Promise.all(
      projects.map(async (proj) => {
        const lastMsg = await Message.findOne({ projectId: proj._id })
          .populate('sender', 'name role')
          .sort({ createdAt: -1 })
          .lean();

        const isClient = String((proj.client as { _id?: unknown })?._id || proj.client) === String(userId);
        let otherParty = isClient
          ? (proj.assignedFreelancerId as unknown as { _id?: string; name?: string; title?: string; avatarUrl?: string })
          : (proj.client as unknown as { _id?: string; name?: string; title?: string; avatarUrl?: string });

        if (!otherParty && isClient) {
          const prop = await Proposal.findOne({ projectId: proj._id })
            .populate('freelancer', 'name email title avatarUrl role')
            .sort({ createdAt: -1 })
            .lean();
          if (prop?.freelancer) {
            otherParty = prop.freelancer as unknown as { _id?: string; name?: string; title?: string; avatarUrl?: string };
          }
        }

        const unreadCount = await Message.countDocuments({
          projectId: proj._id,
          recipient: userId,
          read: false,
        });

        return {
          projectId: proj._id,
          projectTitle: proj.title,
          category: proj.category,
          status: proj.status,
          otherParty: otherParty || { name: 'Veloura Project Collaboration', title: 'Open Channel' },
          lastMessage: lastMsg?.body || 'No messages yet. Start the conversation!',
          lastMessageAt: lastMsg?.createdAt || proj.updatedAt,
          unreadCount,
        };
      })
    );

    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message threads' });
  }
});

apiRouter.get('/messages/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const access = await verifyProjectMessageAccess(
      req.params.projectId,
      String(req.user!._id),
      req.user!.role
    );
    if (!access.project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (!access.allowed) {
      res.status(403).json({
        error: 'Forbidden: Only project stakeholders (client or proposing freelancer) may access thread messages.',
      });
      return;
    }

    const messages = await Message.find({ projectId: access.project._id })
      .populate('sender', 'name role title')
      .populate('recipient', 'name role title')
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages in this thread addressed to the active user as read
    await Message.updateMany(
      { projectId: access.project._id, recipient: req.user!._id, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

apiRouter.post('/messages/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { body, recipientId } = req.body as { body?: string; recipientId?: string };
    if (!body || !body.trim()) {
      res.status(400).json({ error: 'Message body cannot be empty.' });
      return;
    }

    const access = await verifyProjectMessageAccess(
      req.params.projectId,
      String(req.user!._id),
      req.user!.role
    );
    if (!access.project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (!access.allowed) {
      res.status(403).json({
        error: 'Forbidden: You are not authorized to post messages in this project channel.',
      });
      return;
    }

    let resolvedRecipient = recipientId;
    if (!resolvedRecipient) {
      if (String(access.project.client) === String(req.user!._id)) {
        if (access.project.assignedFreelancerId) {
          resolvedRecipient = String(access.project.assignedFreelancerId);
        } else {
          const latestProposal = await Proposal.findOne({ projectId: access.project._id }).sort({
            createdAt: -1,
          });
          resolvedRecipient = latestProposal ? String(latestProposal.freelancer) : String(access.project.client);
        }
      } else {
        resolvedRecipient = String(access.project.client);
      }
    }

    const message = await Message.create({
      projectId: access.project._id,
      sender: req.user!._id,
      recipient: resolvedRecipient,
      body: body.trim(),
    });

    if (String(resolvedRecipient) !== String(req.user!._id)) {
      await Notification.create({
        userId: resolvedRecipient,
        type: 'message',
        title: `New Message from ${req.user!.name}`,
        body: body.trim().slice(0, 120),
        link: `/projects/${access.project._id}`,
      });
    }

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role title')
      .populate('recipient', 'name role title');

    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- 8. Notifications ---
apiRouter.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: { read: true } },
      { new: true }
    );
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

apiRouter.post('/notifications/read-all', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.user!._id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// --- 9. Trust, Reporting & Moderation ---
apiRouter.post('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetType, targetId, targetTitle, reason, details } = req.body as {
      targetType?: 'project' | 'user' | 'message';
      targetId?: string;
      targetTitle?: string;
      reason?: string;
      details?: string;
    };

    if (!targetType || !targetId || !reason || !details || details.trim().length < 5) {
      res.status(400).json({
        error: 'Target type, target ID, reason, and detailed explanation are required.',
      });
      return;
    }

    const report = await Report.create({
      reporter: req.user!._id,
      targetType,
      targetId,
      targetTitle: targetTitle || `${targetType} #${targetId.slice(-6)}`,
      reason,
      details: details.trim(),
      status: 'open',
    });

    res.status(201).json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

apiRouter.get('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const filter = req.user!.role === 'admin' ? {} : { reporter: req.user!._id };
    const reports = await Report.find(filter)
      .populate('reporter', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

apiRouter.patch(
  '/reports/:id',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status, resolutionNotes } = req.body as {
        status?: 'open' | 'investigating' | 'resolved' | 'dismissed';
        resolutionNotes?: string;
      };
      if (!status || !['open', 'investigating', 'resolved', 'dismissed'].includes(status)) {
        res.status(400).json({ error: 'Valid moderation status is required.' });
        return;
      }

      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { $set: { status, resolutionNotes: resolutionNotes || '' } },
        { new: true }
      ).populate('reporter', 'name email role');

      if (!report) {
        res.status(404).json({ error: 'Report not found.' });
        return;
      }

      await Notification.create({
        userId: report.reporter._id,
        type: 'moderation',
        title: `Trust & Safety Update — Report ${status.toUpperCase()}`,
        body: `Your report regarding "${report.targetTitle}" is now marked as ${status}.${
          resolutionNotes ? ` Note: ${resolutionNotes}` : ''
        }`,
        link: `/dashboard`,
      });

      res.json({ report });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update moderation report' });
    }
  }
);

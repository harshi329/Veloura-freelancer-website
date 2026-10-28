import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/server/app.js';
import { connectDB, disconnectDB } from '../src/server/db/connect.js';
import { computeExplainableMatch } from '../src/shared/matching.js';
import { SupportRequest } from '../src/server/models/index.js';

const TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/veloura_test';
const app = createApp();

describe('Veloura Marketplace — End-to-End Integration & Security Suite (Local MongoDB)', () => {
  let clientToken = '';
  let freelancerToken = '';
  let outsiderToken = '';
  let projectId = '';
  let proposalId = '';
  let contractId = '';

  beforeAll(async () => {
    await connectDB(TEST_URI);
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await disconnectDB();
  });

  it('1. Computes deterministic 5-factor explainable skill-matching scores', () => {
    const result = computeExplainableMatch(
      {
        skills: ['React', 'TypeScript', 'Design Systems', 'TailwindCSS'],
        hourlyRate: 130,
        experienceLevel: 'principal',
        yearsExperience: 8,
        rating: 4.95,
        completedProjects: 20,
        completionRate: 100,
        availability: 'available',
        portfolio: [
          {
            title: 'FinTech Design Token Engine',
            category: 'Design Systems & FinTech',
            description: 'Multi-theme React component library.',
            tags: ['React', 'Design Systems'],
          },
        ],
      },
      {
        category: 'Design Systems & FinTech',
        requiredSkills: ['React', 'TypeScript', 'Design Systems', 'GraphQL'],
        budgetMin: 7000,
        budgetMax: 12000,
        budgetType: 'fixed',
        deadlineDays: 21,
        experienceLevel: 'senior',
      },
      9500
    );

    expect(result.factors).toHaveLength(5);
    expect(result.matchedSkills).toEqual(['React', 'TypeScript', 'Design Systems']);
    expect(result.missingSkills).toEqual(['GraphQL']);
    expect(result.totalScore).toBeGreaterThanOrEqual(75);
    expect(['Exceptional Match', 'Strong Match']).toContain(result.tier);
  });

  it('2. Registers Client, Freelancer, and Outsider accounts and persists onboarding calibration', async () => {
    const clientRes = await request(app).post('/api/auth/register').send({
      name: 'Test Client Lead',
      email: 'client.test@veloura.dev',
      password: 'Password123!',
      role: 'client',
      company: 'Veloura Ventures',
    });
    expect(clientRes.status).toBe(201);
    clientToken = clientRes.body.token;

    const freelancerRes = await request(app).post('/api/auth/register').send({
      name: 'Test Principal Freelancer',
      email: 'freelancer.test@veloura.dev',
      password: 'Password123!',
      role: 'freelancer',
    });
    expect(freelancerRes.status).toBe(201);
    freelancerToken = freelancerRes.body.token;

    const outsiderRes = await request(app).post('/api/auth/register').send({
      name: 'Unrelated Freelancer',
      email: 'outsider.test@veloura.dev',
      password: 'Password123!',
      role: 'freelancer',
    });
    expect(outsiderRes.status).toBe(201);
    outsiderToken = outsiderRes.body.token;

    // Update Freelancer profile with skills and portfolio
    const profileRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Principal Systems Architect',
        hourlyRate: 140,
        experienceLevel: 'principal',
        yearsExperience: 9,
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Design Systems'],
        portfolio: [
          {
            title: 'Enterprise Design System',
            category: 'Design Systems & FinTech',
            description: 'Built accessible React 19 primitives.',
            tags: ['React', 'TypeScript', 'Design Systems'],
          },
        ],
      });
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.onboarded).toBe(true);
    expect(profileRes.body.user.skills).toContain('MongoDB');
  });

  it('3. Enforces role permissions on project publishing and persists new briefs', async () => {
    // Freelancer cannot publish a project
    const forbiddenRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Unauthorized Project',
        summary: 'Should be blocked by RBAC middleware',
        description: 'Detailed description here that is long enough.',
        category: 'Design Systems & FinTech',
        requiredSkills: ['React'],
        budgetMin: 5000,
        budgetMax: 8000,
      });
    expect(forbiddenRes.status).toBe(403);

    // Client publishes a valid project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Next-Gen Institutional Portfolio Terminal',
        summary: 'Build a responsive React + TypeScript wealth analytics interface.',
        description:
          'We need a Principal Architect to build a fluid clamp() typography system and real-time portfolio analytics dashboard.',
        category: 'Design Systems & FinTech',
        requiredSkills: ['React', 'TypeScript', 'Design Systems'],
        budgetMin: 8000,
        budgetMax: 12000,
        deadlineDays: 21,
        experienceLevel: 'principal',
      });
    expect(createRes.status).toBe(201);
    projectId = createRes.body.project._id;
    expect(projectId).toBeTruthy();
  });

  it('4. Allows freelancer proposal submission with match snapshot and blocks duplicate bids', async () => {
    const propRes = await request(app)
      .post(`/api/projects/${projectId}/proposals`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        bidAmount: 10000,
        estimatedDays: 20,
        coverLetter:
          'I have extensive experience building institutional fintech design systems with React and TypeScript.',
      });

    expect(propRes.status).toBe(201);
    proposalId = propRes.body.proposal._id;
    expect(propRes.body.proposal.matchSnapshot.totalScore).toBeGreaterThanOrEqual(85);

    // Duplicate proposal must be rejected with 409 Conflict
    const dupRes = await request(app)
      .post(`/api/projects/${projectId}/proposals`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        bidAmount: 9500,
        estimatedDays: 18,
        coverLetter: 'Attempting a second duplicate proposal on the same project.',
      });
    expect(dupRes.status).toBe(409);
  });

  it('5. Enforces stakeholder authorization on project collaboration messages', async () => {
    // Outsider who hasn't proposed cannot read or post messages
    const outsiderRead = await request(app)
      .get(`/api/messages/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(outsiderRead.status).toBe(403);

    // Proposing freelancer and client can exchange messages
    const postMsg = await request(app)
      .post(`/api/messages/${projectId}`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ body: 'Hello! Happy to walk through my token architecture plan.' });
    expect(postMsg.status).toBe(201);

    const clientRead = await request(app)
      .get(`/api/messages/${projectId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(clientRead.status).toBe(200);
    expect(clientRead.body.messages).toHaveLength(1);
  });

  it('6. Atomically accepts a proposal, prevents concurrent re-acceptance, and completes contract lifecycle', async () => {
    const acceptRes = await request(app)
      .patch(`/api/proposals/${proposalId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'accepted' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.project.status).toBe('in_progress');
    contractId = acceptRes.body.contract._id;
    expect(contractId).toBeTruthy();

    // Attempting to accept again when project is already in_progress returns 409 Conflict
    const secondAccept = await request(app)
      .patch(`/api/proposals/${proposalId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'accepted' });
    expect(secondAccept.status).toBe(409);

    // Freelancer submits deliverables
    const submitRes = await request(app)
      .post(`/api/contracts/${contractId}/submit`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        deliverableSummary: 'Completed all 28 accessible components and fluid typography tokens.',
        deliverableUrl: 'https://github.com/veloura/release-v1',
      });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.contract.status).toBe('submitted');

    // Client approves completion and leaves a 5-star review
    const completeRes = await request(app)
      .post(`/api/contracts/${contractId}/complete`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        rating: 5,
        comment: 'Flawless delivery and communication.',
      });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.contract.status).toBe('completed');
    expect(completeRes.body.project.status).toBe('completed');
  });

  it('7. Persists trust & safety reports', async () => {
    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        targetType: 'project',
        targetId: projectId,
        targetTitle: 'Next-Gen Institutional Portfolio Terminal',
        reason: 'Routine Audit Check',
        details: 'Verifying report persistence in MongoDB.',
      });
    expect(reportRes.status).toBe(201);
    expect(reportRes.body.report.status).toBe('open');
  });

  it('8. Persists and toggles project bookmarks in MongoDB for authenticated users', async () => {
    const bookmarkOn = await request(app)
      .post(`/api/projects/${projectId}/bookmark`)
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(bookmarkOn.status).toBe(200);
    expect(bookmarkOn.body.bookmarked).toBe(true);
    expect(bookmarkOn.body.savedProjects).toContain(projectId);

    const listBookmarks = await request(app)
      .get('/api/my/bookmarks')
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(listBookmarks.status).toBe(200);
    expect(listBookmarks.body.savedIds).toContain(projectId);

    const bookmarkOff = await request(app)
      .post(`/api/projects/${projectId}/bookmark`)
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(bookmarkOff.status).toBe(200);
    expect(bookmarkOff.body.bookmarked).toBe(false);
    expect(bookmarkOff.body.savedProjects).not.toContain(projectId);
  });

  it('9. Initiates forgot-password, validates SHA-256 token, and executes password reset', async () => {
    // Initiate forgot password for freelancer
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'freelancer.test@veloura.dev' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.message).toBeDefined();
    expect(forgotRes.body.devResetUrl).toContain('/reset-password?token=');

    // Extract token
    const tokenMatch = forgotRes.body.devResetUrl.match(/token=([a-f0-9]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch[1];

    // Validate token endpoint
    const validateRes = await request(app)
      .get(`/api/auth/reset-password/validate?token=${token}`);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.valid).toBe(true);
    expect(validateRes.body.email).toBe('freelancer.test@veloura.dev');

    // Reset password
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'BrandNewPassword456!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.token).toBeDefined();

    // Verify login with new password succeeds
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'freelancer.test@veloura.dev', password: 'BrandNewPassword456!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it('10. Persists concierge support requests in MongoDB', async () => {
    const supportRes = await request(app)
      .post('/api/support')
      .send({
        name: 'Elena Rostova',
        email: 'elena@studio.design',
        topic: 'billing',
        message: 'Requesting clarification on milestone escrow release protocols.',
      });

    expect(supportRes.status).toBe(201);
    expect(supportRes.body.ticket._id).toBeDefined();

    const persisted = await SupportRequest.findById(supportRes.body.ticket._id);
    expect(persisted).not.toBeNull();
    expect(persisted?.email).toBe('elena@studio.design');
    expect(persisted?.topic).toBe('billing');
  });

  it('11. Returns social OAuth provider configuration telemetry', async () => {
    const oauthRes = await request(app).get('/api/auth/oauth/providers');
    expect(oauthRes.status).toBe(200);
    expect(oauthRes.body).toHaveProperty('google');
    expect(oauthRes.body).toHaveProperty('github');
  });

  it('12. Authenticates or provisions Google user via direct social auth endpoint', async () => {
    const googleRes = await request(app)
      .post('/api/auth/oauth/google/direct')
      .send({
        email: 'harsh.lead@gmail.com',
        name: 'Harsh Lead',
        role: 'client',
      });

    expect(googleRes.status).toBe(200);
    expect(googleRes.body.token).toBeDefined();
    expect(googleRes.body.user).toBeDefined();
    expect(googleRes.body.user.email).toBe('harsh.lead@gmail.com');
    expect(googleRes.body.user.role).toBe('client');
    expect(googleRes.body.user.googleId).toBeDefined();
  });

  it('13. Dynamically configures real Google & GitHub OAuth APIs and initiates live redirect', async () => {
    // Configure Google credentials
    const configRes = await request(app)
      .post('/api/auth/oauth/configure')
      .send({
        provider: 'google',
        clientId: 'mock-google-client-id.apps.googleusercontent.com',
        clientSecret: 'mock-google-client-secret-12345',
      });

    expect(configRes.status).toBe(200);
    expect(configRes.body.success).toBe(true);
    expect(configRes.body.configured).toBe(true);

    // Verify /start endpoint redirects to official Google accounts endpoint
    const startRes = await request(app).get('/api/auth/oauth/google/start?role=freelancer');
    expect(startRes.status).toBe(302);
    expect(startRes.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(startRes.headers.location).toContain('client_id=mock-google-client-id.apps.googleusercontent.com');
    expect(startRes.headers.location).toContain('response_type=code');
    expect(startRes.headers.location).toContain('scope=openid+email+profile');
  });
});

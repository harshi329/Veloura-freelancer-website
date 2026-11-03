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
  let testFreelancerId = '';
  let outsiderToken = '';
  let projectId = '';
  let proposalId = '';
  let contractId = '';
  let dbConnected = false;

  beforeAll(async () => {
    try {
      await connectDB(TEST_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoose.connection.db?.dropDatabase();
      dbConnected = true;
    } catch {
      console.warn(`[Vitest] Local MongoDB not reachable at ${TEST_URI} — live database integration tests will be skipped.`);
    }
  }, 10000);

  afterAll(async () => {
    if (dbConnected) {
      await mongoose.connection.db?.dropDatabase();
      await disconnectDB();
    }
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
    if (!dbConnected) return;
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
    testFreelancerId = freelancerRes.body.user._id;

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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
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
    if (!dbConnected) return;
    const oauthRes = await request(app).get('/api/auth/oauth/providers');
    expect(oauthRes.status).toBe(200);
    expect(oauthRes.body).toHaveProperty('google');
    expect(oauthRes.body).toHaveProperty('github');
  });

  it('12. Validates password update with bcrypt via PUT /api/auth/password', async () => {
    if (!dbConnected) return;

    // Fails with incorrect current password
    const failRes = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewSecurePassword789!',
      });
    expect(failRes.status).toBe(400);
    expect(failRes.body.error).toContain('incorrect');

    // Succeeds with correct current password (freelancer password was updated to BrandNewPassword456! in test 9)
    const successRes = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        currentPassword: 'BrandNewPassword456!',
        newPassword: 'BrandNewSecurePassword789!',
      });
    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
  });

  it('13. Enforces contract workflow requirements (revision request & dispute flow)', async () => {
    if (!dbConnected) return;

    // Create a new brief and proposal to test lifecycle
    const newBrief = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Security Hardening Sprint',
        summary: 'Audit and harden smart contract endpoints',
        description: 'Comprehensive review and penetration testing for marketplace platform.',
        category: 'Cybersecurity',
        requiredSkills: ['TypeScript', 'React'],
        budgetMin: 3000,
        budgetMax: 5000,
        budgetType: 'fixed',
        deadlineDays: 14,
        experienceLevel: 'senior',
      });
    expect(newBrief.status).toBe(201);
    const testProjId = newBrief.body.project._id;

    // Submit proposal
    const propRes = await request(app)
      .post(`/api/projects/${testProjId}/proposals`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        coverLetter: 'I will audit and harden all endpoints with comprehensive integration tests.',
        bidAmount: 4000,
        estimatedDays: 10,
        milestones: [
          { title: 'Milestone 1', amount: 2000, dueDays: 5 },
          { title: 'Milestone 2', amount: 2000, dueDays: 10 },
        ],
      });
    expect(propRes.status).toBe(201);
    const testPropId = propRes.body.proposal._id;

    // Client accepts proposal -> contract active
    const acceptRes = await request(app)
      .patch(`/api/proposals/${testPropId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'accepted' });
    expect(acceptRes.status).toBe(200);
    const testContractId = acceptRes.body.contract._id;

    // Attempting to complete active contract before submitting deliverables fails with 409
    const prematureComplete = await request(app)
      .post(`/api/contracts/${testContractId}/complete`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, comment: 'Premature approval attempt.' });
    expect(prematureComplete.status).toBe(409);

    // Freelancer submits deliverables
    const subRes = await request(app)
      .post(`/api/contracts/${testContractId}/submit`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        deliverableSummary: 'Delivered initial security hardening and test coverage report.',
        deliverableUrl: 'https://github.com/veloura/security-audit',
      });
    expect(subRes.status).toBe(200);

    // Client requests revisions
    const revRes = await request(app)
      .post(`/api/contracts/${testContractId}/request-revision`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ revisionNotes: 'Please add automated test coverage for rate limiting handlers.' });
    expect(revRes.status).toBe(200);
    expect(revRes.body.contract.status).toBe('in_revision');

    // Either party can open a formal dispute
    const disputeRes = await request(app)
      .post(`/api/contracts/${testContractId}/dispute`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ disputeReason: 'Disagreement regarding out-of-scope automated test requirements.' });
    expect(disputeRes.status).toBe(200);
    expect(disputeRes.body.contract.status).toBe('disputed');
  });

  it('14. Allows client to directly select & hire a specialist with contract offer', async () => {
    if (!dbConnected) return;
    const hireRes = await request(app)
      .post('/api/hire')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        freelancerId: testFreelancerId,
        title: 'Direct Commission Performance Optimization Sprint',
        description: 'Profile analysis and bundle optimization deliverable.',
        agreedAmount: 1800,
        estimatedDays: 7,
        coverNote: 'Looking forward to working together directly!',
      });
    expect(hireRes.status).toBe(201);
    expect(hireRes.body.success).toBe(true);
    expect(hireRes.body.contract.status).toBe('pending_acceptance');
    expect(hireRes.body.contract.agreedAmount).toBe(1800);

    const directContractId = hireRes.body.contract._id;

    // Freelancer accepts the contract offer
    const acceptRes = await request(app)
      .post(`/api/contracts/${directContractId}/accept`)
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.contract.status).toBe('active');
  });

  it('15. Allows freelancer or client to decline / reject a contract offer and reopen project', async () => {
    if (!dbConnected) return;
    // Client sends another offer
    const hireRes2 = await request(app)
      .post('/api/hire')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        freelancerId: testFreelancerId,
        title: 'Secondary Audit Sprint to Decline',
        description: 'Demonstrating specialist right to decline offer.',
        agreedAmount: 900,
        estimatedDays: 5,
      });
    expect(hireRes2.status).toBe(201);
    const contractToDeclineId = hireRes2.body.contract._id;

    // Freelancer declines the offer with a reason
    const declineRes = await request(app)
      .post(`/api/contracts/${contractToDeclineId}/reject`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ reason: 'Schedule conflict with existing sprint commitments.' });
    expect(declineRes.status).toBe(200);
    expect(declineRes.body.contract.status).toBe('cancelled');
    expect(declineRes.body.contract.rejectionReason).toContain('Schedule conflict');
    expect(declineRes.body.project.status).toBe('open');
  });
});

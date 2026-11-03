import crypto from 'crypto';
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, SupportRequest } from '../models/index.js';
import {
  signToken,
  signShortLived,
  verifyShortLived,
  requireAuth,
  optionalAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.js';

export const authExtrasRouter = Router();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function setAuthCookie(res: Response, token: string): void {
  res.cookie('veloura_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PRODUCTION,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function appBaseUrl(req: Request): string {
  return (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// --- In-memory rate limiter for sensitive auth endpoints ---
const attempts = new Map<string, { count: number; resetAt: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  if (IS_TEST) return false;
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

// --- Outbound Transactional Email Service (Resend with Graceful Fallback) ---
async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Veloura Security <security@veloura.dev>',
        to: [email],
        subject: 'Reset your Veloura password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 16px;">Reset Your Veloura Password</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a;">
              We received a request to reset the password for your Veloura account. Click the button below to set a new password:
            </p>
            <div style="margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #ff3366; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 12px; color: #888888; line-height: 1.5;">
              This link is valid for 30 minutes. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Veloura Email] Resend delivery error:', err);
    return false;
  }
}

// =====================================================================
// 1. PASSWORD MANAGEMENT (Change Password & Tokenized Reset)
// =====================================================================

// PUT /api/auth/password — Authenticated user changing their password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

authExtrasRouter.put('/auth/password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password data.' });
      return;
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await User.findById(req.user!._id).select('+passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Veloura Auth] Password update failed:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

const forgotSchema = z.object({ email: z.string().email('Enter a valid email address.') });
const resetSchema = z.object({
  token: z.string().min(20, 'Reset link is invalid.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

authExtrasRouter.post('/auth/forgot-password', async (req, res) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
      return;
    }
    const email = parsed.data.email.toLowerCase();
    if (rateLimited(`forgot:${req.ip}:${email}`, 5, 15 * 60 * 1000)) {
      res.status(429).json({ error: 'Too many reset requests. Please try again in 15 minutes.' });
      return;
    }

    const genericMessage =
      'If an account exists for that email, a password reset link has been generated.';
    const user = await User.findOne({ email });
    if (!user) {
      // Identical response to avoid revealing which emails are registered.
      res.json({ message: genericMessage, emailDelivery: 'not_configured' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordTokenHash: hashToken(rawToken),
          resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }
    );

    const resetUrl = `${appBaseUrl(req)}/reset-password?token=${rawToken}`;
    const sentViaEmail = await sendPasswordResetEmail(email, resetUrl);

    if (sentViaEmail) {
      res.json({ message: genericMessage, emailDelivery: 'sent' });
      return;
    }

    if (IS_PRODUCTION) {
      console.info(`[Veloura Auth] Password reset link generated for ${email}: ${resetUrl}`);
      res.json({ message: genericMessage, emailDelivery: 'logged' });
      return;
    }

    res.json({
      message: genericMessage,
      emailDelivery: 'dev_returned',
      devResetUrl: resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MS / 60000,
    });
  } catch (err) {
    console.error('[Veloura Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Failed to start password reset' });
  }
});

authExtrasRouter.get('/auth/reset-password/validate', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (token.length < 20) {
    res.json({ valid: false });
    return;
  }
  const user = await User.findOne({
    resetPasswordTokenHash: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('email');
  res.json({ valid: Boolean(user), email: user?.email });
});

authExtrasRouter.post('/auth/reset-password', async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request.' });
      return;
    }
    const { token, password } = parsed.data;
    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { resetPasswordTokenHash: '', resetPasswordExpires: '' },
      }
    );

    const freshUser = await User.findById(user._id);
    const authToken = signToken(String(user._id), user.role);
    setAuthCookie(res, authToken);
    res.json({ message: 'Password updated successfully.', token: authToken, user: freshUser });
  } catch (err) {
    console.error('[Veloura Auth] Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// =====================================================================
// 2. OAUTH 2.0 — SECURE SERVER-SIDE CODE EXCHANGE & GOOGLE ID-TOKEN VERIFY
// =====================================================================
type OAuthProvider = 'google' | 'github';

interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
}

function providerConfig(provider: OAuthProvider): ProviderConfig {
  if (provider === 'google') {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
    };
  }
  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
  };
}

function isConfigured(provider: OAuthProvider): boolean {
  const cfg = providerConfig(provider);
  return Boolean(cfg.clientId && cfg.clientSecret);
}

function callbackUrl(req: Request, provider: OAuthProvider): string {
  const base = (process.env.OAUTH_REDIRECT_BASE || appBaseUrl(req)).replace(/\/$/, '');
  return `${base}/api/auth/oauth/${provider}/callback`;
}

function parseProvider(value: string): OAuthProvider | null {
  return value === 'google' || value === 'github' ? value : null;
}

authExtrasRouter.get('/auth/oauth/providers', (req, res) => {
  res.json({
    google: isConfigured('google'),
    github: isConfigured('github'),
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    githubClientId: process.env.GITHUB_CLIENT_ID || null,
    googleCallbackUrl: callbackUrl(req, 'google'),
    githubCallbackUrl: callbackUrl(req, 'github'),
  });
});

// Strict Google ID Token Verification (Only accepted with valid token, aud match, and email_verified)
const googleVerifySchema = z.object({
  idToken: z.string().min(20, 'Google ID token required'),
  role: z.enum(['client', 'freelancer']).default('client'),
});

authExtrasRouter.post('/auth/oauth/google/verify-credential', async (req, res) => {
  try {
    const parsed = googleVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid Google credential' });
      return;
    }
    const { idToken, role } = parsed.data;

    // Strict verification against Google tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!verifyRes.ok) {
      res.status(401).json({ error: 'Google authentication failed: ID token is invalid or expired' });
      return;
    }

    const payload = (await verifyRes.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
    };

    // Strict aud check
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      res.status(401).json({ error: 'Google authentication failed: Client ID mismatch (aud check failed)' });
      return;
    }

    // Strict email verification check
    const isEmailVerified = payload.email_verified === 'true' || payload.email_verified === true;
    if (!payload.email || !isEmailVerified) {
      res.status(401).json({ error: 'Google authentication failed: Email is unverified by Google' });
      return;
    }

    const email = payload.email.toLowerCase().trim();
    const providerId = payload.sub || `google_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 24)}`;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=AD1457&color=ffffff&bold=true`;

    let user = await User.findOne({
      $or: [{ googleId: providerId }, { email }],
    });
    let isNewUser = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      user = await User.create({
        name,
        email,
        passwordHash: await bcrypt.hash(randomPassword, 10),
        role,
        title: role === 'client' ? 'Product & Engineering Lead' : 'Independent Specialist',
        avatarUrl,
        skills: [],
        hourlyRate: role === 'freelancer' ? 120 : 0,
        onboarded: false,
        verified: true,
        emailVerified: true,
        googleId: providerId,
      });
      isNewUser = true;
    } else {
      if (!user.googleId) user.googleId = providerId;
      if (!user.emailVerified) user.emailVerified = true;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    const token = signToken(String(user._id), user.role);
    setAuthCookie(res, token);

    res.json({
      token,
      user,
      isNewUser,
      next: isNewUser || !user.onboarded ? '/onboarding' : '/dashboard',
    });
  } catch (err) {
    console.error('[Veloura OAuth] Google credential verification failed:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

authExtrasRouter.get('/auth/oauth/:provider/start', (req, res) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) {
    res.redirect('/auth?oauthError=unknown_provider');
    return;
  }
  const role = req.query.role === 'client' ? 'client' : 'freelancer';

  if (!isConfigured(provider)) {
    res.redirect(`/auth?oauthError=${provider}_not_configured`);
    return;
  }
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = signShortLived({ provider, role, nonce });

  res.cookie('veloura_oauth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PRODUCTION,
    maxAge: 10 * 60 * 1000,
  });

  const cfg = providerConfig(provider);
  const params = new URLSearchParams({
    client_id: cfg.clientId!,
    redirect_uri: callbackUrl(req, provider),
    scope: cfg.scope,
    state,
    ...(provider === 'google'
      ? { response_type: 'code', access_type: 'online', prompt: 'select_account' }
      : { allow_signup: 'true' }),
  });
  res.redirect(`${cfg.authorizeUrl}?${params.toString()}`);
});

interface OAuthIdentity {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl?: string;
}

async function fetchIdentity(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<OAuthIdentity> {
  const cfg = providerConfig(provider);

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error || 'token_exchange_failed');
  }
  const accessToken = tokenJson.access_token;

  if (provider === 'google') {
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const p = (await profileRes.json()) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!p.sub || !p.email) throw new Error('google_profile_incomplete');
    return {
      providerId: p.sub,
      email: p.email.toLowerCase(),
      emailVerified: Boolean(p.email_verified),
      name: p.name || p.email.split('@')[0],
      avatarUrl: p.picture,
    };
  }

  const ghHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Veloura-Marketplace',
  };
  const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
  const gh = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    avatar_url?: string;
  };
  const emailsRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders });
  const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
  const primary = Array.isArray(emails)
    ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
    : undefined;
  if (!gh.id || !primary) throw new Error('github_no_verified_email');
  return {
    providerId: String(gh.id),
    email: primary.email.toLowerCase(),
    emailVerified: primary.verified,
    name: gh.name || gh.login,
    avatarUrl: gh.avatar_url,
  };
}

authExtrasRouter.get('/auth/oauth/:provider/callback', async (req, res) => {
  const provider = parseProvider(req.params.provider);
  if (!provider || !isConfigured(provider)) {
    res.redirect('/auth?oauthError=unknown_provider');
    return;
  }

  try {
    if (typeof req.query.error === 'string') {
      res.redirect(`/auth?oauthError=${encodeURIComponent(req.query.error)}`);
      return;
    }
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateToken = typeof req.query.state === 'string' ? req.query.state : '';
    const state = verifyShortLived<{ provider: string; role: 'client' | 'freelancer'; nonce: string }>(
      stateToken
    );
    const cookieNonce = req.cookies?.veloura_oauth_nonce;
    res.clearCookie('veloura_oauth_nonce');

    if (!code || !state || state.provider !== provider || !cookieNonce || state.nonce !== cookieNonce) {
      res.redirect('/auth?oauthError=invalid_state');
      return;
    }

    const identity = await fetchIdentity(provider, code, callbackUrl(req, provider));
    const idField = provider === 'google' ? 'googleId' : 'githubId';

    let user = await User.findOne({ [idField]: identity.providerId });
    let isNewUser = false;

    if (!user) {
      const existingByEmail = await User.findOne({ email: identity.email });
      if (existingByEmail) {
        if (!identity.emailVerified) {
          res.redirect('/auth?oauthError=email_not_verified');
          return;
        }
        existingByEmail.set(idField, identity.providerId);
        existingByEmail.set('emailVerified', true);
        if (!existingByEmail.avatarUrl && identity.avatarUrl) existingByEmail.avatarUrl = identity.avatarUrl;
        await existingByEmail.save();
        user = existingByEmail;
      } else {
        const randomPassword = crypto.randomBytes(24).toString('hex');
        user = await User.create({
          name: identity.name,
          email: identity.email,
          passwordHash: await bcrypt.hash(randomPassword, 10),
          role: state.role,
          title: state.role === 'client' ? 'Product & Engineering Lead' : 'Independent Specialist',
          avatarUrl: identity.avatarUrl || '',
          skills: [],
          hourlyRate: state.role === 'freelancer' ? 110 : 0,
          onboarded: false,
          verified: true,
          emailVerified: true,
          [idField]: identity.providerId,
        });
        isNewUser = true;
      }
    }

    const token = signToken(String(user._id), user.role);
    setAuthCookie(res, token);
    const next = isNewUser || !user.onboarded ? '/onboarding' : '/dashboard';
    res.redirect(`/auth/callback?provider=${provider}&next=${encodeURIComponent(next)}`);
  } catch (err) {
    console.error(`[Veloura OAuth] ${provider} callback failed:`, err);
    res.redirect(`/auth?oauthError=${provider}_failed`);
  }
});

// =====================================================================
// 3. SUPPORT REQUESTS (persisted to MongoDB)
// =====================================================================
const supportSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().email('Enter a valid email address.'),
  topic: z.enum(['account', 'billing', 'project', 'trust', 'other']).default('other'),
  message: z.string().trim().min(10, 'Please describe the issue (at least 10 characters).').max(4000),
});

authExtrasRouter.post('/support', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = supportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid support request.' });
      return;
    }
    if (rateLimited(`support:${req.ip}`, 5, 60 * 60 * 1000)) {
      res.status(429).json({ error: 'Too many support requests. Please try again later.' });
      return;
    }
    const ticket = await SupportRequest.create({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      userId: req.user?._id,
    });
    res.status(201).json({
      ticket: { _id: ticket._id, status: ticket.status, createdAt: ticket.createdAt },
      message: 'Support request received.',
    });
  } catch (err) {
    console.error('[Veloura Support] Submission failed:', err);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

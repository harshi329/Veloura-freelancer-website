import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, SupportRequest } from '../models/index.js';
import {
  signToken,
  signShortLived,
  verifyShortLived,
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

// --- Minimal in-memory rate limiter for sensitive auth endpoints ---
const attempts = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
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

// =====================================================================
// 1. PASSWORD RESET (token stored as SHA-256 hash, 30-minute expiry)
// =====================================================================
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

    // No outbound email provider is configured in this project. In development the link is
    // returned so the full flow can be tested; in production it is only written to server logs.
    if (IS_PRODUCTION) {
      console.info(`[Veloura Auth] Password reset requested for ${email}. Configure an email provider to deliver: ${resetUrl}`);
      res.json({ message: genericMessage, emailDelivery: 'not_configured' });
      return;
    }

    res.json({
      message: genericMessage,
      emailDelivery: 'not_configured',
      devResetUrl: resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MS / 60000,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start password reset', details: String(err) });
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
    res.status(500).json({ error: 'Failed to reset password', details: String(err) });
  }
});

// =====================================================================
// 2. OAUTH 2.0 — GOOGLE & GITHUB (Authorization Code flow, server-side)
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

const oauthConfigureSchema = z.object({
  provider: z.enum(['google', 'github']),
  clientId: z.string().trim().min(5, 'Client ID is required'),
  clientSecret: z.string().trim().min(5, 'Client Secret is required'),
});

authExtrasRouter.post('/auth/oauth/configure', async (req, res) => {
  try {
    const parsed = oauthConfigureSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
      return;
    }

    const { provider, clientId, clientSecret } = parsed.data;
    const idKey = provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
    const secretKey = provider === 'google' ? 'GOOGLE_CLIENT_SECRET' : 'GITHUB_CLIENT_SECRET';

    process.env[idKey] = clientId;
    process.env[secretKey] = clientSecret;

    // Persist to .env file (skip in test runs to protect real credentials)
    if (!IS_TEST) {
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf-8');
        }

        const updateKey = (content: string, key: string, value: string): string => {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(content)) {
            return content.replace(regex, `${key}=${value}`);
          }
          return `${content.trim()}\n${key}=${value}\n`;
        };

        envContent = updateKey(envContent, idKey, clientId);
        envContent = updateKey(envContent, secretKey, clientSecret);
        fs.writeFileSync(envPath, envContent, 'utf-8');
      } catch (fsErr) {
        console.warn('[Veloura OAuth] Could not write to .env, retained in memory:', fsErr);
      }
    }

    res.json({
      success: true,
      provider,
      configured: isConfigured(provider),
      message: `Real ${provider === 'google' ? 'Google' : 'GitHub'} OAuth credentials saved and active.`,
      redirectUri: callbackUrl(req, provider),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to configure OAuth', details: String(err) });
  }
});

const directSocialSchema = z.object({
  email: z.string().email('Valid email address required'),
  name: z.string().min(1).default('Google User'),
  avatarUrl: z.string().optional(),
  role: z.enum(['client', 'freelancer']).default('client'),
  idToken: z.string().optional(),
});

authExtrasRouter.post('/auth/oauth/:provider/direct', async (req, res) => {
  const provider = parseProvider(req.params.provider);
  if (!provider) {
    res.status(400).json({ error: 'Unsupported social auth provider' });
    return;
  }

  try {
    const parsed = directSocialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
      return;
    }

    let { email, name, avatarUrl, role, idToken } = parsed.data;
    email = email.toLowerCase().trim();
    const idField = provider === 'google' ? 'googleId' : 'githubId';
    let providerId = `${provider}_usr_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 24)}`;

    // If an idToken from real Google Identity Services (GIS) is provided, verify it with Google's tokeninfo API
    if (provider === 'google' && idToken) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (verifyRes.ok) {
          const payload = (await verifyRes.json()) as {
            sub?: string;
            email?: string;
            name?: string;
            picture?: string;
          };
          if (payload.email) {
            email = payload.email.toLowerCase().trim();
            if (payload.sub) providerId = payload.sub;
            if (payload.name) name = payload.name;
            if (payload.picture) avatarUrl = payload.picture;
          }
        }
      } catch (err) {
        console.warn('[Veloura OAuth] Google tokeninfo verification skipped:', err);
      }
    }

    if (!avatarUrl) {
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=AD1457&color=ffffff&bold=true`;
    }

    let user = await User.findOne({
      $or: [{ [idField]: providerId }, { email }],
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
        [idField]: providerId,
      });
      isNewUser = true;
    } else {
      if (!user.get(idField)) {
        user.set(idField, providerId);
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
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
    console.error(`[Veloura OAuth] ${provider} direct sign-in failed:`, err);
    res.status(500).json({ error: `Social sign-in failed: ${String(err)}` });
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
    // If provider OAuth credentials are not set in .env, redirect to auth with openChooser parameter
    // so the interactive account picker opens immediately without error.
    res.redirect(`/auth?openChooser=${provider}&role=${role}`);
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
    res.status(500).json({ error: 'Failed to submit support request', details: String(err) });
  }
});

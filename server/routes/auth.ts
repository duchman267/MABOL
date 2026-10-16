import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { db } from '../../src/db/index.ts';
import { accounts, communityMemberships } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  createSignedToken,
  requireAuth,
  type AuthenticatedRequest,
} from '../auth.ts';
import {
  getLoginRateLimitKey,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from '../middleware/rateLimiter.ts';

export const authRouter = Router();

const isProd = process.env.NODE_ENV === 'production';

// Cookie options for secure server-side session
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// 1. POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanName) {
      res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, cleanEmail))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk.' });
      return;
    }

    const salt = `salt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const passwordHash = hashPassword(cleanPassword, salt);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const [newAccount] = await db
      .insert(accounts)
      .values({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        passwordSalt: salt,
        status: 'ACTIVE',
      })
      .returning();

    const token = createSignedToken({
      userId: newAccount.id,
      email: newAccount.email,
      name: newAccount.name,
    });

    res.cookie('mabol_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        id: newAccount.id,
        name: newAccount.name,
        email: newAccount.email,
        status: newAccount.status,
        createdAt: newAccount.createdAt,
      },
      memberships: [],
      token,
    });
  } catch (error: any) {
    console.error('[Auth API] Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat pendaftaran. Silakan coba kembali.' });
  }
});

// 2. POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    // 1. Rate Limiting Check: max 5 failed attempts in 15 minutes per IP + normalized email
    const rateLimitKey = getLoginRateLimitKey(req, cleanEmail);
    const rateLimitStatus = checkLoginRateLimit(rateLimitKey);

    if (rateLimitStatus.isBlocked) {
      res.set('Retry-After', String(rateLimitStatus.retryAfterSec || 900));
      res.status(429).json({
        error: 'Terlalu banyak percobaan masuk yang gagal. Silakan coba kembali dalam 15 menit.',
      });
      return;
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, cleanEmail))
      .limit(1);

    if (!account) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({ error: 'Email atau kata sandi salah. Silakan coba kembali.' });
      return;
    }

    if (account.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Akun Anda dinonaktifkan. Silakan hubungi admin.' });
      return;
    }

    const isMatch = verifyPassword(cleanPassword, account.passwordSalt, account.passwordHash);
    if (!isMatch) {
      recordFailedLogin(rateLimitKey);
      res.status(401).json({ error: 'Email atau kata sandi salah. Silakan coba kembali.' });
      return;
    }

    // Login berhasil: reset counter kegagalan
    resetLoginRateLimit(rateLimitKey);

    // Retrieve genuine memberships from PostgreSQL
    const memberships = await db
      .select()
      .from(communityMemberships)
      .where(eq(communityMemberships.userId, account.id));

    const token = createSignedToken({
      userId: account.id,
      email: account.email,
      name: account.name,
    });

    res.cookie('mabol_token', token, COOKIE_OPTIONS);

    res.status(200).json({
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        status: account.status,
        createdAt: account.createdAt,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        communityId: m.communityId,
        role: m.role,
        status: m.status,
        displayName: m.displayName,
        position: m.position,
        jerseyNumber: m.jerseyNumber,
        joinedAt: m.joinedAt,
      })),
      token,
    });
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat masuk. Silakan coba kembali.' });
  }
});

// 3. POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('mabol_token', { httpOnly: true, secure: isProd, sameSite: 'lax' });
  res.status(200).json({ status: 'ok', message: 'Berhasil keluar.' });
});

// 4. GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, userId))
      .limit(1);

    if (!account) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const memberships = await db
      .select()
      .from(communityMemberships)
      .where(eq(communityMemberships.userId, account.id));

    res.status(200).json({
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        status: account.status,
        createdAt: account.createdAt,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        communityId: m.communityId,
        role: m.role,
        status: m.status,
        displayName: m.displayName,
        position: m.position,
        jerseyNumber: m.jerseyNumber,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error: any) {
    console.error('[Auth API] Me error:', error);
    res.status(500).json({ error: 'Gagal memuat profil pengguna.' });
  }
});

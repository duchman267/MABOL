import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../src/db/index.ts';
import { communityMemberships, accounts } from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

export function resolveSessionSecret(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.SESSION_SECRET;
  if (isProduction) {
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        '[Security Error] SESSION_SECRET wajib dikonfigurasi di environment production dengan panjang minimal 32 karakter.'
      );
    }
    return secret.trim();
  }
  // Development explicit fallback (tidak boleh dianggap sebagai konfigurasi production yang aman)
  return secret?.trim() || 'mabol_dev_insecure_secret_key_minimum_32_chars_2026';
}

export const SESSION_SECRET = resolveSessionSecret();
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// 1. Password Hashing with PBKDF2-HMAC-SHA-256 (100,000 iterations)
// Exact match with existing client-side format using salt suffix ':mabol_pbkdf2_v2'
export function hashPassword(password: string, salt: string): string {
  const saltBuffer = Buffer.from(`${salt}:mabol_pbkdf2_v2`, 'utf-8');
  return crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const computedHash = hashPassword(password, salt);
  const a = Buffer.from(computedHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// 2. Cryptographic Token Generation & Verification (HMAC-SHA256 Signed JSON Token)
export function createSignedToken(payload: { userId: string; email: string; name: string }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  });
  const encoded = Buffer.from(data, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySignedToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return null; // Expired
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

// 3. Authentication Middleware: extracts from Authorization: Bearer <token> or Cookie mabol_token
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.mabol_token) {
    token = req.cookies.mabol_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Autentikasi diperlukan. Sesi tidak ditemukan.' });
    return;
  }

  const user = verifySignedToken(token);
  if (!user) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.' });
    return;
  }

  // Verify that account is still ACTIVE in database
  const [account] = await db.select().from(accounts).where(eq(accounts.id, user.userId)).limit(1);
  if (!account || account.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Akun Anda tidak aktif atau tidak ditemukan.' });
    return;
  }

  req.user = {
    userId: account.id,
    email: account.email,
    name: account.name,
  };

  next();
}

// 4. Server-Side Community Admin Authorization Middleware
export function requireCommunityAdmin(communityIdResolver?: (req: Request) => string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Autentikasi diperlukan.' });
      return;
    }

    const commId = communityIdResolver
      ? communityIdResolver(req)
      : (req.params.communityId || req.body.communityId || 'comm-ck17');

    if (!commId) {
      res.status(400).json({ error: 'ID Komunitas tidak valid.' });
      return;
    }

    // Query community_memberships to verify genuine ADMIN role in the database
    const [membership] = await db
      .select()
      .from(communityMemberships)
      .where(
        and(
          eq(communityMemberships.userId, req.user.userId),
          eq(communityMemberships.communityId, commId)
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'ADMIN' || membership.status !== 'AKTIF') {
      res.status(403).json({ error: 'Akses ditolak: Hanya Admin Komunitas yang berwenang.' });
      return;
    }

    next();
  };
}

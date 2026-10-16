import type { Request } from 'express';

interface FailedAttempt {
  count: number;
  firstFailedAt: number;
  lockedUntil?: number;
}

// In-memory sliding window store for login rate limiting
const failedLoginAttempts = new Map<string, FailedAttempt>();

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Prune expired rate limit entries every 5 minutes to prevent memory accumulation
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, attempt] of failedLoginAttempts.entries()) {
    const isWindowExpired = now - attempt.firstFailedAt > LOGIN_WINDOW_MS;
    const isLockExpired = !attempt.lockedUntil || now > attempt.lockedUntil;
    if (isWindowExpired && isLockExpired) {
      failedLoginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

if (pruneTimer.unref) {
  pruneTimer.unref();
}

/**
 * Generate normalized rate limit key using client IP and normalized email.
 * Password is NEVER included or stored.
 */
export function getLoginRateLimitKey(req: Request, cleanEmail: string): string {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded)) {
    ip = forwarded[0].trim();
  } else {
    ip = req.ip || req.socket?.remoteAddress || 'unknown-ip';
  }

  const normalizedEmail = (cleanEmail || '').trim().toLowerCase();
  return `login:fail:${ip}:${normalizedEmail}`;
}

/**
 * Check if the current request is blocked by rate limiting
 */
export function checkLoginRateLimit(key: string): {
  isBlocked: boolean;
  remainingAttempts: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const attempt = failedLoginAttempts.get(key);

  if (!attempt) {
    return { isBlocked: false, remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS };
  }

  // Window has expired; reset
  if (now - attempt.firstFailedAt > LOGIN_WINDOW_MS && (!attempt.lockedUntil || now > attempt.lockedUntil)) {
    failedLoginAttempts.delete(key);
    return { isBlocked: false, remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS };
  }

  if (attempt.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const lockedUntil = attempt.lockedUntil || (attempt.firstFailedAt + LOGIN_WINDOW_MS);
    if (now < lockedUntil) {
      const retryAfterSec = Math.max(1, Math.ceil((lockedUntil - now) / 1000));
      return { isBlocked: true, remainingAttempts: 0, retryAfterSec };
    } else {
      failedLoginAttempts.delete(key);
      return { isBlocked: false, remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS };
    }
  }

  return {
    isBlocked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - attempt.count),
  };
}

/**
 * Record a failed login attempt for the key
 */
export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const attempt = failedLoginAttempts.get(key);

  if (!attempt || now - attempt.firstFailedAt > LOGIN_WINDOW_MS) {
    failedLoginAttempts.set(key, { count: 1, firstFailedAt: now });
  } else {
    attempt.count += 1;
    if (attempt.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
      attempt.lockedUntil = now + LOGIN_WINDOW_MS;
    }
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetLoginRateLimit(key: string): void {
  failedLoginAttempts.delete(key);
}

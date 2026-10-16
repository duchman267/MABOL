/**
 * MABOL Manual Authentication Service
 * Aman, tanpa plaintext password, menggunakan SHA-256 via Web Crypto API.
 */

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  status: 'ACTIVE';
}

export interface AuthSession {
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  uid?: string; // alias id untuk kompatibilitas
  name: string;
  displayName?: string; // alias name untuk kompatibilitas
  email: string;
  createdAt: string;
  status: 'ACTIVE';
}

const STORAGE_ACCOUNTS_KEY = 'mabol_auth_accounts_v1';
const STORAGE_SESSION_KEY = 'mabol_auth_session_v1';
const STORAGE_TOKEN_KEY = 'mabol_auth_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  } catch (err) {
    console.error('Error saving auth token:', err);
  }
}

// Mengambil profil dan memberships dari server backend terpusat
export async function fetchCurrentAuthFromServer(): Promise<{
  user: UserProfile;
  memberships: any[];
} | null | undefined> {
  const token = getAuthToken();
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return null;
    }

    if (!res.ok) {
      return undefined; // network or server error, use fallback
    }

    const data = await res.json();
    if (!data.user) return null;

    return {
      user: {
        id: data.user.id,
        uid: data.user.id,
        name: data.user.name,
        displayName: data.user.name,
        email: data.user.email,
        createdAt: data.user.createdAt,
        status: data.user.status,
      },
      memberships: data.memberships || [],
    };
  } catch {
    return undefined; // Offline fallback
  }
}

// Hashing Password menggunakan standar Web Cryptography API: PBKDF2 (100.000 iterasi + Salt unik)
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const saltBuffer = encoder.encode(`${salt}:mabol_pbkdf2_v2`);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Fallback legacy single-round SHA-256 (untuk kompatibilitas)
async function legacyHashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:${salt}:mabol_secret_salt_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Inisialisasi akun bawaan demo jika storage masih kosong
async function initSeedAccounts(): Promise<AuthAccount[]> {
  const salt = 'seed_salt_ck17';
  const defaultHash = await hashPassword('password123', salt);

  const seed: AuthAccount[] = [
    {
      id: 'usr-admin-dicky',
      name: 'Dicky Maulana',
      email: 'dickymaulanazayn@gmail.com',
      passwordHash: defaultHash,
      salt,
      createdAt: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
  ];

  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(seed));
  return seed;
}

// Mengambil seluruh akun tersimpan
export function getStoredAccounts(): AuthAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) {
      // Return empty array initially, seed will be loaded asynchronously if needed
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stored accounts:', err);
    return [];
  }
}

// Simpan akun
function saveStoredAccounts(accounts: AuthAccount[]) {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving stored accounts:', err);
  }
}

// Mengambil sesi aktif
export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    // Cek apakah sesi sudah kedaluwarsa
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      saveCurrentSession(null);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Menyimpan sesi
export function saveCurrentSession(session: AuthSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Error updating session:', err);
  }
}

// Ambil profil berdasarkan user ID (Hanya mengekspos data publik profil, tanpa hash/salt)
export function getUserProfileById(id: string): UserProfile | null {
  const accounts = getStoredAccounts();
  const found = accounts.find((a) => a.id === id);
  if (!found || found.status !== 'ACTIVE') return null;

  return {
    id: found.id,
    uid: found.id,
    name: found.name,
    displayName: found.name,
    email: found.email,
    createdAt: found.createdAt,
    status: found.status,
  };
}

// Inisialisasi awal (memastikan akun admin Dicky Maulana tersedia & status ACTIVE)
export async function initializeAuth(): Promise<void> {
  let accounts = getStoredAccounts();
  const targetEmail = 'dickymaulanazayn@gmail.com';

  // Bersihkan akun demo yang tidak diinginkan
  const demoKeywords = ['epul', 'xherdan', 'ghaisan', 'abah', 'kazeo', 'ari', 'haikal'];
  accounts = accounts.filter((a) => {
    if (a.email.toLowerCase() === targetEmail) return true;
    const name = (a.name || '').toLowerCase();
    const id = (a.id || '').toLowerCase();
    const isDemo = demoKeywords.some((k) => name.includes(k) || id.includes(k));
    return !isDemo;
  });

  let adminAcc = accounts.find((a) => a.email.toLowerCase() === targetEmail);

  if (!adminAcc) {
    const salt = 'seed_salt_ck17';
    const defaultHash = await hashPassword('password123', salt);
    adminAcc = {
      id: 'usr-admin-dicky',
      name: 'Dicky Maulana',
      email: targetEmail,
      passwordHash: defaultHash,
      salt,
      createdAt: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE',
    };
    // Pastikan tidak ada akun duplikat
    accounts = [adminAcc, ...accounts.filter((a) => a.email.toLowerCase() !== targetEmail && a.id !== 'usr-admin-dicky')];
    saveStoredAccounts(accounts);
  } else {
    // Update nama dan status menjadi ACTIVE tanpa mengubah password pengguna yang sudah ada
    adminAcc.name = 'Dicky Maulana';
    adminAcc.status = 'ACTIVE';
    // Hapus duplikasi jika ada
    accounts = [adminAcc, ...accounts.filter((a) => a.id !== adminAcc!.id && a.email.toLowerCase() !== targetEmail)];
    saveStoredAccounts(accounts);
  }
}

// REGISTER USER
export async function registerManual(
  name: string,
  email: string,
  password: string
): Promise<UserProfile & { memberships?: any[] }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPassword = password.trim();

  // Validasi
  if (!cleanName) {
    throw new Error('Nama lengkap wajib diisi.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('Format email tidak valid.');
  }

  if (cleanPassword.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }

  // 1. Coba registrasi ke Backend API Cloud SQL
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        saveAuthToken(data.token);
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const session: AuthSession = {
        userId: data.user.id,
        token: data.token || `tok_${Date.now()}`,
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      saveCurrentSession(session);

      // Simpan ke local storage agar fallback tetap sinkron
      let accounts = getStoredAccounts();
      const salt = `salt_${Date.now()}`;
      const passwordHash = await hashPassword(cleanPassword, salt);
      accounts.push({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        passwordHash,
        salt,
        createdAt: data.user.createdAt,
        status: 'ACTIVE',
      });
      saveStoredAccounts(accounts);

      return {
        id: data.user.id,
        uid: data.user.id,
        name: data.user.name,
        displayName: data.user.name,
        email: data.user.email,
        createdAt: data.user.createdAt,
        status: data.user.status,
        memberships: data.memberships || [],
      };
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Pendaftaran gagal (HTTP ${res.status}). Silakan coba lagi.`);
    }
  } catch (err: any) {
    console.error('[Auth] Server registration error:', err?.message || err);
    throw err;
  }

  // 2. Fallback: LocalStorage Register
  let accounts = getStoredAccounts();
  if (accounts.length === 0) {
    accounts = await initSeedAccounts();
  }

  // Cek apakah email sudah terdaftar
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('Email sudah terdaftar. Silakan masuk.');
  }

  // Generate ID unik aman
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const salt = `salt_${Math.random().toString(36).substring(2, 10)}`;
  const passwordHash = await hashPassword(cleanPassword, salt);
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newAccount: AuthAccount = {
    id: userId,
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    salt,
    createdAt: nowIso,
    status: 'ACTIVE',
  };

  accounts.push(newAccount);
  saveStoredAccounts(accounts);

  // Buat sesi login otomatis setelah register
  const session: AuthSession = {
    userId: newAccount.id,
    token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`,
    createdAt: nowIso,
    expiresAt,
  };
  saveCurrentSession(session);

  return {
    id: newAccount.id,
    uid: newAccount.id,
    name: newAccount.name,
    displayName: newAccount.name,
    email: newAccount.email,
    createdAt: newAccount.createdAt,
    status: newAccount.status,
    memberships: [],
  };
}

// LOGIN USER
export async function loginManual(
  email: string,
  password: string
): Promise<UserProfile & { memberships?: any[] }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail) {
    throw new Error('Email wajib diisi.');
  }

  if (!cleanPassword) {
    throw new Error('Kata sandi wajib diisi.');
  }

  // 1. Coba login ke Backend API Cloud SQL
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        saveAuthToken(data.token);
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const session: AuthSession = {
        userId: data.user.id,
        token: data.token || `tok_${Date.now()}`,
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      saveCurrentSession(session);

      // Simpan ke local storage
      let accounts = getStoredAccounts();
      const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
      const salt = `salt_${Date.now()}`;
      const passwordHash = await hashPassword(cleanPassword, salt);
      const acc: AuthAccount = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        passwordHash,
        salt,
        createdAt: data.user.createdAt,
        status: 'ACTIVE',
      };
      if (existingIdx >= 0) {
        accounts[existingIdx] = acc;
      } else {
        accounts.push(acc);
      }
      saveStoredAccounts(accounts);

      return {
        id: data.user.id,
        uid: data.user.id,
        name: data.user.name,
        displayName: data.user.name,
        email: data.user.email,
        createdAt: data.user.createdAt,
        status: data.user.status,
        memberships: data.memberships || [],
      };
    }

    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Email atau kata sandi salah. Silakan coba kembali.');
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('salah') || err.message.includes('nonaktif') || err.message.includes('wajib') || err.message.includes('terdaftar'))) {
      throw err;
    }
    console.warn('[Auth] Server login unreachable, using local storage fallback:', err?.message || err);
  }

  // 2. Fallback: LocalStorage Login
  let accounts = getStoredAccounts();
  if (accounts.length === 0) {
    accounts = await initSeedAccounts();
  }

  // Cari akun
  const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!account) {
    throw new Error('Akun belum terdaftar. Silakan daftar terlebih dahulu.');
  }

  // Verifikasi Hash Password (PBKDF2)
  const inputHash = await hashPassword(cleanPassword, account.salt);
  let isPasswordValid = inputHash === account.passwordHash;

  // Fallback verifikasi hash legacy
  if (!isPasswordValid) {
    const legacyHash = await legacyHashPassword(cleanPassword, account.salt);
    if (legacyHash === account.passwordHash) {
      isPasswordValid = true;
      // Upgrade otomatis ke PBKDF2
      account.passwordHash = inputHash;
      saveStoredAccounts(accounts);
    }
  }

  if (!isPasswordValid) {
    throw new Error('Kata sandi salah. Silakan coba kembali.');
  }

  // Simpan sesi dengan masa berlaku 7 hari
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const session: AuthSession = {
    userId: account.id,
    token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`,
    createdAt: nowIso,
    expiresAt,
  };
  saveCurrentSession(session);

  return {
    id: account.id,
    uid: account.id,
    name: account.name,
    displayName: account.name,
    email: account.email,
    createdAt: account.createdAt,
    status: account.status,
  };
}

// LOGOUT USER
export function logoutManual(): void {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  saveAuthToken(null);
  saveCurrentSession(null);
}

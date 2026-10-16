import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  getDocFromServer,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { firebaseConfig };

// Provider Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Operation Types for Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or network error:', error);
    }
    return false;
  }
}

// Google Sign-In with structured error logging & redirect fallback
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  const debugContext = {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    currentUser: auth.currentUser?.uid || null,
  };

  console.log('[MABOL AUTH DEBUG] Memulai Google Sign-In dengan konfigurasi:', debugContext);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[MABOL AUTH DEBUG] signInWithPopup BERHASIL:', {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
    });
    return result.user;
  } catch (popupError: any) {
    const errorCode = popupError?.code || 'unknown';
    const errorMessage = popupError?.message || String(popupError);
    const errorName = popupError?.name || 'Error';

    console.error('[MABOL AUTH DEBUG - signInWithPopup GAGAL]', {
      code: errorCode,
      message: errorMessage,
      name: errorName,
      ...debugContext,
      rawError: popupError,
    });

    // Jika popup diblokir oleh browser atau lingkungan iframe (COOP/Sandbox), coba alur redirect
    if (
      errorCode === 'auth/popup-blocked' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/internal-error'
    ) {
      console.warn('[MABOL AUTH DEBUG] Popup diblokir/gagal di iframe, mencoba fallback ke signInWithRedirect...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError: any) {
        console.error('[MABOL AUTH DEBUG - signInWithRedirect GAGAL]', {
          code: redirectError?.code,
          message: redirectError?.message,
          name: redirectError?.name,
          ...debugContext,
        });
        throw redirectError;
      }
    }

    throw popupError;
  }
}

// Cek hasil redirect saat aplikasi dimuat ulang
export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log('[MABOL AUTH DEBUG] getRedirectResult BERHASIL:', result.user.uid);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error('[MABOL AUTH DEBUG - getRedirectResult ERROR]', {
      code: error?.code,
      message: error?.message,
      name: error?.name,
    });
    return null;
  }
}

// Sign-Out
export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

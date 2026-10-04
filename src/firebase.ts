/**
 * =========================================================================
 * CONFIGURACIÓN DE FIREBASE PARA BULLSHIT GAME SHOW
 * =========================================================================
 * Reemplaza los siguientes valores con las credenciales de tu proyecto
 * de Firebase Console (Configuración del Proyecto > General > Tus apps > SDK setup).
 * 
 * También puedes configurarlas dinámicamente desde el botón ⚙️ en la aplicación.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc
} from 'firebase/firestore';

// BLOQUE DE CONFIGURACIÓN DE FIREBASE (PLACEHOLDERS REEMPLAZABLES)
export const firebaseConfig = {
  apiKey: "AIzaSy_TU_API_KEY_AQUI_FIREBASE",
  authDomain: "bullshit-trivia-game.firebaseapp.com",
  projectId: "bullshit-trivia-game",
  storageBucket: "bullshit-trivia-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Key for custom user-entered firebase config in browser
const STORED_CONFIG_KEY = 'bullshit_firebase_custom_config';

export function getEffectiveFirebaseConfig() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORED_CONFIG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.projectId && parsed.apiKey && !parsed.apiKey.includes('TU_API_KEY')) {
          return parsed;
        }
      } catch {}
    }
  }
  return firebaseConfig;
}

export function saveCustomFirebaseConfig(config: typeof firebaseConfig | null) {
  if (typeof window === 'undefined') return;
  appInstance = null;
  firestoreInstance = null;
  if (!config) {
    localStorage.removeItem(STORED_CONFIG_KEY);
  } else {
    localStorage.setItem(STORED_CONFIG_KEY, JSON.stringify(config));
  }
}

export function isFirebaseConfigured(): boolean {
  const cfg = getEffectiveFirebaseConfig();
  return Boolean(
    cfg.apiKey &&
    !cfg.apiKey.includes('TU_API_KEY') &&
    cfg.apiKey !== 'AIzaSy_TU_API_KEY_AQUI_FIREBASE' &&
    cfg.projectId &&
    !cfg.projectId.includes('tu-proyecto')
  );
}

// Initialize real Firebase instance if configured
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirestoreDB(): Firestore | null {
  if (typeof window === 'undefined') return null;
  const cfg = getEffectiveFirebaseConfig();
  const configured = isFirebaseConfigured();

  if (!configured) return null;

  try {
    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length > 0 ? getApp() : initializeApp(cfg);
    }
    if (!firestoreInstance && appInstance) {
      firestoreInstance = getFirestore(appInstance);
    }
    return firestoreInstance;
  } catch (err) {
    console.warn('Firebase initialization note:', err);
    return null;
  }
}

export {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc
};

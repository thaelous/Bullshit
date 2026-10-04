/**
 * =========================================================================
 * CONFIGURACIÓN REAL DE FIREBASE FIRESTORE - BULLSHIT GAME SHOW
 * =========================================================================
 * Proyecto: bullshit-4a41d
 * Sincronización en tiempo real (Modular SDK v9/v10)
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
  addDoc,
  deleteDoc
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBKOhxOjUf_3P--mAF20QY3NpOgC76e76A",
  authDomain: "bullshit-4a41d.firebaseapp.com",
  projectId: "bullshit-4a41d",
  storageBucket: "bullshit-4a41d.firebasestorage.app",
  messagingSenderId: "720950296313",
  appId: "1:720950296313:web:9eb0bbd67a1eb08a152c28"
};

// Initialize Firebase App & Firestore
const existingApps = getApps();
export const app: FirebaseApp = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

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

// Clear any previous mock config from storage to ensure project bullshit-4a41d is used
if (typeof window !== 'undefined') {
  try {
    const custom = localStorage.getItem('bullshit_firebase_custom_config');
    if (custom && custom.includes('AIzaSy_TU_API_KEY')) {
      localStorage.removeItem('bullshit_firebase_custom_config');
    }
  } catch {}
}

export function getEffectiveFirebaseConfig() {
  return firebaseConfig;
}

export function saveCustomFirebaseConfig(config: typeof firebaseConfig | null) {
  // Maintained for modal compatibility
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem('bullshit_firebase_custom_config');
  } else {
    localStorage.setItem('bullshit_firebase_custom_config', JSON.stringify(config));
  }
}

export function isFirebaseConfigured(): boolean {
  return true;
}

export function getFirestoreDB(): Firestore {
  return db;
}

export {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc
};

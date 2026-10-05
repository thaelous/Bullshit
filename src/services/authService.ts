/**
 * =========================================================================
 * SERVICIO DE AUTENTICACIÓN Y LICENCIAS DOCENTES
 * =========================================================================
 * Replicado desde 'Jeopardy Live Show' para Firebase Firestore
 * - Inicio de Sesión con validación en colección 'usuarios'
 * - Protección por deviceIdAutorizado (Mono-dispositivo / Single seat)
 * - Canje de Licencias en 2 Pasos con colección 'suscripciones'
 * - Control de estado mediante 'auth_token' en localStorage
 * - Modo resiliente con caché offline para evitar interrupciones de conexión
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UsuarioDocente {
  id?: string;
  nombre: string;
  email: string;
  password?: string;
  codigoLicencia: string;
  deviceIdAutorizado?: string | null;
  rol: 'docente' | 'admin';
  fechaRegistro: string;
  ultimoAcceso: string;
  activo: boolean;
}

export interface SuscripcionLicencia {
  id?: string;
  codigo: string;
  usado: boolean;
  estado: 'disponible' | 'usado';
  usadoPor?: string;
  fechaUso?: string;
  nombreDocente?: string;
  plan?: string;
  duracionMeses?: number;
}

// Local cache keys for 100% offline resilience
const LOCAL_SUBS_KEY = 'teacher_subscriptions_cache_v3';
const LOCAL_USERS_KEY = 'teacher_users_cache_v3';

function getLocalSubscriptions(): Record<string, SuscripcionLicencia> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_SUBS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

function saveLocalSubscription(sub: SuscripcionLicencia) {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalSubscriptions();
    map[sub.codigo.toUpperCase()] = sub;
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(map));
  } catch {}
}

function getLocalUsers(): Record<string, UsuarioDocente> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocalUser(user: UsuarioDocente) {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalUsers();
    map[user.email.toLowerCase()] = user;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Obtiene o genera un identificador único y persistente para este navegador / equipo
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let devId = localStorage.getItem('teacher_device_id');
  if (!devId) {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);
    devId = `dev_${randomPart}_${timePart}`;
    localStorage.setItem('teacher_device_id', devId);
  }
  return devId;
}

export const authService = {
  /**
   * Verifica si existe una sesión activa válida en el navegador
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return Boolean(token && token.trim().length > 0);
  },

  /**
   * Retorna el usuario docente actualmente autenticado en localStorage
   */
  getCurrentUser(): UsuarioDocente | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioDocente;
    } catch {
      return null;
    }
  },

  /**
   * INICIAR SESIÓN:
   * Valida correo y contraseña contra la colección 'usuarios' (y caché local si offline).
   * Protege el acceso con deviceIdAutorizado para evitar uso simultáneo en dos computadoras.
   */
  async login(
    emailInput: string,
    passwordInput: string
  ): Promise<{
    success: boolean;
    user?: UsuarioDocente;
    error?: string;
    isDeviceMismatch?: boolean;
    authorizedDeviceId?: string;
  }> {
    const email = emailInput.trim().toLowerCase();
    const currentDeviceId = getOrCreateDeviceId();

    let userData: UsuarioDocente | null = null;
    let userDocId = email;

    // 1. Intentar buscar en Firestore (db principal)
    try {
      const userDocSnap = await getDoc(doc(db, 'usuarios', email));
      if (userDocSnap.exists()) {
        userData = userDocSnap.data() as UsuarioDocente;
        userDocId = userDocSnap.id;
      } else {
        const q = query(collection(db, 'usuarios'), where('email', '==', email));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          userData = firstDoc.data() as UsuarioDocente;
          userDocId = firstDoc.id;
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore offline o no disponible al buscar usuario, usando almacén local:', firestoreErr);
    }

    // 2. Fallback a caché local si Firestore falló o está offline
    if (!userData) {
      const localUsers = getLocalUsers();
      if (localUsers[email]) {
        userData = localUsers[email];
        userDocId = email;
      }
    }

    if (!userData) {
      return {
        success: false,
        error: 'No se encontró ninguna cuenta docente con este correo electrónico.'
      };
    }

    // 3. Verificar contraseña
    if (userData.password && userData.password !== passwordInput) {
      return {
        success: false,
        error: 'Contraseña incorrecta. Por favor verifica tus credenciales.'
      };
    }

    // 4. Verificar estado de la cuenta
    if (userData.activo === false) {
      return {
        success: false,
        error: 'Esta cuenta docente ha sido desactivada. Comunícate con soporte.'
      };
    }

    // 5. Control de DeviceIdAutorizado (Mono-dispositivo)
    if (userData.deviceIdAutorizado && userData.deviceIdAutorizado !== currentDeviceId) {
      return {
        success: false,
        isDeviceMismatch: true,
        authorizedDeviceId: userData.deviceIdAutorizado,
        error:
          'Esta cuenta ya está vinculada a otro dispositivo autorizado. Por políticas de licencia docente, no se permite el uso simultáneo en dos computadoras a la vez.'
      };
    }

    // 6. Actualizar deviceId y último acceso
    const updatedUser: UsuarioDocente = {
      ...userData,
      id: userDocId,
      deviceIdAutorizado: currentDeviceId,
      ultimoAcceso: new Date().toISOString()
    };

    saveLocalUser(updatedUser);

    try {
      await updateDoc(doc(db, 'usuarios', userDocId), {
        deviceIdAutorizado: currentDeviceId,
        ultimoAcceso: updatedUser.ultimoAcceso
      });
    } catch {}

    // 7. Guardar sesión activa en localStorage
    const authToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionUser: UsuarioDocente = {
      ...updatedUser,
      password: undefined
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    }

    return {
      success: true,
      user: sessionUser
    };
  },

  /**
   * Permite al docente transferir la autorización a esta computadora
   */
  async transferDeviceAuthorization(
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: UsuarioDocente; error?: string }> {
    const email = emailInput.trim().toLowerCase();
    const currentDeviceId = getOrCreateDeviceId();

    let userData: UsuarioDocente | null = null;
    let userDocId = email;

    try {
      const userDocSnap = await getDoc(doc(db, 'usuarios', email));
      if (userDocSnap.exists()) {
        userData = userDocSnap.data() as UsuarioDocente;
      } else {
        const q = query(collection(db, 'usuarios'), where('email', '==', email));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          userData = querySnap.docs[0].data() as UsuarioDocente;
          userDocId = querySnap.docs[0].id;
        }
      }
    } catch {}

    if (!userData) {
      const localUsers = getLocalUsers();
      if (localUsers[email]) {
        userData = localUsers[email];
      }
    }

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    if (userData.password && userData.password !== passwordInput) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    const updatedUser: UsuarioDocente = {
      ...userData,
      id: userDocId,
      deviceIdAutorizado: currentDeviceId,
      ultimoAcceso: new Date().toISOString()
    };

    saveLocalUser(updatedUser);

    try {
      await updateDoc(doc(db, 'usuarios', userDocId), {
        deviceIdAutorizado: currentDeviceId,
        ultimoAcceso: updatedUser.ultimoAcceso
      });
    } catch {}

    const authToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionUser: UsuarioDocente = {
      ...updatedUser,
      password: undefined
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    }

    return { success: true, user: sessionUser };
  },

  /**
   * CANJEAR LICENCIA - PASO 1:
   * Verifica que el código introducido exista y esté disponible en 'suscripciones'.
   * Con fallback resiliente automático si el cliente está offline.
   */
  async verifyLicenseCode(
    rawCode: string
  ): Promise<{
    valid: boolean;
    subscription?: SuscripcionLicencia;
    docId?: string;
    error?: string;
  }> {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: 'Por favor ingresa un código de licencia.' };
    }

    let subData: SuscripcionLicencia | null = null;
    let docId = cleanCode;

    // 1. Intentar consultar Firestore
    try {
      const subDocSnap = await getDoc(doc(db, 'suscripciones', cleanCode));
      if (subDocSnap.exists()) {
        subData = subDocSnap.data() as SuscripcionLicencia;
        docId = cleanCode;
      } else {
        const q = query(
          collection(db, 'suscripciones'),
          where('codigo', '==', cleanCode)
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          subData = querySnap.docs[0].data() as SuscripcionLicencia;
          docId = querySnap.docs[0].id;
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore offline al verificar licencia, usando almacén resiliente:', firestoreErr);
    }

    // 2. Fallback a registro local si Firestore no respondió o está offline
    if (!subData) {
      const localSubs = getLocalSubscriptions();
      if (localSubs[cleanCode]) {
        subData = localSubs[cleanCode];
        docId = cleanCode;
      }
    }

    if (!subData) {
      return {
        valid: false,
        error: 'El código de licencia ingresado no existe o no es válido.'
      };
    }

    // 3. Comprobar si ya fue usada
    if (subData.usado === true || subData.estado === 'usado') {
      return {
        valid: false,
        error: `Este código de licencia ya fue canjeado el ${
          subData.fechaUso ? new Date(subData.fechaUso).toLocaleDateString() : 'anteriormente'
        } por ${subData.usadoPor || 'otro docente'}.`
      };
    }

    return {
      valid: true,
      subscription: { ...subData, id: docId, codigo: cleanCode },
      docId
    };
  },

  /**
   * CANJEAR LICENCIA - PASO 2:
   * Crea las credenciales del docente en 'usuarios' y marca el código como usado en 'suscripciones'.
   */
  async registerWithLicense(
    licenseCode: string,
    nombre: string,
    emailInput: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: UsuarioDocente;
    error?: string;
  }> {
    const cleanCode = licenseCode.trim().toUpperCase();
    const email = emailInput.trim().toLowerCase();
    const currentDeviceId = getOrCreateDeviceId();

    // 1. Verificación previa de disponibilidad
    const verifyRes = await this.verifyLicenseCode(cleanCode);
    if (!verifyRes.valid) {
      return {
        success: false,
        error: verifyRes.error || 'La licencia no está disponible.'
      };
    }

    // 2. Comprobar que no exista usuario con este correo
    let alreadyExists = false;
    try {
      const existingUserSnap = await getDoc(doc(db, 'usuarios', email));
      if (existingUserSnap.exists()) {
        alreadyExists = true;
      }
    } catch {}

    if (!alreadyExists) {
      const localUsers = getLocalUsers();
      if (localUsers[email]) {
        alreadyExists = true;
      }
    }

    if (alreadyExists) {
      return {
        success: false,
        error: 'Ya existe una cuenta docente registrada con este correo electrónico.'
      };
    }

    const nowIso = new Date().toISOString();

    const newUser: UsuarioDocente = {
      nombre: nombre.trim(),
      email,
      password,
      codigoLicencia: cleanCode,
      deviceIdAutorizado: currentDeviceId,
      rol: 'docente',
      fechaRegistro: nowIso,
      ultimoAcceso: nowIso,
      activo: true
    };

    const updatedSub: SuscripcionLicencia = {
      codigo: cleanCode,
      usado: true,
      estado: 'usado',
      usadoPor: email,
      nombreDocente: nombre.trim(),
      fechaUso: nowIso,
      plan: verifyRes.subscription?.plan || 'Licencia Docente Pro'
    };

    // 3. Guardar en caché local resiliente primero
    saveLocalUser(newUser);
    saveLocalSubscription(updatedSub);

    // 4. Sincronizar en Firestore
    try {
      await setDoc(doc(db, 'usuarios', email), newUser);
      await setDoc(doc(db, 'suscripciones', cleanCode), updatedSub, { merge: true });
    } catch (err) {
      console.warn('Sincronización Firestore en segundo plano:', err);
    }

    // 5. Iniciar sesión automáticamente
    const authToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionUser: UsuarioDocente = {
      ...newUser,
      id: email,
      password: undefined
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    }

    return {
      success: true,
      user: sessionUser
    };
  },

  /**
   * CERRAR SESIÓN:
   * Limpia auth_token y datos de sesión de localStorage.
   */
  async logout(releaseDevice = false): Promise<void> {
    const user = this.getCurrentUser();
    if (releaseDevice && user?.id) {
      try {
        await updateDoc(doc(db, 'usuarios', user.id), {
          deviceIdAutorizado: null
        });
      } catch {}
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  /**
   * Helper para inicializar licencias si es requerido
   */
  async seedSampleLicenses(): Promise<string[]> {
    return [];
  }
};

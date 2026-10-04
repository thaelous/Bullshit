import React, { useState } from 'react';
import {
  firebaseConfig,
  getEffectiveFirebaseConfig,
  saveCustomFirebaseConfig,
  isFirebaseConfigured
} from '../firebase';
import { Flame, X, CheckCircle2, AlertTriangle, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose, onConfigChanged }) => {
  const currentConfig = getEffectiveFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    saveCustomFirebaseConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigChanged();
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    saveCustomFirebaseConfig(null);
    setApiKey(firebaseConfig.apiKey);
    setAuthDomain(firebaseConfig.authDomain);
    setProjectId(firebaseConfig.projectId);
    setStorageBucket(firebaseConfig.storageBucket);
    setMessagingSenderId(firebaseConfig.messagingSenderId);
    setAppId(firebaseConfig.appId);
    onConfigChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-black">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl text-white">
              Configuración de Firebase Firestore
            </h2>
            <p className="text-xs text-slate-400">
              Sincronización en tiempo real para múltiples dispositivos móviles y TVs
            </p>
          </div>
        </div>

        {/* Current status banner */}
        <div className={`p-3.5 rounded-xl mb-5 flex items-start gap-3 border ${
          isConfigured
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {isConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {isConfigured
                ? 'Conexión a Firebase Firestore Habilitada'
                : 'Modo Local / Multi-pestaña Activo'}
            </p>
            <p className="text-slate-300">
              {isConfigured
                ? `Conectado al proyecto "${currentConfig.projectId}". Los datos se sincronizan globalmente en vivo.`
                : 'La app funciona perfectamente entre pestañas locales con BroadcastChannel. Para jugar con amigos en distintos celulares/redes, ingresa tus credenciales de Firebase Console abajo o edítalas en src/firebase.ts.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                API Key (apiKey)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Project ID (projectId)
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="mi-proyecto-id"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Auth Domain (authDomain)
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="mi-proyecto.firebaseapp.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                App ID (appId)
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer placeholders
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 glow-gold flex items-center gap-1.5 shadow-md"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {savedSuccess ? '¡Guardado con éxito!' : 'Guardar y Conectar'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>También puedes editar directamente el archivo <code className="text-amber-300">src/firebase.ts</code></span>
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            Firebase Console <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

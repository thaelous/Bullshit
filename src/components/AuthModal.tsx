import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Laptop,
  ArrowRight,
  Eye,
  EyeOff,
  Ticket,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { authService, UsuarioDocente } from '../services/authService';
import { sounds } from '../services/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UsuarioDocente) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'redeem'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [deviceMismatch, setDeviceMismatch] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Redeem form state (2 steps)
  const [redeemStep, setRedeemStep] = useState<1 | 2>(1);
  const [licenseCode, setLicenseCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [verifiedPlan, setVerifiedPlan] = useState('');

  // Step 2 Registration fields
  const [docenteNombre, setDocenteNombre] = useState('');
  const [docenteEmail, setDocenteEmail] = useState('');
  const [docentePassword, setDocentePassword] = useState('');
  const [docentePasswordConfirm, setDocentePasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    setDeviceMismatch(false);
    sounds.playClick();

    try {
      const res = await authService.login(loginEmail, loginPassword);
      if (res.success && res.user) {
        sounds.playCorrectAnswer();
        onSuccess(res.user);
      } else {
        sounds.playBullshitBuzzer();
        setLoginError(res.error || 'Credenciales incorrectas');
        if (res.isDeviceMismatch) {
          setDeviceMismatch(true);
        }
      }
    } catch {
      setLoginError('Error de conexión al autenticar');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Transfer Device Authorization
  const handleTransferDevice = async () => {
    setTransferLoading(true);
    sounds.playClick();
    try {
      const res = await authService.transferDeviceAuthorization(loginEmail, loginPassword);
      if (res.success && res.user) {
        sounds.playCorrectAnswer();
        onSuccess(res.user);
      } else {
        sounds.playBullshitBuzzer();
        setLoginError(res.error || 'No se pudo transferir el equipo.');
      }
    } catch {
      setLoginError('Error al transferir autorización.');
    } finally {
      setTransferLoading(false);
    }
  };

  // Step 1: Validate License Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = licenseCode.trim().toUpperCase();
    if (!clean) {
      setCodeError('Por favor ingresa un código de licencia.');
      return;
    }

    setValidatingCode(true);
    setCodeError('');
    sounds.playClick();

    try {
      const res = await authService.verifyLicenseCode(clean);
      if (res.valid && res.subscription) {
        sounds.playBelieveChime();
        setVerifiedPlan(res.subscription.plan || 'Licencia Docente Activa');
        setRedeemStep(2);
      } else {
        sounds.playBullshitBuzzer();
        setCodeError(res.error || 'El código no es válido o ya fue usado.');
      }
    } catch {
      setCodeError('Error al validar código con la base de datos.');
    } finally {
      setValidatingCode(false);
    }
  };

  // Step 2: Register Teacher with License
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteNombre.trim()) {
      setRegError('Ingresa tu nombre completo.');
      return;
    }
    if (!docenteEmail.trim() || !docenteEmail.includes('@')) {
      setRegError('Ingresa un correo electrónico válido.');
      return;
    }
    if (docentePassword.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (docentePassword !== docentePasswordConfirm) {
      setRegError('Las contraseñas no coinciden.');
      return;
    }

    setRegLoading(true);
    setRegError('');
    sounds.playClick();

    try {
      const res = await authService.registerWithLicense(
        licenseCode,
        docenteNombre,
        docenteEmail,
        docentePassword
      );

      if (res.success && res.user) {
        sounds.playCashAscend(10);
        onSuccess(res.user);
      } else {
        sounds.playBullshitBuzzer();
        setRegError(res.error || 'Error al registrar credenciales.');
      }
    } catch {
      setRegError('Error al procesar el registro.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden relative glow-gold">
        {/* Top Header Glow Banner */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 p-1">
          <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5 shadow-md flex items-center justify-center text-slate-950 font-black text-xl">
                M!
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-white tracking-wider flex items-center gap-1.5">
                  <span>¡MENTIROSO! SHOW</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold">
                    Docente
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Control de Licencias y Acceso Profesional
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Protegido</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/80 border-b border-slate-800 gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('login');
            }}
            className={`py-2.5 px-4 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-gold scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('redeem');
            }}
            className={`py-2.5 px-4 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'redeem'
                ? 'bg-amber-500 text-slate-950 shadow-md glow-gold scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Canjear Licencia</span>
          </button>
        </div>

        {/* TAB 1: INICIAR SESIÓN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="text-center space-y-1 mb-2">
              <h3 className="font-display font-black text-xl text-white">
                Bienvenido, Docente
              </h3>
              <p className="text-xs text-slate-400">
                Ingresa con tu correo institucional y contraseña autorizada
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="profesor@colegio.edu"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showLoginPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Device Security Notice */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                Protección <strong className="text-slate-300">deviceIdAutorizado</strong> activa: tu cuenta solo puede ejecutarse en 1 equipo a la vez.
              </span>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 w-full">
                  <p>{loginError}</p>
                  {deviceMismatch && (
                    <button
                      type="button"
                      onClick={handleTransferDevice}
                      disabled={transferLoading}
                      className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${transferLoading ? 'animate-spin' : ''}`} />
                      <span>{transferLoading ? 'Transfiriendo...' : 'Autorizar y cambiar a este equipo'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-base uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-5 h-5 fill-current" />
              <span>{loginLoading ? 'Verificando Credenciales...' : 'ENTRAR AL JUEGO'}</span>
            </button>

            {/* Switch to redeem prompt */}
            <div className="text-center pt-1">
              <p className="text-xs text-slate-400">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('redeem')}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Canjea tu código de licencia aquí
                </button>
              </p>
            </div>
          </form>
        )}

        {/* TAB 2: CANJEAR LICENCIA (2 PASOS) */}
        {activeTab === 'redeem' && (
          <div className="p-6 space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800 text-xs font-bold">
              <span className={`flex items-center gap-1.5 ${redeemStep === 1 ? 'text-amber-400 font-black' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">1</span>
                Validar Código
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <span className={`flex items-center gap-1.5 ${redeemStep === 2 ? 'text-amber-400 font-black' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">2</span>
                Crear Credenciales
              </span>
            </div>

            {/* PASO 1: VERIFICAR CÓDIGO */}
            {redeemStep === 1 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-display font-black text-xl text-white">
                    Paso 1: Introduce tu Código de Licencia
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprobaremos su disponibilidad en la colección <code className="text-amber-400">suscripciones</code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-400" />
                    Código de Licencia
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                    placeholder="Ingresa tu código de licencia"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-base text-amber-400 font-mono font-black uppercase tracking-wider outline-none text-center placeholder:text-slate-600"
                  />
                </div>

                {codeError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{codeError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={validatingCode}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-base uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5 fill-current" />
                  <span>{validatingCode ? 'Verificando en Firestore...' : 'VERIFICAR Y CONTINUAR'}</span>
                </button>
              </form>
            )}

            {/* PASO 2: REGISTRO DE CREDENCIALES DOCENTES */}
            {redeemStep === 2 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Verified Badge */}
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Licencia Válida: <span className="font-mono text-white">{licenseCode}</span></p>
                      <p className="text-[11px] text-emerald-300/80">{verifiedPlan}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRedeemStep(1);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>

                {/* Nombre */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Nombre Completo del Docente
                  </label>
                  <input
                    type="text"
                    required
                    value={docenteNombre}
                    onChange={(e) => setDocenteNombre(e.target.value)}
                    placeholder="Prof. María González"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none placeholder:text-slate-600"
                  />
                </div>

                {/* Correo */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    Correo Electrónico para Iniciar Sesión
                  </label>
                  <input
                    type="email"
                    required
                    value={docenteEmail}
                    onChange={(e) => setDocenteEmail(e.target.value)}
                    placeholder="maria.gonzalez@colegio.edu"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none placeholder:text-slate-600"
                  />
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Contraseña (min. 6)
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={docentePassword}
                      onChange={(e) => setDocentePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Confirmar Contraseña
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={docentePasswordConfirm}
                      onChange={(e) => setDocentePasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showRegPassword ? 'Ocultar contraseñas' : 'Ver contraseñas'}</span>
                  </button>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 text-slate-950 font-display font-black text-base uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-green shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span>{regLoading ? 'Registrando y Vinculando...' : 'CREAR CUENTA Y ACTIVAR LICENCIA'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, LogOut, Maximize, Minimize, Power, UserCheck, Palette } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { UsuarioDocente } from '../services/authService';
import { BrandingTheme } from '../services/themeService';

interface NavbarProps {
  roomCode?: string;
  onOpenFirebaseModal?: () => void;
  onOpenBrandingModal?: () => void;
  onLeaveRoom?: () => void;
  currentUser?: UsuarioDocente | null;
  onLogout?: () => void;
  isParticipant?: boolean;
  brandingTheme?: BrandingTheme;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  onOpenBrandingModal,
  onLeaveRoom,
  currentUser,
  onLogout,
  isParticipant = false,
  brandingTheme
}) => {
  const [muted, setMuted] = useState(!sounds.enabled);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  // Listen to fullscreen changes (including F11 or Esc keys)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleSound = () => {
    const nextState = !sounds.enabled;
    sounds.setEnabled(nextState);
    setMuted(!nextState);
    if (nextState) {
      sounds.playBelieveChime();
    }
  };

  const toggleFullScreen = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al activar pantalla completa: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error(`Error al salir de pantalla completa: ${err.message}`);
        });
      }
    }
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCustomLogo = Boolean(brandingTheme?.logoUrl && brandingTheme.showLogoInNavbar !== false);

  return (
    <header
      className="w-full backdrop-blur-md px-4 py-3 sticky top-0 z-40 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-card)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasCustomLogo ? (
            <div className="relative flex items-center justify-center h-10 sm:h-11 px-2 rounded-xl bg-slate-950/80 border border-white/20 shadow-md flex-shrink-0">
              <img
                src={brandingTheme?.logoUrl}
                alt={brandingTheme?.institutionName || 'Logo Institucional'}
                className="max-h-8 sm:max-h-9 max-w-[120px] object-contain"
              />
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-0.5 shadow-lg flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                boxShadow: '0 0 15px -2px var(--color-primary-glow)'
              }}
            >
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span
                  className="font-display font-black text-lg sm:text-xl tracking-tighter"
                  style={{ color: 'var(--color-primary)' }}
                >
                  M!
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg sm:text-2xl tracking-wider text-white drop-shadow">
                {brandingTheme?.institutionName ? (
                  <span className="truncate max-w-[180px] sm:max-w-xs block text-white">
                    {brandingTheme.institutionName}
                  </span>
                ) : (
                  <span>¡MENTIROSO!</span>
                )}
              </h1>
              {isParticipant && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-black tracking-wider">
                  Retador
                </span>
              )}
            </div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest hidden sm:block truncate max-w-sm"
              style={{ color: 'var(--color-primary)' }}
            >
              {isParticipant
                ? 'Panel de Participante'
                : brandingTheme?.institutionName
                ? '¡Mentiroso! El Juego de la Mentira'
                : 'El Juego de la Mentira'}
            </p>
          </div>
        </div>

        {/* Center Room Code Pill (if in room) */}
        {roomCode && (
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border hover:scale-102 transition-all shadow-md group cursor-pointer"
            style={{
              borderColor: 'var(--border-card)'
            }}
            title="Copiar código de sala"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">SALA:</span>
            <span
              className="font-mono font-black text-sm tracking-widest"
              style={{ color: 'var(--color-primary)' }}
            >
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
            )}
          </button>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Instructor Branding & Themes Button */}
          {!isParticipant && onOpenBrandingModal && (
            <button
              onClick={onOpenBrandingModal}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-sm"
              title="Ajustes de Temas, Colores y Branding"
              aria-label="Ajustes de Temas y Branding"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Branding</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className={`p-2 rounded-lg border transition-all ${
              isFullscreen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Salir de Pantalla Completa (Esc)' : 'Pantalla Completa (F11)'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Leave room */}
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="p-2 rounded-lg bg-slate-900 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-red-950/30 transition-colors"
              title="Salir de la sala"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Docente Info & Cerrar Sesión */}
          {onLogout && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              {currentUser && (
                <div className="hidden md:flex flex-col text-right leading-tight pr-1">
                  <span className="text-xs font-bold text-amber-300 truncate max-w-[130px] flex items-center justify-end gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    {currentUser.nombre}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lic. {currentUser.codigoLicencia ? currentUser.codigoLicencia.substring(0, 12) : 'Activa'}
                  </span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-500/50 text-red-300 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                title="Cerrar sesión de docente"
                aria-label="Cerrar sesión"
              >
                <Power className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Flame, Radio, Settings, LogOut } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { isFirebaseConfigured } from '../firebase';

interface NavbarProps {
  roomCode?: string;
  onOpenFirebaseModal: () => void;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  onOpenFirebaseModal,
  onLeaveRoom
}) => {
  const [muted, setMuted] = useState(!sounds.enabled);
  const [copied, setCopied] = useState(false);
  const isFb = isFirebaseConfigured();

  const toggleSound = () => {
    const nextState = !sounds.enabled;
    sounds.setEnabled(nextState);
    setMuted(!nextState);
    if (nextState) {
      sounds.playBelieveChime();
    }
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-display font-black text-amber-400 text-lg sm:text-xl tracking-tighter">B!</span>
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-lg sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow">
              BULLSHIT!
            </h1>
            <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest hidden sm:block">
              El Juego de la Mentira
            </p>
          </div>
        </div>

        {/* Center Room Code Pill (if in room) */}
        {roomCode && (
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all shadow-md group"
            title="Copiar código de sala"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">SALA:</span>
            <span className="font-mono font-black text-sm tracking-widest text-amber-400">{roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
            )}
          </button>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Firebase Status Badge & Settings */}
          <button
            onClick={onOpenFirebaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isFb
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50'
            }`}
            title="Estado y Configuración de Firebase"
          >
            {isFb ? (
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden md:inline">
              {isFb ? 'Firestore Live' : 'Modo Local'}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
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
        </div>
      </div>
    </header>
  );
};

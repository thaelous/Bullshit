import React from 'react';
import { motion } from 'framer-motion';
import { LADDER_PRIZES } from '../types';
import { Trophy, Lock, Flame, ShieldAlert } from 'lucide-react';

interface LadderProps {
  currentStep: number;
  horizontal?: boolean;
  lockedSteps?: number[];
  locksRemaining?: number;
  lockedAmount?: string;
}

export const Ladder: React.FC<LadderProps> = ({
  currentStep,
  horizontal = false,
  lockedSteps = [],
  locksRemaining = 2,
  lockedAmount = '$0',
}) => {
  if (horizontal) {
    return (
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              Escalera
            </span>
            <span className="text-[10px] text-slate-400">
              Asegurado: <strong className="text-amber-300 font-black">{lockedAmount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Candados:</span>
            <span className={locksRemaining >= 1 ? 'opacity-100' : 'opacity-30 grayscale'}>🔒</span>
            <span className={locksRemaining >= 2 ? 'opacity-100' : 'opacity-30 grayscale'}>🔒</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
          {LADDER_PRIZES.slice(1).map((prize) => {
            const isCurrent = prize.step === currentStep;
            const isPast = prize.step < currentStep;
            const isLocked = lockedSteps.includes(prize.step);

            return (
              <div
                key={prize.step}
                className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 glow-gold scale-105 shadow-lg font-black'
                    : isLocked
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-400/80 shadow-sm'
                    : isPast
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3 text-amber-400 fill-current" />}
                {prize.amount}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical TV Game Show Ladder
  return (
    <div className="w-full max-w-[270px] bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
          <span className="font-display font-black text-sm tracking-wider uppercase text-amber-400">
            Escalera de Premios
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
          NIVEL {currentStep}
        </span>
      </div>

      {/* Strategic Locks Indicator (Candados disponibles) */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/30 mb-2.5 text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Candados disponibles:
        </span>
        <div className="flex items-center gap-1.5 text-sm select-none">
          <span
            title={locksRemaining >= 1 ? 'Candado 1 disponible' : 'Candado 1 usado'}
            className={`transition-transform duration-300 ${
              locksRemaining >= 1
                ? 'opacity-100 scale-110 drop-shadow'
                : 'opacity-25 grayscale scale-95'
            }`}
          >
            🔒
          </span>
          <span
            title={locksRemaining >= 2 ? 'Candado 2 disponible' : 'Candado 2 usado'}
            className={`transition-transform duration-300 ${
              locksRemaining >= 2
                ? 'opacity-100 scale-110 drop-shadow'
                : 'opacity-25 grayscale scale-95'
            }`}
          >
            🔒
          </span>
        </div>
      </div>

      {/* Prize steps in ascending order (top is $1,000,000) */}
      <div className="flex flex-col-reverse gap-1.5">
        {LADDER_PRIZES.slice(1).map((prize) => {
          const isCurrent = prize.step === currentStep;
          const isPast = prize.step < currentStep;
          const isLocked = lockedSteps.includes(prize.step);

          return (
            <motion.div
              key={prize.step}
              layout
              animate={{ scale: isCurrent ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-xl font-display font-black text-sm transition-all duration-300 ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 glow-gold shadow-xl z-10 border border-amber-200'
                  : isLocked
                  ? 'bg-gradient-to-r from-amber-950/70 to-slate-900 text-amber-300 border-2 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                  : isPast
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 opacity-80'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    isCurrent ? 'text-black font-extrabold' : isLocked ? 'text-amber-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {prize.step}
                </span>

                {isLocked && (
                  <span
                    title="Candado Activado: Nivel Seguro"
                    className="flex items-center gap-1 text-[10px] text-amber-400 animate-pulse font-extrabold"
                  >
                    <Lock className={`w-3.5 h-3.5 ${isCurrent ? 'text-black' : 'text-amber-400'}`} />
                    <span className={`text-[9px] uppercase tracking-tighter ${isCurrent ? 'text-black' : 'text-amber-300'}`}>
                      SEGURO
                    </span>
                  </span>
                )}

                {isCurrent && (
                  <Flame className="w-4 h-4 text-black animate-pulse" />
                )}
              </div>

              <span
                className={`text-base tracking-wide ${
                  isCurrent ? 'text-slate-950 font-black' : isLocked ? 'text-amber-300 font-extrabold' : ''
                }`}
              >
                {prize.amount}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Guaranteed Amount Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between px-1">
        <span className="text-slate-400 flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Asegurado por candado:
        </span>
        <span className="font-display font-black text-amber-400 text-sm">
          {lockedAmount}
        </span>
      </div>
    </div>
  );
};

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
      <div
        className="w-full rounded-2xl p-3 backdrop-blur-md space-y-2 border transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)'
        }}
      >
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span
              className="font-bold uppercase tracking-wider text-[11px]"
              style={{ color: 'var(--color-primary)' }}
            >
              Escalera
            </span>
            <span className="text-[10px] text-slate-400">
              Asegurado: <strong className="font-black text-white">{lockedAmount}</strong>
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
                style={
                  isCurrent
                    ? {
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
                        color: '#030712',
                        boxShadow: '0 0 20px -3px var(--color-primary-glow)'
                      }
                    : isLocked
                    ? {
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary)'
                      }
                    : undefined
                }
                className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 ${
                  isCurrent
                    ? 'scale-105 shadow-lg font-black'
                    : isLocked
                    ? 'border shadow-sm bg-slate-950/80'
                    : isPast
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3 fill-current" />}
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
    <div
      className="w-full max-w-[270px] border-2 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
        boxShadow: '0 0 35px -10px var(--color-primary-glow)'
      }}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between pb-3 border-b mb-2.5"
        style={{ borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center gap-2">
          <Trophy
            className="w-5 h-5 animate-bounce"
            style={{ color: 'var(--color-primary)' }}
          />
          <span
            className="font-display font-black text-sm tracking-wider uppercase"
            style={{ color: 'var(--color-primary)' }}
          >
            Escalera de Premios
          </span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--color-primary)',
            borderColor: 'var(--border-card)'
          }}
        >
          NIVEL {currentStep}
        </span>
      </div>

      {/* Strategic Locks Indicator (Candados disponibles) */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl border mb-2.5 text-xs"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-card)'
        }}
      >
        <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
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
              style={
                isCurrent
                  ? {
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
                      color: '#030712',
                      boxShadow: '0 0 25px -4px var(--color-primary-glow)'
                    }
                  : isLocked
                  ? {
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)'
                    }
                  : undefined
              }
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-xl font-display font-black text-sm transition-all duration-300 ${
                isCurrent
                  ? 'scale-105 shadow-xl z-10'
                  : isLocked
                  ? 'border-2 shadow-md bg-slate-950/80'
                  : isPast
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 opacity-80'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    isCurrent ? 'text-black font-extrabold' : isLocked ? 'text-white font-bold' : 'text-slate-500'
                  }`}
                >
                  {prize.step}
                </span>

                {isLocked && (
                  <span
                    title="Candado Activado: Nivel Seguro"
                    className="flex items-center gap-1 text-[10px] animate-pulse font-extrabold"
                    style={{ color: isCurrent ? 'black' : 'var(--color-primary)' }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase tracking-tighter">
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
                  isCurrent ? 'text-black font-black' : isLocked ? 'font-extrabold' : ''
                }`}
                style={isLocked && !isCurrent ? { color: 'var(--color-primary)' } : undefined}
              >
                {prize.amount}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Guaranteed Amount Footer */}
      <div
        className="mt-3 pt-2.5 border-t text-[11px] text-slate-300 flex items-center justify-between px-1"
        style={{ borderColor: 'var(--border-card)' }}
      >
        <span className="text-slate-400 flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
          Asegurado por candado:
        </span>
        <span
          className="font-display font-black text-sm"
          style={{ color: 'var(--color-primary)' }}
        >
          {lockedAmount}
        </span>
      </div>
    </div>
  );
};

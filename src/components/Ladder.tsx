import React from 'react';
import { motion } from 'framer-motion';
import { LADDER_PRIZES } from '../types';
import { Trophy, ShieldCheck, Flame } from 'lucide-react';

interface LadderProps {
  currentStep: number;
  horizontal?: boolean;
}

export const Ladder: React.FC<LadderProps> = ({ currentStep, horizontal = false }) => {
  if (horizontal) {
    return (
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
          {LADDER_PRIZES.slice(1).map((prize) => {
            const isCurrent = prize.step === currentStep;
            const isPast = prize.step < currentStep;
            return (
              <div
                key={prize.step}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 glow-gold scale-105 shadow-lg'
                    : isPast
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : prize.isMilestone
                    ? 'bg-slate-800/80 text-amber-300/80 border border-amber-500/20'
                    : 'bg-slate-900/60 text-slate-400'
                }`}
              >
                {prize.isMilestone && <ShieldCheck className="w-3 h-3 text-amber-400" />}
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
    <div className="w-full max-w-[260px] bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 border-2 border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
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

      <div className="flex flex-col-reverse gap-1.5">
        {LADDER_PRIZES.slice(1).map((prize) => {
          const isCurrent = prize.step === currentStep;
          const isPast = prize.step < currentStep;

          return (
            <motion.div
              key={prize.step}
              layout
              animate={{ scale: isCurrent ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-xl font-display font-black text-sm transition-all duration-300 ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 glow-gold shadow-xl z-10 border border-amber-200'
                  : isPast
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 line-through opacity-75'
                  : prize.isMilestone
                  ? 'bg-slate-900/90 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isCurrent ? 'text-black font-extrabold' : 'text-slate-500'}`}>
                  {prize.step}
                </span>
                {prize.isMilestone && (
                  <span title="Zona Segura" className="flex items-center text-[10px] text-amber-400">
                    <ShieldCheck className={`w-3.5 h-3.5 ${isCurrent ? 'text-black' : 'text-amber-400'}`} />
                  </span>
                )}
                {isCurrent && (
                  <Flame className="w-4 h-4 text-black animate-pulse" />
                )}
              </div>

              <span className={`text-base tracking-wide ${isCurrent ? 'text-slate-950 font-black' : ''}`}>
                {prize.amount}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span>Hitos seguros en $10K y $100K</span>
      </div>
    </div>
  );
};

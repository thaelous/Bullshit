import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Room, Player, Question, LADDER_PRIZES, getAvatarColorClasses } from '../types';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Crown,
  BookOpen,
  Lock
} from 'lucide-react';

interface RevealViewProps {
  room: Room;
  question: Question;
  players: Player[];
  currentPlayer: Player;
  isHost?: boolean;
}

export const RevealView: React.FC<RevealViewProps> = ({
  room,
  question,
  players,
  currentPlayer,
  isHost = false
}) => {
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [showRotatePicker, setShowRotatePicker] = useState<boolean>(false);
  const result = room.roundResult;

  const triggerCelebrationConfetti = (isLieTrick: boolean, isUnanimous: boolean) => {
    try {
      const end = Date.now() + (isUnanimous ? 2600 : 1400);
      const colors = isUnanimous
        ? ['#f59e0b', '#ffd700', '#ef4444', '#ec4899', '#06b6d4', '#10b981', '#ffffff']
        : ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#ffffff'];

      // Central fireworks explosion
      confetti({
        particleCount: isUnanimous ? 160 : 110,
        spread: isUnanimous ? 100 : 80,
        origin: { y: 0.55 },
        colors,
        scalar: isUnanimous ? 1.35 : 1.15,
      });

      // Flank studio cannons firing celebratory bursts
      const frame = () => {
        confetti({
          particleCount: isUnanimous ? 6 : 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors,
          scalar: 1.1,
        });
        confetti({
          particleCount: isUnanimous ? 6 : 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors,
          scalar: 1.1,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {}
  };

  useEffect(() => {
    // Stage 1: Initial suspense
    sounds.playSuspense();
    const t1 = setTimeout(() => {
      setAnimationStep(1); // Reveal contestant truth/lie
      if (result?.wasLie) {
        sounds.playBullshitBuzzer();
      } else {
        sounds.playCorrectAnswer();
      }
    }, 1500);

    const t2 = setTimeout(() => {
      setAnimationStep(2); // Reveal challenger votes
      sounds.playWhoosh();
    }, 3000);

    const t3 = setTimeout(() => {
      setAnimationStep(3); // Final verdict
      if (result?.contestantWon) {
        sounds.playCashAscend(room.ladderStep);
        const isLieTrick = Boolean(result.wasLie);
        const isUnanimousTrick = Boolean(
          result.wasLie && result.believers.length > 0 && result.doubters.length === 0
        );

        if (isLieTrick) {
          triggerCelebrationConfetti(true, isUnanimousTrick);
        } else {
          // Standard truth victory
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#34d399', '#f59e0b', '#ffffff']
            });
          } catch {}
        }
      } else {
        sounds.playEliminated();
      }
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [result]);

  if (!result) return null;

  const handleNextRound = async () => {
    sounds.playClick();
    await gameService.nextRound(room.roomCode, room, players);
  };

  const handleRotateAndNext = async (newContestantId?: string) => {
    sounds.playClick();
    if (newContestantId) {
      await gameService.assignContestant(room.roomCode, newContestantId, players);
    } else {
      const otherPlayers = players.filter((p) => p.id !== room.activeContestantId && !p.isBot);
      const pool = otherPlayers.length > 0 ? otherPlayers : players.filter((p) => p.id !== room.activeContestantId);
      const targetPool = pool.length > 0 ? pool : players;
      const random = targetPool[Math.floor(Math.random() * targetPool.length)];
      if (random) {
        await gameService.assignContestant(room.roomCode, random.id, players);
      }
    }
    await gameService.nextRound(room.roomCode, room, players);
  };

  const currentPrize = LADDER_PRIZES[room.ladderStep]?.amount || '$0';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">
      {/* Top Banner: The Big Reveal Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          MOMENTO DE LA VERDAD
        </div>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          RESOLUCIÓN DE LA RONDA
        </h2>
      </div>

      {/* Step 1: What did the contestant say & was it truth or bullshit? */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
            Respuesta elegida por <strong className="text-amber-400 font-black">{result.contestantName}</strong>:
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-sm font-black text-white">
            Opción {result.selectedOption}: {question.options[result.selectedOption]}
          </span>
        </div>

        {/* Revealed Truth / Lie badge */}
        {animationStep >= 1 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className={`p-6 rounded-2xl border-2 flex items-center justify-center gap-4 text-center transition-all duration-500 ${
              result.wasLie
                ? 'bg-red-950/50 border-red-500 text-red-200 glow-red'
                : 'bg-emerald-950/50 border-emerald-500 text-emerald-200 glow-green'
            }`}
          >
            {result.wasLie ? (
              <>
                <XCircle className="w-10 h-10 text-red-400 flex-shrink-0 animate-bounce" />
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-red-400">
                    ¡ERA UN TOTAL BULLSHIT (MENTIRA)!
                  </h3>
                  <p className="text-xs sm:text-sm text-red-200 mt-1">
                    La opción verdadera era en realidad la <strong className="underline text-white font-bold">{result.correctOption}: {question.options[result.correctOption]}</strong>
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 flex-shrink-0 animate-bounce" />
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-emerald-400">
                    ¡EL CONCURSANTE DIJO LA VERDAD!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                    La opción {result.selectedOption} era 100% correcta.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-amber-400 font-bold animate-pulse text-sm">
            Comprobando con la central de datos si era verdad o mentira...
          </div>
        )}
      </div>

      {/* Step 2: Challenger Votes Revealed */}
      {animationStep >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
        >
          <h4 className="font-display font-black text-sm uppercase tracking-wider text-slate-300">
            ¿CÓMO VOTÓ EL PANEL DE RETADORES?
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players
              .filter((p) => p.role === 'challenger' || p.id !== result.contestantId)
              .map((p, pIdx) => {
                const isBullshitVote = p.vote === 'bullshit';
                const isBelieveVote = p.vote === 'believe';
                const pColor = getAvatarColorClasses(p.avatarColor);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: pIdx * 0.06, duration: 0.25 }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isBullshitVote
                        ? 'bg-red-950/30 border-red-500/40 text-red-300'
                        : isBelieveVote
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-xl border flex items-center justify-center text-lg shadow-sm ${pColor.bgClass} ${pColor.borderClass}`}>
                        {p.avatar}
                      </span>
                      <span className="font-bold text-sm text-slate-200 truncate max-w-[110px]">
                        {p.name}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        isBullshitVote
                          ? 'bg-red-500 text-white shadow-sm'
                          : isBelieveVote
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isBullshitVote ? '¡Bullshit!' : isBelieveVote ? 'Le Creyó' : 'Sin Voto'}
                    </span>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Step 3: Final Official Game Verdict */}
      {animationStep >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 180 }}
          className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl text-center space-y-4 ${
            result.contestantWon
              ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-black border-amber-400 glow-gold'
              : 'bg-gradient-to-b from-red-950/60 via-slate-900 to-black border-red-500 glow-red'
          }`}
        >
          <div className="inline-flex p-3 rounded-2xl bg-slate-950 border border-slate-700 shadow-md">
            {result.contestantWon ? (
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
            )}
          </div>

          <h3 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
            {result.contestantWon
              ? result.wasLie && result.believers.length > 0 && result.doubters.length === 0
                ? '🎭 ¡ENGAÑO TOTAL! ¡EL MENTIROSO ENGAÑÓ A TODOS LOS RETADORES!'
                : result.wasLie
                ? '🎭 ¡ENGAÑO EXITOSO! EL MENTIROSO GANA LA RONDA'
                : '✨ ¡EL CONCURSANTE DIJO LA VERDAD Y AVANZA!'
              : '¡EL CONCURSANTE FUE ELIMINADO!'}
          </h3>

          {result.wasLie && result.contestantWon && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider animate-bounce shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                {result.believers.length > 0 && result.doubters.length === 0
                  ? '¡ENGAÑO UNÁNIME! ¡TODO EL PANEL CAYÓ EN LA TRAMPA!'
                  : '¡BLUFF TELEVISIVO TRIUNFAL!'}
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playCashAscend(room.ladderStep);
                  triggerCelebrationConfetti(
                    true,
                    Boolean(result.believers.length > 0 && result.doubters.length === 0)
                  );
                }}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow"
              >
                🎉 ¡Lanzar Más Confeti!
              </button>
            </div>
          )}

          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            {result.reason}
          </p>

          {/* Money and Safe Floor display */}
          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            {!result.contestantWon ? (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-2 border-amber-400 text-center space-y-1 shadow-2xl glow-gold max-w-md w-full mx-auto">
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300 block">
                  Has sido descubierto. Te llevas a casa:
                </span>
                <div className="font-display font-black text-4xl sm:text-5xl text-amber-400 flex items-center justify-center gap-2.5">
                  <Lock className="w-8 h-8 text-amber-400 fill-current" />
                  <span>{result.takeHomeAmount || room.lockedAmount || '$0'}</span>
                </div>
                <span className="text-[11px] font-bold text-amber-300/90 block">
                  (Monto Asegurado por Candado)
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs uppercase font-bold text-slate-400">Pozo Acumulado:</span>
                  <span className="font-display font-black text-3xl text-amber-400 px-5 py-1.5 rounded-2xl bg-slate-950 border border-amber-500/40 glow-gold shadow-md">
                    {currentPrize}
                  </span>
                </div>
                {room.lockedAmount && room.lockedAmount !== '$0' && (
                  <span className="text-xs text-amber-400/90 flex items-center gap-1 font-semibold">
                    <Lock className="w-3.5 h-3.5" /> Piso asegurado: {room.lockedAmount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* If new contestant took the hot seat */}
          {result.newContestantName && !result.contestantWon && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>
                ¡<strong>{result.newContestantName}</strong> fue el más veloz y ahora ocupa el Hot Seat!
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Curious Trivia Educational Explanation */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 flex-shrink-0 mt-0.5">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300 text-sm">
            Dato Curioso Real:
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      </div>

      {/* Next Round Action */}
      {animationStep >= 3 && (
        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNextRound}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-2xl flex items-center justify-center gap-2"
            >
              <span>Continuar con el Mismo Mentiroso</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {isHost && players.length > 1 && (
              <button
                onClick={() => handleRotateAndNext()}
                className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-amber-500/50 text-amber-300 font-display font-black text-base uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
                title="Elige a otro participante al azar como El Mentiroso e inicia la siguiente pregunta"
              >
                <span>🎲 Rotar Mentiroso al Azar</span>
              </button>
            )}
          </div>

          {/* Host specific liar selector for next round */}
          {isHost && players.length > 1 && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-bold">
                O asignar a un mentiroso específico para la siguiente pregunta:
              </span>
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleRotateAndNext(e.target.value);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="" disabled>Seleccionar participante...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name} {p.id === room.activeContestantId ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

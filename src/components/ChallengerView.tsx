import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Player, Question, VoteType, getAvatarColorClasses, LADDER_PRIZES } from '../types';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Flame,
  Volume2,
  Lock
} from 'lucide-react';

interface ChallengerViewProps {
  room: Room;
  question: Question;
  players: Player[];
  currentPlayer: Player;
}

export const ChallengerView: React.FC<ChallengerViewProps> = ({
  room,
  question,
  players,
  currentPlayer
}) => {
  const [localVote, setLocalVote] = useState<VoteType>(currentPlayer.vote);
  const contestant = players.find((p) => p.id === room.activeContestantId);

  useEffect(() => {
    setLocalVote(currentPlayer.vote);
  }, [currentPlayer.vote]);

  const handleVote = async (vote: 'believe' | 'bullshit') => {
    if (room.status !== 'voting') return;
    setLocalVote(vote);
    if (vote === 'bullshit') {
      sounds.playBullshitBuzzer();
    } else {
      sounds.playBelieveChime();
    }
    await gameService.castVote(room.roomCode, currentPlayer.id, vote);
  };

  const isSelectionPhase = room.status === 'question_selection' || room.status === 'question_active';
  const isVotingActive = room.status === 'voting';
  const hasVoted = localVote !== null;
  const isConfirmedChoice = !isSelectionPhase && Boolean(room.selectedOption);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Challenger Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl border shadow-sm ${getAvatarColorClasses(currentPlayer.avatarColor).bgClass} ${getAvatarColorClasses(currentPlayer.avatarColor).borderClass}`}>
            {currentPlayer.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100">{currentPlayer.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                PANEL
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Retador del Jurado</span>
          </div>
        </div>

        {/* Room status */}
        <div className="flex items-center gap-2">
          {room.timerActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-timer text-xl text-amber-400 font-bold leading-none">
                {room.timerSeconds}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contestant Spotlight Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-2xl shadow-md ${getAvatarColorClasses(contestant?.avatarColor).bgClass} ${getAvatarColorClasses(contestant?.avatarColor).borderClass}`}>
            {contestant?.avatar || '👑'}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
              Concursante en el estrado
            </span>
            <h4 className="font-bold text-sm text-white">{contestant?.name || 'Concursante'}</h4>
          </div>
        </div>

        {/* Selected option pill: ONLY REVEALED WHEN CONFIRMED IN DEFENSE_PHASE OR LATER */}
        {isConfirmedChoice && room.selectedOption ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-sm animate-in zoom-in-95">
            <span>Afirma:</span>
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              {room.selectedOption}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Eligiendo respuesta en privado...</span>
        )}
      </div>

      {/* Contestant Stakes & Candados Safe Floor */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-400">En juego:</span>
          <span className="font-display font-black text-amber-400 text-sm">
            {LADDER_PRIZES[room.ladderStep]?.amount || '$0'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Piso seguro:</span>
          <span className="font-display font-black text-emerald-400 text-xs">
            {room.lockedAmount || '$0'}
          </span>
          <div className="flex items-center gap-0.5 ml-1 text-xs select-none">
            <span className={(room.locksRemaining ?? 2) >= 1 ? 'opacity-100' : 'opacity-25 grayscale'}>🔒</span>
            <span className={(room.locksRemaining ?? 2) >= 2 ? 'opacity-100' : 'opacity-25 grayscale'}>🔒</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
            Pregunta #{room.currentQuestionIndex + 1}
          </span>
          <span className="text-[11px] text-slate-400">
            {question.category}
          </span>
        </div>

        <h3 className="font-display font-extrabold text-lg sm:text-xl text-white leading-snug">
          {question.question}
        </h3>

        {/* 4 Options preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const isContestantChoice = isConfirmedChoice && room.selectedOption === opt;
            return (
              <div
                key={opt}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  isContestantChoice
                    ? 'bg-amber-500/15 border-amber-400 text-amber-200 font-bold shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                  isContestantChoice ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt}
                </span>
                <span className="truncate">{question.options[opt]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status or Voting Area with smooth phase slide transitions */}
      <AnimatePresence mode="wait">
        {/* 1. When Contestant is still choosing */}
        {isSelectionPhase && (
          <motion.div
            key="challenger-selection-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2"
          >
            <HelpCircle className="w-8 h-8 text-amber-400/80 mx-auto animate-pulse" />
            <h4 className="font-display font-black text-base text-slate-200">
              EL MENTIROSO ESTÁ ELIGIENDO SU RESPUESTA...
            </h4>
            <p className="text-xs text-slate-400">
              El participante asignado está leyendo la pregunta y decidiendo su jugada en privado. En cuanto confirme, escucharás su defensa en vivo antes de votar.
            </p>
          </motion.div>
        )}

        {/* 2. Defense Phase */}
        {room.status === 'defense_phase' && (
          <motion.div
            key="challenger-defense-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-2 border-amber-500/40 text-center space-y-3"
          >
            <Volume2 className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
            <h4 className="font-display font-black text-lg text-amber-300 uppercase tracking-wider">
              ¡ESCUCHA LA DEFENSA DEL CONCURSANTE!
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              El concursante asegura que la respuesta es la opción <span className="font-bold text-white uppercase">[{room.selectedOption}]</span>.
              Observa sus gestos, mira si titubea o si parece demasiado confiado. ¡La votación se abrirá en breve!
            </p>
          </motion.div>
        )}

        {/* 3. Voting Phase: THE TWO BIG TOUCH BUTTONS */}
        {room.status === 'voting' && (
          <motion.div
            key="challenger-voting-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 pt-1"
          >
            <div className="text-center space-y-1">
              <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                ¿DICE LA VERDAD O ES MENTIRA?
              </h3>
              <p className="text-xs text-slate-400">
                Toca tu veredicto. Los votos se mantendrán ocultos hasta la revelación.
              </p>
            </div>

            {/* Voted Confirmation Banner */}
            {hasVoted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-center flex items-center justify-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-slate-200">
                  ¡Voto registrado como: <span className={localVote === 'bullshit' ? 'text-red-400 uppercase font-black' : 'text-emerald-400 uppercase font-black'}>{localVote === 'bullshit' ? '¡BULLSHIT!' : 'LE CREO'}</span>! (Puedes cambiarlo si lo deseas)
                </span>
              </motion.div>
            )}

            {/* TWO GIANT TACTILE BUTTONS */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* RED BUTTON: BULLSHIT! (Miente) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleVote('bullshit')}
                className={`w-full py-6 px-4 rounded-3xl font-display font-black text-2xl sm:text-3xl uppercase tracking-wider transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-3 border-2 shadow-2xl ${
                  localVote === 'bullshit'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-300 glow-red ring-4 ring-red-500/50 scale-[1.02]'
                    : 'bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-900 text-red-300 border-red-600/60 hover:border-red-500 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-8 h-8 flex-shrink-0" />
                <span>¡BULLSHIT! (Miente)</span>
                {localVote === 'bullshit' && (
                  <span className="absolute top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white">
                    SELECCIONADO
                  </span>
                )}
              </motion.button>

              {/* GREEN BUTTON: LE CREO */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleVote('believe')}
                className={`w-full py-6 px-4 rounded-3xl font-display font-black text-2xl sm:text-3xl uppercase tracking-wider transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-3 border-2 shadow-2xl ${
                  localVote === 'believe'
                    ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white border-emerald-300 glow-green ring-4 ring-emerald-500/50 scale-[1.02]'
                    : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-slate-900 text-emerald-300 border-emerald-600/60 hover:border-emerald-500 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                <span>LE CREO</span>
                {localVote === 'believe' && (
                  <span className="absolute top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white">
                    SELECCIONADO
                  </span>
                )}
              </motion.button>
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Regla: Si todos votan unánimemente ¡BULLSHIT! y el concursante mentía, ¡el concursante queda eliminado y tú podrías ser el nuevo concursante!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

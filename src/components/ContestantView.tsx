import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Player, Question, getAvatarColorClasses, LADDER_PRIZES } from '../types';
import { Ladder } from './Ladder';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  Crown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Vote,
  Volume2,
  Lock
} from 'lucide-react';

interface ContestantViewProps {
  room: Room;
  question: Question;
  players: Player[];
  currentPlayer: Player;
}

export const ContestantView: React.FC<ContestantViewProps> = ({
  room,
  question,
  players,
  currentPlayer
}) => {
  const isSelectionPhase = room.status === 'question_selection' || room.status === 'question_active';
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(
    isSelectionPhase ? null : room.selectedOption
  );
  const [timer, setTimer] = useState(room.timerSeconds);
  const challengers = players.filter((p) => p.role === 'challenger');
  const votedCount = challengers.filter((c) => c.vote !== null).length;

  // Reset selection to clean state whenever a new question starts in selection phase
  useEffect(() => {
    if (isSelectionPhase) {
      setSelectedOption(null);
    } else {
      setSelectedOption(room.selectedOption);
    }
  }, [room.currentQuestionIndex, room.status, isSelectionPhase, room.selectedOption]);

  // Local tick countdown if active
  useEffect(() => {
    setTimer(room.timerSeconds);
  }, [room.timerSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (room.timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          if (prev <= 6) {
            sounds.playTick(prev <= 3);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [room.timerActive, timer]);

  const handleSelect = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (!isSelectionPhase) return;
    sounds.playClick();
    setSelectedOption(opt);
    if (opt === question.correctOption) {
      sounds.playBelieveChime();
    } else {
      sounds.playTick(true);
    }
  };

  const handleConfirmAnswer = async () => {
    if (!selectedOption) return;
    sounds.playSuspense();
    await gameService.confirmAnswer(room.roomCode, selectedOption);
  };

  const handleStartVoting = async () => {
    sounds.playClick();
    await gameService.startVoting(room.roomCode, players);
  };

  const handleResolve = async () => {
    sounds.playSuspense();
    await gameService.resolveRound(room.roomCode, room, players);
  };

  const hasSelected = selectedOption !== null;
  const isSelectedCorrect = selectedOption === question.correctOption;

  const locksRemaining = room.locksRemaining ?? 2;
  const currentStep = room.ladderStep;
  const currentPrize = LADDER_PRIZES[currentStep]?.amount || '$0';
  const lockedSteps = room.lockedSteps || [];
  const isCurrentStepLocked = lockedSteps.includes(currentStep);
  const canActivateLock = isSelectionPhase && locksRemaining > 0 && currentStep > 0 && !isCurrentStepLocked;

  const handleActivateLock = async () => {
    if (!canActivateLock) return;
    sounds.playLockActivated();
    await gameService.activateLock(room.roomCode, currentStep);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-5 animate-in fade-in duration-300">
      {/* Contestant Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shadow-lg glow-gold ${getAvatarColorClasses(currentPlayer.avatarColor).bgClass} ${getAvatarColorClasses(currentPlayer.avatarColor).borderClass}`}>
            {currentPlayer.avatar || '👑'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base text-amber-300 uppercase tracking-wider">
                {currentPlayer.name || 'ESTÁS EN EL HOT SEAT'}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                CONCURSANTE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Categoría: <span className="text-amber-400 font-semibold">{question.category}</span>
            </p>
          </div>
        </div>

        {/* Phase Badge & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-timer text-2xl text-amber-400 font-bold leading-none">
              {timer}s
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 uppercase tracking-wider border border-slate-700">
            {isSelectionPhase && (hasSelected ? 'Estrategia revelada' : 'Elige a ciegas')}
            {room.status === 'defense_phase' && 'Fase de Defensa'}
            {room.status === 'voting' && 'Panel Votando'}
          </span>
        </div>
      </div>

      {/* Horizontal Ladder for Mobile Context */}
      <Ladder
        currentStep={room.ladderStep}
        horizontal
        lockedSteps={room.lockedSteps || []}
        locksRemaining={room.locksRemaining ?? 2}
        lockedAmount={room.lockedAmount || '$0'}
      />

      {/* Strategic Lock Decision Card (Celular del Mentiroso) */}
      {isSelectionPhase && (
        <div
          className={`p-4 rounded-3xl border-2 transition-all duration-300 shadow-xl ${
            isCurrentStepLocked
              ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border-amber-400 glow-gold'
              : 'bg-slate-900/90 border-amber-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl border flex-shrink-0 ${
                  isCurrentStepLocked
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-800 text-amber-400 border-amber-500/40'
                }`}
              >
                <Lock className={`w-5 h-5 ${isCurrentStepLocked ? 'text-amber-400 animate-pulse' : 'text-amber-300'}`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-sm uppercase tracking-wider text-white">
                    {isCurrentStepLocked
                      ? '🔒 CANDADO ACTIVADO EN ESTE NIVEL'
                      : 'DECISIÓN ESTRATÉGICA DE CANDADO'}
                  </span>
                  <div className="flex items-center gap-1 text-xs select-none">
                    <span className={locksRemaining >= 1 ? 'opacity-100 scale-105' : 'opacity-25 grayscale'}>🔒</span>
                    <span className={locksRemaining >= 2 ? 'opacity-100 scale-105' : 'opacity-25 grayscale'}>🔒</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {currentStep === 0
                    ? 'Supera al menos 1 pregunta para poder activar un candado ($0 acumulado).'
                    : isCurrentStepLocked
                    ? `Piso seguro de ${currentPrize} bloqueado. Si todo el panel te canta Bullshit, te llevas este monto garantizado.`
                    : `Asegura tu dinero acumulado actual de ${currentPrize}. Te ${
                        locksRemaining === 1 ? 'queda 1 candado' : `quedan ${locksRemaining} candados`
                      }.`}
                </p>
              </div>
            </div>

            {/* Lock Action Button */}
            <div className="flex-shrink-0">
              {isCurrentStepLocked ? (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>NIVEL {currentStep} ASEGURADO ({currentPrize})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateLock}
                  disabled={!canActivateLock}
                  className={`w-full sm:w-auto py-3 px-5 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    canActivateLock
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg glow-gold cursor-pointer ring-2 ring-amber-400/50'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Lock className="w-4 h-4 fill-current" />
                  <span>
                    {currentStep === 0
                      ? 'Candado disponible en nivel 1+'
                      : locksRemaining <= 0
                      ? 'Sin candados restantes (0/2)'
                      : '🔒 ACTIVAR CANDADO EN ESTE NIVEL'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secret HUD Banner for the Contestant */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">
            {hasSelected
              ? 'REVELACIÓN PRIVADA (SOLO VISIBLE EN TU PANTALLA):'
              : 'ESTADO INICIAL: ELIGE UNA OPCIÓN A CIEGAS'}
          </p>
          <p>
            {hasSelected
              ? 'Al pulsar tu opción, se ha revelado cuál era la verdadera y cuáles son falsas. Revisa tu estrategia abajo antes de confirmar y defender tu postura ante el panel.'
              : 'Intenta responder sin ayuda. Al hacer clic en cualquier opción, descubrirás al instante si acertaste o si deberás mentir con audacia (hacer Bullshit).'}
          </p>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/40 shadow-2xl relative">
        <span className="text-xs uppercase tracking-widest font-black text-amber-500/90 mb-2 block">
          PREGUNTA #{room.currentQuestionIndex + 1}
        </span>
        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
          const isCorrect = opt === question.correctOption;
          const isSelected = selectedOption === opt;
          const isLocked = !isSelectionPhase;

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={isLocked}
              className={`p-4 rounded-2xl text-left transition-all duration-300 relative border-2 flex flex-col justify-between min-h-[115px] ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-400 text-white glow-gold shadow-xl scale-[1.02] ring-2 ring-amber-400/40 z-10'
                  : hasSelected
                  ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 hover:border-slate-700 border-slate-800 text-slate-200'
              } ${isLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black transition-colors ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt}
                </span>

                {/* Badges: ONLY SHOWN AFTER THE CONTESTANT HAS SELECTED AN OPTION */}
                {hasSelected && (
                  isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-in fade-in duration-300">
                      <CheckCircle className="w-3.5 h-3.5" /> VERDAD REAL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-in fade-in duration-300">
                      <AlertCircle className="w-3 h-3" /> MENTIRA / BULLSHIT
                    </span>
                  )
                )}
              </div>

              <span className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                {question.options[opt]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Action Phase Panels with smooth sliding transitions */}
      <AnimatePresence mode="wait">
        {/* 1. SELECTION PHASE ACTION */}
        {isSelectionPhase && (
          <motion.div
            key="contestant-selection-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
          >
            {hasSelected ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3.5 transition-all duration-300 ${
                  isSelectedCorrect
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                }`}
              >
                {isSelectedCorrect ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-extrabold text-white text-sm">
                    {isSelectedCorrect
                      ? 'Estrategia: ¡Tienes la verdad!'
                      : 'Estrategia: ¡Jugar al Bullshit (Mentira)!'}
                  </p>
                  <p className="leading-relaxed text-xs sm:text-sm">
                    {isSelectedCorrect
                      ? 'Tu misión es defenderla con seguridad para que los panelistas sospechen y caigan en el error, o te crean.'
                      : 'Has seleccionado una respuesta incorrecta. Tu misión es convencer a AL MENOS UN panelista de que es verdad. ¡Si uno te cree, avanzas! Si todos votan Bullshit, quedas eliminado.'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <span>👆 Haz clic en una de las 4 opciones arriba para descubrir si es la verdad y armar tu estrategia.</span>
              </div>
            )}

            <button
              onClick={handleConfirmAnswer}
              disabled={!hasSelected}
              className={`w-full py-4 px-6 rounded-2xl font-display font-black text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${
                hasSelected
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-[0.99] glow-gold shadow-2xl cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
              }`}
            >
              <span>CONFIRMAR Y DEFENDER RESPUESTA</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* 2. DEFENSE PHASE ACTION */}
        {room.status === 'defense_phase' && (
          <motion.div
            key="contestant-defense-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  ¡TIEMPO DE DEFENSA! CONVENCE AL PANEL
                </h3>
              </div>
              <span className="font-timer text-3xl text-amber-400 font-bold">{timer}s</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 space-y-2">
              <p className="font-bold text-amber-300">
                Afirmaste que la respuesta correcta es: <span className="underline font-black text-white">{room.selectedOption}: {room.selectedOption ? question.options[room.selectedOption] : ''}</span>
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                🗣️ <span className="font-semibold text-white">¡Habla ahora!</span> Mira a los panelistas a los ojos, explica anécdotas, datos históricos o científicos falsos o verdaderos con total seguridad.
              </p>
            </div>

            <button
              onClick={handleStartVoting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-base uppercase tracking-wider hover:brightness-110 transition-all glow-gold shadow-lg flex items-center justify-center gap-2"
            >
              <Vote className="w-5 h-5" />
              Abrir Votación del Panel Ahora
            </button>
          </motion.div>
        )}

        {/* 3. VOTING PHASE ACTION */}
        {room.status === 'voting' && (
          <motion.div
            key="contestant-voting-phase"
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-3xl bg-slate-900 border-2 border-purple-500/40 shadow-2xl text-center space-y-4"
          >
            <h3 className="font-display font-black text-xl text-purple-300 uppercase tracking-wider">
              EL JURADO ESTÁ VOTANDO...
            </h3>
            <p className="text-sm text-slate-300">
              Los retadores están decidiendo en sus teléfonos si te creen o si gritan <span className="text-red-400 font-black">¡BULLSHIT!</span>
            </p>

            <div className="flex items-center justify-center gap-3 py-3">
              <span className="text-sm font-bold text-slate-400">Votos recibidos:</span>
              <span className="px-4 py-1.5 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 font-black text-lg">
                {votedCount} / {challengers.length}
              </span>
            </div>

            <button
              onClick={handleResolve}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-2xl flex items-center justify-center gap-2"
            >
              Cerrar Votación y Revelar la Verdad
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

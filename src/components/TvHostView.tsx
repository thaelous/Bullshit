import React from 'react';
import { Room, Player, Question } from '../types';
import { Ladder } from './Ladder';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  Crown,
  Users,
  Clock,
  Sparkles,
  Lock,
  Vote,
  Tv,
  ArrowRight
} from 'lucide-react';

interface TvHostViewProps {
  room: Room;
  question: Question;
  players: Player[];
  onToggleTvMode: () => void;
}

export const TvHostView: React.FC<TvHostViewProps> = ({
  room,
  question,
  players,
  onToggleTvMode
}) => {
  const contestant = players.find((p) => p.id === room.activeContestantId);
  const challengers = players.filter((p) => p.id !== room.activeContestantId);
  const votedCount = challengers.filter((c) => c.vote !== null).length;
  const isSelectionPhase = room.status === 'question_selection' || room.status === 'question_active';
  const isConfirmed = !isSelectionPhase && Boolean(room.selectedOption);

  const [timer, setTimer] = React.useState(room.timerSeconds);

  React.useEffect(() => {
    setTimer(room.timerSeconds);
  }, [room.timerSeconds]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (room.timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) return 0;
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

  const handleStartVoting = async () => {
    sounds.playClick();
    await gameService.startVoting(room.roomCode, players);
  };

  const handleResolve = async () => {
    sounds.playSuspense();
    await gameService.resolveRound(room.roomCode, room, players);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Left/Center: Main TV Stage Area */}
      <div className="flex-1 flex flex-col space-y-6">
        {/* Top TV Host Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                PANTALLA PRINCIPAL / MODO TV STUDIO
              </span>
              <h3 className="font-display font-black text-xl text-white">
                BULLSHIT: EL JUEGO DE LA MENTIRA
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-timer text-2xl text-amber-400 font-bold leading-none">
                {timer}s
              </span>
            </div>
            <button
              onClick={onToggleTvMode}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Vista de Jugador
            </button>
          </div>
        </div>

        {/* Contestant Podium Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-4xl shadow-xl glow-gold">
              {contestant?.avatar || '👑'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  En el "Hot Seat"
                </span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                {contestant?.name || 'Esperando concursante...'}
              </h2>
            </div>
          </div>

          {/* Current Claim status */}
          <div className="flex items-center gap-2">
            {isConfirmed && room.selectedOption ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-white flex items-center gap-3 glow-gold animate-in zoom-in-95">
                <span className="text-xs text-amber-300 uppercase font-black">Afirma:</span>
                <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                  {room.selectedOption}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 italic">
                Pensando su respuesta en privado...
              </div>
            )}
          </div>
        </div>

        {/* Big Question Stage */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>PREGUNTA #{room.currentQuestionIndex + 1}</span>
            <span className="text-amber-400">{question.category}</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-relaxed">
            {question.question}
          </h2>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const isSelectedByContestant = isConfirmed && room.selectedOption === opt;
              return (
                <div
                  key={opt}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                    isSelectedByContestant
                      ? 'bg-amber-500/20 border-amber-400 text-white glow-gold shadow-lg scale-[1.02]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    isSelectedByContestant
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {opt}
                  </span>
                  <span className="font-semibold text-base">
                    {question.options[opt]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Challengers Live Voting Mystery Wall */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h4 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                Panel de Retadores ({challengers.length})
              </h4>
            </div>
            <div className="text-xs font-bold text-slate-400">
              {room.status === 'voting' && (
                <span className="text-purple-400">Votos emitidos: {votedCount} / {challengers.length}</span>
              )}
            </div>
          </div>

          {/* Challengers row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {challengers.map((p) => {
              const hasVoted = p.vote !== null;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    hasVoted
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.avatar}</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[90px]">
                      {p.name}
                    </span>
                  </div>

                  {hasVoted ? (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      <Lock className="w-3 h-3" /> Votó
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      Pensando...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TV Host Phase Controls */}
        <div className="flex flex-wrap gap-3">
          {room.status === 'defense_phase' && (
            <button
              onClick={handleStartVoting}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 glow-gold shadow-xl flex items-center justify-center gap-2"
            >
              <Vote className="w-5 h-5" />
              Abrir Votación del Panel
            </button>
          )}

          {room.status === 'voting' && (
            <button
              onClick={handleResolve}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 glow-gold shadow-xl flex items-center justify-center gap-2"
            >
              Cerrar Votación y Revelar Resultados <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Column: The Iconic TV Ladder */}
      <div className="w-full lg:w-auto flex justify-center">
        <Ladder currentStep={room.ladderStep} />
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Room, Player, LADDER_PRIZES, getAvatarColorClasses } from '../types';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import { Trophy, RotateCcw, Crown, Sparkles, Home } from 'lucide-react';

interface GameOverViewProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  onLeave: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  room,
  players,
  currentPlayer,
  onLeave
}) => {
  const winner = players.find((p) => p.id === room.activeContestantId);
  const isGrandWinner = room.ladderStep >= LADDER_PRIZES.length - 1;
  const prize = isGrandWinner
    ? (LADDER_PRIZES[room.ladderStep]?.amount || '$1,000,000')
    : (room.lockedAmount || '$0');

  useEffect(() => {
    sounds.playTransition('game_over');
    sounds.playCashAscend(10);
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch {}
  }, []);

  const handleRestart = async () => {
    sounds.playClick();
    await gameService.startQuestion(room.roomCode, 0, players);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6 space-y-6 text-center animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center text-5xl shadow-2xl glow-gold animate-bounce">
        {isGrandWinner ? '🏆' : '🔒'}
      </div>

      <div className="space-y-3">
        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
          ¡FIN DEL JUEGO!
        </span>
        <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
          {isGrandWinner ? '¡CONQUISTÓ LA ESCALERA!' : '¡PARTIDA FINALIZADA!'}
        </h2>

        {winner && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <span className={`w-10 h-10 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${getAvatarColorClasses(winner.avatarColor).bgClass} ${getAvatarColorClasses(winner.avatarColor).borderClass}`}>
              {winner.avatar}
            </span>
            <span className="font-display font-black text-lg text-white">
              {winner.name}
            </span>
          </div>
        )}

        <p className="text-slate-300 text-sm max-w-md mx-auto">
          {isGrandWinner
            ? `${winner?.name || 'El Concursante'} alcanzó la cima del juego de la mentira con un premio total de:`
            : `${winner?.name || 'El Concursante'} se lleva a casa el premio asegurado por su decisión de candado:`}
        </p>
      </div>

      <div className="px-8 py-4 rounded-3xl bg-slate-900 border-2 border-amber-400 glow-gold shadow-2xl space-y-1">
        <span className="font-display font-black text-4xl sm:text-6xl text-amber-400">
          {prize}
        </span>
        {!isGrandWinner && (
          <span className="text-xs font-bold text-amber-300/80 block">
            Monto Asegurado por Candado
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-4">
        <button
          onClick={handleRestart}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-base uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-xl flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Nueva Partida
        </button>

        <button
          onClick={onLeave}
          className="py-4 px-6 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Salir al Menú
        </button>
      </div>
    </div>
  );
};

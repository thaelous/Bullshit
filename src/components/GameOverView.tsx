import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Room, Player, LADDER_PRIZES } from '../types';
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
  const prize = LADDER_PRIZES[room.ladderStep]?.amount || '$1,000,000';

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
        🏆
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
          ¡FIN DEL JUEGO!
        </span>
        <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
          ¡CONQUISTÓ LA ESCALERA!
        </h2>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          {winner?.name || 'El Concursante'} alcanzó la cima del juego de la mentira con un premio total de:
        </p>
      </div>

      <div className="px-8 py-4 rounded-3xl bg-slate-900 border-2 border-amber-400 glow-gold shadow-2xl">
        <span className="font-display font-black text-4xl sm:text-6xl text-amber-400">
          {prize}
        </span>
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

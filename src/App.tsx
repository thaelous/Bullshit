import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Player } from './types';
import { TRIVIA_QUESTIONS } from './data/questions';
import { gameService } from './services/gameSync';
import { sounds } from './services/soundEffects';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { ContestantView } from './components/ContestantView';
import { ChallengerView } from './components/ChallengerView';
import { TvHostView } from './components/TvHostView';
import { RevealView } from './components/RevealView';
import { GameOverView } from './components/GameOverView';
import { Ladder } from './components/Ladder';
import { FirebaseModal } from './components/FirebaseModal';
import { Tv, Smartphone } from 'lucide-react';

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isTvMode, setIsTvMode] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [initialRoomFromUrl, setInitialRoomFromUrl] = useState<string>('');

  // Extract ?room=CODE from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) {
        setInitialRoomFromUrl(r.toUpperCase().trim());
      }
    }
  }, []);

  // Subscribe to room and players whenever roomCode changes
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setPlayers([]);
      return;
    }

    const unsubRoom = gameService.subscribeRoom(roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
    });

    const unsubPlayers = gameService.subscribePlayers(roomCode, (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomCode]);

  // Audio transition manager for key game events across all connected clients
  const prevStatusRef = useRef<string | null>(null);
  const prevLadderStepRef = useRef<number>(0);
  const prevVotedCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (!room) {
      prevStatusRef.current = null;
      prevLadderStepRef.current = 0;
      prevVotedCountRef.current = 0;
      isFirstLoadRef.current = true;
      return;
    }

    if (isFirstLoadRef.current) {
      prevStatusRef.current = room.status;
      prevLadderStepRef.current = room.ladderStep;
      isFirstLoadRef.current = false;
      return;
    }

    // 1. Detect phase transition
    if (prevStatusRef.current !== room.status) {
      const prev = prevStatusRef.current;
      const current = room.status;
      prevStatusRef.current = current;

      if (current === 'question_selection' || current === 'question_active') {
        sounds.playTransition('question_start');
      } else if (current === 'defense_phase') {
        sounds.playTransition('defense_phase');
      } else if (current === 'voting') {
        sounds.playTransition('voting_start');
      } else if (current === 'reveal') {
        sounds.playTransition('reveal');
      } else if (current === 'game_over') {
        sounds.playTransition('game_over');
      }
    }

    // 2. Detect prize ladder ascension
    if (room.ladderStep > prevLadderStepRef.current && room.status !== 'lobby') {
      sounds.playCashAscend(room.ladderStep);
    }
    prevLadderStepRef.current = room.ladderStep;
  }, [room?.status, room?.ladderStep, room]);

  // 3. Audio feedback when challengers cast votes in the voting phase
  useEffect(() => {
    if (!room || room.status !== 'voting') {
      prevVotedCountRef.current = 0;
      return;
    }

    const currentVotedCount = players.filter((p) => p.role === 'challenger' && p.vote !== null).length;
    if (currentVotedCount > prevVotedCountRef.current) {
      sounds.playVoteRegistered();
    }
    prevVotedCountRef.current = currentVotedCount;
  }, [players, room?.status]);

  // 4. Manage continuous, low-volume 'studio audience' ambient track during active game phases
  useEffect(() => {
    if (!room) {
      sounds.stopAudienceAmbient(0.4);
      return;
    }

    const isActiveGamePhase =
      room.status === 'question_selection' ||
      room.status === 'question_active' ||
      room.status === 'defense_phase' ||
      room.status === 'voting';

    if (isActiveGamePhase) {
      sounds.startAudienceAmbient();
    } else {
      // Fade out during reveal (moment of truth), game over, or lobby
      sounds.stopAudienceAmbient(1.2);
    }

    return () => {
      sounds.stopAudienceAmbient(0.3);
    };
  }, [room?.status, room]);

  const handleGameJoined = (code: string, pId: string, host: boolean) => {
    setRoomCode(code);
    setPlayerId(pId);
    setIsHost(host);
    setIsTvMode(host);
  };

  const handleLeaveRoom = () => {
    sounds.stopAudienceAmbient(0.2);
    setRoomCode(null);
    setPlayerId(null);
    setIsHost(false);
    setRoom(null);
    setPlayers([]);
    // Clear URL param
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const currentPlayer = players.find((p) => p.id === playerId) || {
    id: playerId || 'guest',
    name: 'Invitado',
    avatar: '😎',
    role: 'challenger',
    vote: null,
    voteTimestamp: null,
    isReady: true,
    score: 0,
  };

  const questionsList = room?.customQuestions && room.customQuestions.length > 0
    ? room.customQuestions
    : TRIVIA_QUESTIONS;

  const currentQuestion = room
    ? questionsList[room.currentQuestionIndex % questionsList.length]
    : TRIVIA_QUESTIONS[0];

  const isContestant = currentPlayer.id === room?.activeContestantId;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 tv-stage-bg relative selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        roomCode={roomCode || undefined}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onLeaveRoom={roomCode ? handleLeaveRoom : undefined}
      />

      {/* Main Content Area with fluid animated screen transitions */}
      <main className="flex-1 flex flex-col justify-center items-center p-3 sm:p-6 w-full max-w-7xl mx-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {!roomCode || !room ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -45, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center"
            >
              <HomeView
                onGameJoined={handleGameJoined}
                initialRoomCode={initialRoomFromUrl}
              />
            </motion.div>
          ) : room.status === 'lobby' ? (
            <motion.div
              key="lobby-view"
              initial={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -50, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center"
            >
              <LobbyView
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                isHost={isHost}
                isTvDisplayMode={isTvMode}
                onSwitchToTvDisplay={() => setIsTvMode(true)}
              />
            </motion.div>
          ) : room.status === 'game_over' ? (
            <motion.div
              key="game-over-view"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center"
            >
              <GameOverView
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                onLeave={handleLeaveRoom}
              />
            </motion.div>
          ) : room.status === 'reveal' ? (
            <motion.div
              key={`reveal-view-${room.currentQuestionIndex}`}
              initial={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -50, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center"
            >
              <RevealView
                room={room}
                question={currentQuestion}
                players={players}
                currentPlayer={currentPlayer}
                isHost={isHost}
              />
            </motion.div>
          ) : (
            /* Active Question, Defense or Voting phases */
            <motion.div
              key={`active-round-${room.currentQuestionIndex}`}
              initial={{ opacity: 0, x: 50, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -50, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col space-y-4"
            >
              {/* View Switcher Bar for testing/party versatility */}
              <div className="flex items-center justify-between px-2">
                {/* Mobile Horizontal Ladder Bar */}
                <div className="flex-1 max-w-xl mr-3 lg:hidden">
                  <Ladder currentStep={room.ladderStep} horizontal />
                </div>

                <div className="ml-auto">
                  <button
                    onClick={() => setIsTvMode(!isTvMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all shadow-md"
                    title="Cambiar entre modo TV Studio y modo Jugador individual"
                  >
                    {isTvMode ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Modo Jugador</span>
                      </>
                    ) : (
                      <>
                        <Tv className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Modo TV Studio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic View based on Mode and Role */}
              {isTvMode ? (
                <TvHostView
                  room={room}
                  question={currentQuestion}
                  players={players}
                  onToggleTvMode={() => setIsTvMode(false)}
                />
              ) : isContestant ? (
                <ContestantView
                  room={room}
                  question={currentQuestion}
                  players={players}
                  currentPlayer={currentPlayer}
                />
              ) : (
                <ChallengerView
                  room={room}
                  question={currentQuestion}
                  players={players}
                  currentPlayer={currentPlayer}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Firebase Configuration Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        onConfigChanged={() => {
          // Re-render
          setRoomCode((prev) => (prev ? `${prev}` : null));
        }}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Room, Player, QuestionSet, PREDEFINED_AVATAR_ICONS, PREDEFINED_AVATAR_COLORS, getAvatarColorClasses } from '../types';
import { TRIVIA_QUESTIONS } from '../data/questions';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import { downloadExcelTemplate } from '../services/excelService';
import { QuestionBankModal } from './QuestionBankModal';
import {
  Users,
  Play,
  Copy,
  Check,
  Bot,
  Sparkles,
  QrCode as QrIcon,
  Crown,
  Share2,
  Tv,
  FileSpreadsheet,
  Download,
  FolderOpen,
  Palette,
  Smile,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LobbyViewProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  isHost: boolean;
  onSwitchToTvDisplay?: () => void;
  isTvDisplayMode?: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  players,
  currentPlayer,
  isHost,
  onSwitchToTvDisplay,
  isTvDisplayMode = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [starting, setStarting] = useState(false);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(true);

  const handleSelectAvatarIcon = async (icon: string) => {
    sounds.playClick();
    if (!currentPlayer.id || currentPlayer.id === 'guest') return;
    await gameService.updatePlayer(room.roomCode, currentPlayer.id, { avatar: icon });
  };

  const handleSelectAvatarColor = async (colorId: string) => {
    sounds.playClick();
    if (!currentPlayer.id || currentPlayer.id === 'guest') return;
    await gameService.updatePlayer(room.roomCode, currentPlayer.id, { avatarColor: colorId });
  };

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomCode}&role=challenger`
    : '';

  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 1.5,
        color: {
          dark: '#050811',
          light: '#f59e0b'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Gen error', err));
    }
  }, [joinUrl]);

  // Subscribe to QuestionSets in real time (onSnapshot)
  useEffect(() => {
    const unsub = gameService.subscribeQuestionSets((sets) => {
      setQuestionSets(sets);
    });
    return () => unsub();
  }, []);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(joinUrl);
    sounds.playClick();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleAssignContestant = async (playerId: string) => {
    sounds.playClick();
    await gameService.assignContestant(room.roomCode, playerId, players);
  };

  const handleRandomContestant = async () => {
    if (players.length === 0) return;
    sounds.playSuspense();
    const candidatePlayers = players.filter((p) => !p.isBot);
    const pool = candidatePlayers.length > 0 ? candidatePlayers : players;
    const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
    await gameService.assignContestant(room.roomCode, randomPlayer.id, players);
  };

  const handleAddBot = async () => {
    sounds.playClick();
    await gameService.addBotPlayer(room.roomCode);
  };

  const handleSelectSetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    sounds.playClick();
    if (val === 'default') {
      await gameService.setRoomQuestionSet(room.roomCode, 'Preguntas Clásicas (Default)', null);
    } else {
      const target = questionSets.find((s) => s.id === val || s.name === val);
      if (target) {
        await gameService.setRoomQuestionSet(room.roomCode, target.name, target.questions);
      }
    }
  };

  const handleStartGame = async () => {
    if (!room.activeContestantId) {
      alert('Debes asignar a "El Mentiroso" antes de iniciar la partida.');
      return;
    }
    if (players.length < 2) {
      alert('Se recomienda al menos 2 participantes (1 Mentiroso y al menos 1 Retador). Puedes pulsar "+ Agregar Bot" para probar de inmediato.');
      return;
    }
    setStarting(true);
    sounds.playSuspense();
    await gameService.startQuestion(room.roomCode, 0, players);
  };

  const contestant = players.find((p) => p.id === room.activeContestantId);
  const challengers = players.filter((p) => p.id !== room.activeContestantId);
  const canStart = Boolean(room.activeContestantId && players.length >= 2);

  const activeQuestionCount = room.customQuestions && room.customQuestions.length > 0
    ? room.customQuestions.length
    : TRIVIA_QUESTIONS.length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Lobby Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Sala de Espera del Concurso
        </div>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          ¡PREPÁRENSE PARA EL SHOW!
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Escanea el código QR con la cámara de tu teléfono para unirte como panelista o comparte el código de sala.
        </p>
      </div>

      {/* QUESTION SET SELECTOR BAR (REAL-TIME FIRESTORE ON SNAPSHOT) */}
      <div className="w-full bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Plantilla de Preguntas:
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeQuestionCount} preguntas
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Set activo en esta sala: <strong className="text-amber-400">{room.questionSetName || 'Preguntas Clásicas (Default)'}</strong>
            </p>
          </div>
        </div>

        {/* Dropdown Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={
              room.questionSetName && room.questionSetName !== 'Preguntas Clásicas (Default)'
                ? questionSets.find((s) => s.name === room.questionSetName)?.id || 'default'
                : 'default'
            }
            onChange={handleSelectSetChange}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 focus:border-amber-400 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="default">
              Preguntas Clásicas (Default) ({TRIVIA_QUESTIONS.length} preguntas)
            </option>
            {questionSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.questionCount} preguntas)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              sounds.playClick();
              setIsBankModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Abrir Banco de Preguntas y subir Excel"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Subir Plantilla Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              downloadExcelTemplate();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Descargar Plantilla Base (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Plantilla Base (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Lobby Grid: QR & Code on Left, Connected Players on Right */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: QR Code & Join Info */}
        <div className="md:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400 mb-1">
            Código de Sala
          </span>
          <div className="font-display font-black text-5xl sm:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 mb-4 select-all drop-shadow">
            {room.roomCode}
          </div>

          {/* QR Code Container */}
          <div className="relative p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl shadow-xl shadow-amber-500/10 transform transition-transform group-hover:scale-105 duration-300">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR para unirse a la sala ${room.roomCode}`}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain bg-amber-500"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-900 rounded-xl flex items-center justify-center">
                <QrIcon className="w-12 h-12 text-amber-500 animate-spin" />
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-400 font-medium">
            Apunta la cámara de tu celular al código QR
          </p>

          <div className="mt-4 flex flex-wrap gap-2 justify-center w-full">
            <button
              onClick={copyInviteLink}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: '¡Únete a Bullshit: El Juego de la Mentira!',
                    url: joinUrl,
                  }).catch(() => {});
                } else {
                  copyInviteLink();
                }
              }}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700 text-xs"
              title="Compartir"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Contestant Spotlight & Panelists List */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          {/* Active Contestant Card or Assignment Prompt */}
          {contestant ? (
            <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
                  <span className="font-display font-black text-sm uppercase tracking-wider text-amber-300">
                    🎭 EL MENTIROSO EN EL ESTRADO (HOT SEAT)
                  </span>
                </div>
                {isHost && (
                  <button
                    onClick={handleRandomContestant}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1"
                    title="Elegir otro mentiroso al azar"
                  >
                    🎲 Rotar al azar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 ${getAvatarColorClasses(contestant.avatarColor).bgClass} ${getAvatarColorClasses(contestant.avatarColor).borderClass} glow-gold flex-shrink-0`}>
                  {contestant.avatar || '👑'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-black text-xl text-white flex items-center gap-2 truncate">
                    {contestant.name}
                    {contestant.id === currentPlayer.id && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        TÚ
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Deberá convencer verbalmente al jurado: puede decir la verdad o inventar un gran Bullshit.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-slate-900/60 border-2 border-dashed border-amber-500/50 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl mx-auto">
                🎭
              </div>
              <div>
                <h4 className="font-display font-black text-base text-amber-300 uppercase tracking-wider">
                  FALTA ASIGNAR A "EL MENTIROSO"
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  {isHost
                    ? 'Haz clic en "Asignar como El Mentiroso" en cualquiera de los participantes conectados o pulsa el botón de selección aleatoria.'
                    : 'Esperando que el Instructor asigne a quién le tocará el Hot Seat en esta ronda...'}
                </p>
              </div>
              {isHost && players.length > 0 && (
                <button
                  onClick={handleRandomContestant}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2"
                >
                  🎲 Asignar Mentiroso al Azar
                </button>
              )}
            </div>
          )}

          {/* Participant Notice for Mobile Devices */}
          {!isHost && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
              contestant?.id === currentPlayer.id
                ? 'bg-amber-950/40 border-amber-400/50 text-amber-200'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
            }`}>
              <span className="text-xl">
                {contestant?.id === currentPlayer.id ? '👑' : '🎯'}
              </span>
              <div>
                <p className="font-bold">
                  {contestant?.id === currentPlayer.id
                    ? '¡Has sido seleccionado como EL MENTIROSO!'
                    : 'Eres parte del PANEL DE RETADORES'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {contestant?.id === currentPlayer.id
                    ? 'Responderás en el estrado. Al iniciar la pregunta, verás en secreto si acertaste o si tendrás que jugar al engaño.'
                    : 'Escucharás la defensa del mentiroso en vivo y votarás desde este celular si le crees o si gritas ¡MENTIROSO!'}
                </p>
              </div>
            </div>
          )}

          {/* PLAYER AVATAR & COLOR SELECTION CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm uppercase tracking-wider text-white">
                    Personaliza Tu Avatar y Color
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Elige el ícono y color con el que te verán en pantalla
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Active preview badge */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl border shadow-md ${getAvatarColorClasses(currentPlayer.avatarColor).bgClass} ${getAvatarColorClasses(currentPlayer.avatarColor).borderClass}`}>
                  {currentPlayer.avatar || '😎'}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title={isAvatarPickerOpen ? 'Ocultar selector' : 'Mostrar selector'}
                >
                  {isAvatarPickerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isAvatarPickerOpen && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80 animate-in fade-in duration-200">
                {/* 1. Predefined Icon Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-amber-400" />
                      Ícono de Avatar ({PREDEFINED_AVATAR_ICONS.length}):
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-medium">Toca para cambiar</span>
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 bg-slate-950/70 p-2 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto">
                    {PREDEFINED_AVATAR_ICONS.map((icon) => {
                      const isSelected = (currentPlayer.avatar || '😎') === icon;
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => handleSelectAvatarIcon(icon)}
                          className={`h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                            isSelected
                              ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg glow-gold ring-2 ring-amber-400/50'
                              : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:scale-105 active:scale-95'
                          }`}
                          title={`Seleccionar ${icon}`}
                        >
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Predefined Color Palette Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      Color de la Tarjeta ({PREDEFINED_AVATAR_COLORS.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {getAvatarColorClasses(currentPlayer.avatarColor).name}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {PREDEFINED_AVATAR_COLORS.map((col) => {
                      const isSelected = (currentPlayer.avatarColor || 'amber') === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleSelectAvatarColor(col.id)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-slate-900 border-white ring-2 ring-white/60 shadow-lg scale-105'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 active:scale-95'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shadow-inner border border-white/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-[9px] font-bold text-slate-300 truncate max-w-full">
                            {col.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connected Participants List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                  Participantes Conectados ({players.length})
                </h4>
              </div>
              {isHost && players.length > 1 && (
                <button
                  onClick={handleRandomContestant}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  🎲 Ruleta al azar
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-56 pr-1">
              {players.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                  <p>Aún no hay participantes conectados.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Escanea el código QR desde tu celular para unirte o añade un bot.
                  </p>
                </div>
              ) : (
                players.map((p) => {
                  const isCurrentLiar = p.id === room.activeContestantId;
                  const pColor = getAvatarColorClasses(p.avatarColor);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isCurrentLiar
                          ? 'bg-amber-950/30 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl border ${pColor.bgClass} ${pColor.borderClass} shadow-md flex-shrink-0`}>
                          {p.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-200">
                              {p.name}
                            </span>
                            {p.id === currentPlayer.id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                TÚ
                              </span>
                            )}
                            {p.isBot && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800 flex items-center gap-1">
                                <Bot className="w-2.5 h-2.5" /> BOT
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold ${
                            isCurrentLiar ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {isCurrentLiar ? '👑 El Mentiroso' : 'Panelista Retador'}
                          </span>
                        </div>
                      </div>

                      {/* Host Actions per Player */}
                      <div className="flex items-center gap-2">
                        {isHost && !isCurrentLiar && (
                          <button
                            onClick={() => handleAssignContestant(p.id)}
                            className="py-1 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <span>Asignar como El Mentiroso</span>
                          </button>
                        )}
                        {isCurrentLiar && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ✓ Asignado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Bot Adder Button */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={handleAddBot}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-bold transition-colors py-1.5 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/50"
              >
                <Bot className="w-3.5 h-3.5" />
                + Agregar Bot Panelista (Para pruebas rápidas)
              </button>

              {onSwitchToTvDisplay && !isTvDisplayMode && (
                <button
                  onClick={onSwitchToTvDisplay}
                  className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  title="Modo Pantalla Principal para TV o Proyector"
                >
                  <Tv className="w-3.5 h-3.5" />
                  Modo TV
                </button>
              )}
            </div>
          </div>

          {/* Start Game Action */}
          <div className="pt-2">
            <button
              onClick={handleStartGame}
              disabled={starting || !canStart}
              className={`w-full py-4 px-6 rounded-2xl font-display font-black text-xl tracking-wider uppercase transition-all flex items-center justify-center gap-3 ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-[0.99] glow-gold shadow-2xl cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              {starting
                ? 'INICIANDO SHOW...'
                : !room.activeContestantId
                ? 'ASIGNA AL MENTIROSO PRIMERO'
                : players.length < 2
                ? 'SE NECESITA AL MENOS 1 RETADOR'
                : '¡INICIAR JUEGO!'}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              {isHost
                ? 'Control del Instructor: una vez elegido el mentiroso, inicia la primera ronda para todo el salón.'
                : 'Esperando que el Instructor inicie la partida desde la pantalla principal.'}
            </p>
          </div>
        </div>
      </div>

      {/* QUESTION BANK MODAL */}
      <QuestionBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        room={room}
        isHost={isHost}
      />
    </div>
  );
};

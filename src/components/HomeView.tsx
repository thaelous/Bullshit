import React, { useState, useEffect } from 'react';
import { gameService } from '../services/gameSync';
import { sounds } from '../services/soundEffects';
import {
  Flame,
  Users,
  Play,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Tv,
  HelpCircle,
  Trophy
} from 'lucide-react';

const AVATARS = ['😎', '🦁', '🦊', '🦉', '👑', '🕵️‍♀️', '🤖', '🎭', '🎩', '⚡', '🍀', '🚀'];

interface HomeViewProps {
  onGameJoined: (roomCode: string, playerId: string, isHost: boolean) => void;
  initialRoomCode?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onGameJoined,
  initialRoomCode = ''
}) => {
  const [mode, setMode] = useState<'welcome' | 'create' | 'join' | 'qr_join'>(
    initialRoomCode ? 'qr_join' : 'welcome'
  );
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isTvDisplay, setIsTvDisplay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase().trim());
      setMode('qr_join');
    }
  }, [initialRoomCode]);

  const handleCreateInstructorRoom = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      sounds.playClick();
      const hostId = `host_instructor_${Date.now()}`;
      const room = await gameService.createInstructorRoom(hostId);
      onGameJoined(room.roomCode, hostId, true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creando la sala del instructor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      sounds.playClick();
      const hostId = `host_${Date.now()}`;
      const { room } = await gameService.createRoom(
        hostId,
        playerName.trim(),
        selectedAvatar,
        !isTvDisplay
      );
      onGameJoined(room.roomCode, hostId, true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creando la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCode = (mode === 'qr_join' ? initialRoomCode : roomCode).toUpperCase().trim();
    if (!targetCode) {
      setErrorMsg('Código de sala no válido');
      return;
    }
    if (!playerName.trim()) {
      setErrorMsg('Por favor ingresa tu Nombre o Apodo');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      sounds.playClick();
      const playerId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await gameService.joinRoom(targetCode, playerId, playerName.trim(), selectedAvatar, 'challenger');
      onGameJoined(targetCode, playerId, false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al unirse a la sala');
    } finally {
      setLoading(false);
    }
  };

  // Instant Quick Demo Play (Creates room + 3 bots)
  const handleQuickDemo = async () => {
    setLoading(true);
    sounds.playCashAscend();
    try {
      const hostId = `host_${Date.now()}`;
      const { room } = await gameService.createRoom(
        hostId,
        'Tú (Concursante)',
        '👑',
        true
      );
      // Auto-add 3 bots
      await gameService.addBotPlayer(room.roomCode, 'Mateo (Escéptico)');
      await gameService.addBotPlayer(room.roomCode, 'Sofía (Analítica)');
      await gameService.addBotPlayer(room.roomCode, 'Lucas (Confiado)');

      onGameJoined(room.roomCode, hostId, true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
      {/* Hero Title Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Concurso Multijugador en Tiempo Real
        </div>

        <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-2xl">
          ¡BULLSHIT!
        </h1>

        <p className="font-display font-extrabold text-lg sm:text-2xl text-slate-200 tracking-wide uppercase">
          El Juego de la Mentira
        </p>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          ¿No te sabes la respuesta? <span className="text-amber-400 font-bold">¡Invéntala con seguridad!</span> Si convences a al menos un retador del panel, te llevas el dinero. Si todos descubren tu mentira, ¡quedarás fuera!
        </p>
      </div>

      {/* Main Choice Card */}
      {mode === 'welcome' && (
        <div className="w-full max-w-lg space-y-5">
          {/* Card 1: INSTRUCTOR / HOST (TV / PROYECTOR) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5" />
                PANTALLA PRINCIPAL / PROYECTOR
              </div>
              <span className="text-[11px] font-bold text-slate-400">Sin registro de jugador</span>
            </div>

            <div>
              <h2 className="font-display font-black text-2xl text-white">
                Modo Instructor / Presentador
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Panel de control y display del show para Smart TV o proyector. Genera el código QR para que los participantes se conecten desde sus celulares.
              </p>
            </div>

            <button
              onClick={handleCreateInstructorRoom}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>{loading ? 'Generando Sala...' : 'CREAR SALA Y GENERAR QR'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Card 2: PARTICIPANTES (CELULARES) */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
                Participantes
              </span>
              <span className="text-[11px] text-slate-400">Desde tu teléfono móvil</span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setMode('join');
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-950 border border-slate-700 hover:border-cyan-400/60 text-slate-200 hover:text-white font-display font-bold text-base uppercase tracking-wider transition-all flex items-center justify-between shadow"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Ingresar con Código de Sala</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              (O escanea directamente el código QR proyectado en la pantalla principal)
            </p>
          </div>

          {/* Quick Demo Button */}
          <div className="pt-1">
            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full p-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4 text-purple-400" />
              <span>Partida Rápida de Prueba (Con 3 Bots Panelistas)</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode: Create Room */}
      {mode === 'create' && (
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
              Crear Sala del Show
            </h2>
            <button
              onClick={() => setMode('welcome')}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Volver
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tu Nombre o Apodo
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Sofía, Alex, El Mentiroso..."
                maxLength={30}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedAvatar === av
                        ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-md'
                        : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* TV Screen Mode toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="tvToggle"
                checked={isTvDisplay}
                onChange={(e) => setIsTvDisplay(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="tvToggle" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Esta pantalla es un Smart TV / Proyector (Modo Display)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-2xl flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              {loading ? 'Creando Sala...' : 'Crear Sala y Generar QR'}
            </button>
          </form>
        </div>
      )}

      {/* Mode: QR Join (Direct scan from mobile) */}
      {mode === 'qr_join' && (
        <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                SALA DETECTADA: {initialRoomCode}
              </span>
            </div>
            <button
              onClick={() => setMode('welcome')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cambiar Sala
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-display font-black text-2xl text-white">
              ¡Únete como Retador!
            </h2>
            <p className="text-xs text-slate-300">
              Votarás desde este teléfono para descubrir si el concursante miente o dice la verdad.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tu Nombre o Apodo <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Lucas, Valentina, El Escéptico..."
                maxLength={30}
                autoFocus
                required
                className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-4 py-3.5 text-base text-white font-semibold outline-none shadow-inner"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedAvatar === av
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105 shadow-md'
                        : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !playerName.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-green shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              {loading ? 'Conectando al Panel...' : '¡ENTRAR AL PANEL DE RETADORES! →'}
            </button>
          </form>
        </div>
      )}

      {/* Mode: Join Room */}
      {mode === 'join' && (
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
              Unirse al Panel
            </h2>
            <button
              onClick={() => setMode('welcome')}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Volver
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Código de Sala (4 caracteres)
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ej. BULL"
                maxLength={6}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-lg text-amber-400 font-mono font-black tracking-widest text-center uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tu Nombre de Retador
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej. Mateo, Carmen..."
                maxLength={30}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedAvatar === av
                        ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-md'
                        : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display font-black text-lg uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all glow-gold shadow-2xl flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              {loading ? 'Conectando...' : 'Entrar a la Partida'}
            </button>
          </form>
        </div>
      )}

      {/* Game Rules Card / Features */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
            1
          </div>
          <h4 className="font-bold text-sm text-white">Pregunta Difícil</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            El concursante en turno ve la respuesta real en secreto y elige si dirá la verdad o inventará un engaño ("Bullshit").
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
            2
          </div>
          <h4 className="font-bold text-sm text-white">Defensa Verbal</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            El concursante mira al panel a los ojos e intenta convencerlos antes de que termine el tiempo de defensa.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
            3
          </div>
          <h4 className="font-bold text-sm text-white">¡Bullshit o Verdad!</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Los panelistas votan en sus celulares. Si mintió pero al menos 1 le cree, ¡el concursante gana y sube de premio!
          </p>
        </div>
      </div>
    </div>
  );
};

import {
  getFirestoreDB,
  isFirebaseConfigured,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { Room, Player, RoomStatus, VoteType, RoundResult, LADDER_PRIZES, Question, QuestionSet } from '../types';
import { TRIVIA_QUESTIONS } from '../data/questions';

// Helper to generate room code (e.g. BULL-42)
export function generateRoomCode(): string {
  const num = Math.floor(10 + Math.random() * 90);
  return `BULL-${num}`;
}

// Local simulation fallback store (for multi-tab testing without Firestore setup)
interface LocalStore {
  rooms: Record<string, Room>;
  players: Record<string, Record<string, Player>>;
  questionSets: Record<string, QuestionSet>;
}

const LOCAL_STORAGE_KEY = 'bullshit_local_game_store';

function getLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.questionSets) parsed.questionSets = {};
      return parsed;
    }
  } catch {}
  return { rooms: {}, players: {}, questionSets: {} };
}

function saveLocalStore(store: LocalStore) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// BroadcastChannel for cross-tab local updates
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('bullshit_multitab_bus')
  : null;

type Unsubscribe = () => void;

export class GameService {
  private activeRoomSubscribers: Map<string, Set<(room: Room | null) => void>> = new Map();
  private activePlayersSubscribers: Map<string, Set<(players: Player[]) => void>> = new Map();
  private activeQuestionSetsSubscribers: Set<(sets: QuestionSet[]) => void> = new Set();

  constructor() {
    if (channel) {
      channel.onmessage = (event) => {
        const { type, roomCode } = event.data;
        if (type === 'ROOM_CHANGED' && roomCode) {
          this.notifyLocalSubscribers(roomCode);
        }
        if (type === 'QUESTION_SETS_CHANGED') {
          this.notifyQuestionSetsSubscribers();
        }
      };
    }
  }

  private notifyLocalSubscribers(roomCode: string) {
    const store = getLocalStore();
    const room = store.rooms[roomCode] || null;
    const roomSubs = this.activeRoomSubscribers.get(roomCode);
    if (roomSubs) {
      roomSubs.forEach((cb) => cb(room ? { ...room } : null));
    }

    const playerMap = store.players[roomCode] || {};
    const playerList = Object.values(playerMap);
    const playerSubs = this.activePlayersSubscribers.get(roomCode);
    if (playerSubs) {
      playerSubs.forEach((cb) => cb([...playerList]));
    }
  }

  private notifyQuestionSetsSubscribers() {
    const store = getLocalStore();
    const sets = Object.values(store.questionSets || {}).sort((a, b) => b.createdAt - a.createdAt);
    this.activeQuestionSetsSubscribers.forEach((cb) => cb([...sets]));
  }

  private broadcastLocalChange(roomCode: string) {
    this.notifyLocalSubscribers(roomCode);
    if (channel) {
      channel.postMessage({ type: 'ROOM_CHANGED', roomCode });
    }
  }

  private broadcastQuestionSetsChange() {
    this.notifyQuestionSetsSubscribers();
    if (channel) {
      channel.postMessage({ type: 'QUESTION_SETS_CHANGED' });
    }
  }

  // CREATE INSTRUCTOR ROOM (PROYECTOR / SMART TV DISPLAY ONLY - DOES NOT ADD HOST AS PLAYER)
  async createInstructorRoom(hostId: string): Promise<Room> {
    const roomCode = generateRoomCode();
    const db = getFirestoreDB();

    const initialRoom: Room = {
      roomCode,
      status: 'lobby',
      currentQuestionIndex: 0,
      activeContestantId: null,
      selectedOption: null,
      ladderStep: 0,
      timerSeconds: 45,
      timerActive: false,
      hostId,
      createdAt: Date.now(),
      roundResult: null,
    };

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'rooms', roomCode), initialRoom);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${roomCode}`);
      }
    } else {
      const store = getLocalStore();
      store.rooms[roomCode] = initialRoom;
      store.players[roomCode] = {};
      saveLocalStore(store);
      this.broadcastLocalChange(roomCode);
    }

    return initialRoom;
  }

  // ASSIGN THE LIAR (CONCURSANTE EN EL ESTRADO) AND SET REST AS CHALLENGERS
  async assignContestant(roomCode: string, contestantId: string, players: Player[]) {
    const code = roomCode.toUpperCase().trim();
    await this.updateRoom(code, { activeContestantId: contestantId });

    for (const p of players) {
      const newRole: 'contestant' | 'challenger' = p.id === contestantId ? 'contestant' : 'challenger';
      if (p.role !== newRole) {
        await this.updatePlayer(code, p.id, { role: newRole });
      }
    }
  }

  // CREATE ROOM (WITH HOST AS PARTICIPANT)
  async createRoom(hostId: string, hostName: string, avatar: string, isContestant: boolean = true): Promise<{ room: Room; player: Player }> {
    const roomCode = generateRoomCode();
    const db = getFirestoreDB();

    const initialRoom: Room = {
      roomCode,
      status: 'lobby',
      currentQuestionIndex: 0,
      activeContestantId: isContestant ? hostId : null,
      selectedOption: null,
      ladderStep: 0,
      timerSeconds: 45,
      timerActive: false,
      hostId,
      createdAt: Date.now(),
      roundResult: null,
    };

    const initialPlayer: Player = {
      id: hostId,
      name: hostName,
      avatar,
      role: isContestant ? 'contestant' : 'challenger',
      vote: null,
      voteTimestamp: null,
      isReady: true,
      score: 0,
      isBot: false,
    };

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'rooms', roomCode), initialRoom);
        await setDoc(doc(db, 'rooms', roomCode, 'players', hostId), initialPlayer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${roomCode}`);
      }
    } else {
      // Local fallback
      const store = getLocalStore();
      store.rooms[roomCode] = initialRoom;
      store.players[roomCode] = { [hostId]: initialPlayer };
      saveLocalStore(store);
      this.broadcastLocalChange(roomCode);
    }

    return { room: initialRoom, player: initialPlayer };
  }

  // JOIN ROOM
  async joinRoom(roomCode: string, playerId: string, playerName: string, avatar: string, roleOverride?: 'contestant' | 'challenger'): Promise<Player> {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    // Check if room exists
    let room = await this.getRoom(code);
    if (!room) {
      throw new Error(`La sala ${code} no existe o ya ha finalizado.`);
    }

    // Role assignment: if roleOverride is provided use it, otherwise assign based on contestant existence
    const role: 'contestant' | 'challenger' = roleOverride || (room.activeContestantId ? 'challenger' : 'contestant');

    const newPlayer: Player = {
      id: playerId,
      name: playerName.trim(),
      avatar,
      role,
      vote: null,
      voteTimestamp: null,
      isReady: true,
      score: 0,
      isBot: false,
    };

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'rooms', code, 'players', playerId), newPlayer);
        // If room had no contestant, set this player as contestant
        if (!room.activeContestantId && role === 'contestant') {
          await updateDoc(doc(db, 'rooms', code), { activeContestantId: playerId });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${code}/players/${playerId}`);
      }
    } else {
      const store = getLocalStore();
      if (!store.players[code]) store.players[code] = {};
      store.players[code][playerId] = newPlayer;
      if (!store.rooms[code].activeContestantId && role === 'contestant') {
        store.rooms[code].activeContestantId = playerId;
      }
      saveLocalStore(store);
      this.broadcastLocalChange(code);
    }

    return newPlayer;
  }

  // GET ROOM
  async getRoom(roomCode: string): Promise<Room | null> {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      try {
        const snap = await getDoc(doc(db, 'rooms', code));
        return snap.exists() ? (snap.data() as Room) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `rooms/${code}`);
      }
    } else {
      const store = getLocalStore();
      return store.rooms[code] || null;
    }
  }

  // SUBSCRIBE TO ROOM
  subscribeRoom(roomCode: string, onUpdate: (room: Room | null) => void, onError?: (err: unknown) => void): Unsubscribe {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      const unsub = onSnapshot(
        doc(db, 'rooms', code),
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as Room);
          } else {
            onUpdate(null);
          }
        },
        (error) => {
          if (onError) onError(error);
          else handleFirestoreError(error, OperationType.GET, `rooms/${code}`);
        }
      );
      return unsub;
    } else {
      if (!this.activeRoomSubscribers.has(code)) {
        this.activeRoomSubscribers.set(code, new Set());
      }
      this.activeRoomSubscribers.get(code)!.add(onUpdate);

      // Trigger immediate initial update
      const store = getLocalStore();
      const current = store.rooms[code] || null;
      onUpdate(current);

      return () => {
        const subs = this.activeRoomSubscribers.get(code);
        if (subs) {
          subs.delete(onUpdate);
          if (subs.size === 0) this.activeRoomSubscribers.delete(code);
        }
      };
    }
  }

  // SUBSCRIBE TO PLAYERS
  subscribePlayers(roomCode: string, onUpdate: (players: Player[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      const unsub = onSnapshot(
        collection(db, 'rooms', code, 'players'),
        (snapshot) => {
          const list: Player[] = [];
          snapshot.forEach((d) => list.push(d.data() as Player));
          onUpdate(list);
        },
        (error) => {
          if (onError) onError(error);
          else handleFirestoreError(error, OperationType.LIST, `rooms/${code}/players`);
        }
      );
      return unsub;
    } else {
      if (!this.activePlayersSubscribers.has(code)) {
        this.activePlayersSubscribers.set(code, new Set());
      }
      this.activePlayersSubscribers.get(code)!.add(onUpdate);

      // Trigger immediate initial update
      const store = getLocalStore();
      const playerMap = store.players[code] || {};
      onUpdate(Object.values(playerMap));

      return () => {
        const subs = this.activePlayersSubscribers.get(code);
        if (subs) {
          subs.delete(onUpdate);
          if (subs.size === 0) this.activePlayersSubscribers.delete(code);
        }
      };
    }
  }

  // UPDATE ROOM
  async updateRoom(roomCode: string, updates: Partial<Room>) {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'rooms', code), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `rooms/${code}`);
      }
    } else {
      const store = getLocalStore();
      if (store.rooms[code]) {
        store.rooms[code] = { ...store.rooms[code], ...updates };
        saveLocalStore(store);
        this.broadcastLocalChange(code);
      }
    }
  }

  // UPDATE PLAYER
  async updatePlayer(roomCode: string, playerId: string, updates: Partial<Player>) {
    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'rooms', code, 'players', playerId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `rooms/${code}/players/${playerId}`);
      }
    } else {
      const store = getLocalStore();
      if (store.players[code] && store.players[code][playerId]) {
        store.players[code][playerId] = { ...store.players[code][playerId], ...updates };
        saveLocalStore(store);
        this.broadcastLocalChange(code);
      }
    }
  }

  // ADD BOT PLAYER (Quick testing / Party filling)
  async addBotPlayer(roomCode: string, name?: string) {
    const botNames = ['Mateo (El Escéptico)', 'Sofía (Detectora de Mentiras)', 'Lucas (Confiado)', 'Valentina (Audaz)', 'Alejandro (Investigador)'];
    const botAvatars = ['🧐', '🕵️‍♀️', '😎', '🦁', '🦉'];
    const randomIdx = Math.floor(Math.random() * botNames.length);

    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botPlayer: Player = {
      id: botId,
      name: name || botNames[randomIdx],
      avatar: botAvatars[randomIdx],
      role: 'challenger',
      vote: null,
      voteTimestamp: null,
      isReady: true,
      score: 0,
      isBot: true,
    };

    const code = roomCode.toUpperCase().trim();
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'rooms', code, 'players', botId), botPlayer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${code}/players/${botId}`);
      }
    } else {
      const store = getLocalStore();
      if (!store.players[code]) store.players[code] = {};
      store.players[code][botId] = botPlayer;
      saveLocalStore(store);
      this.broadcastLocalChange(code);
    }
  }

  // START QUESTION / ROUND
  async startQuestion(roomCode: string, questionIndex: number, players: Player[]) {
    const code = roomCode.toUpperCase().trim();

    // Reset votes of all players
    for (const p of players) {
      await this.updatePlayer(code, p.id, { vote: null, voteTimestamp: null });
    }

    await this.updateRoom(code, {
      status: 'question_selection',
      currentQuestionIndex: questionIndex,
      selectedOption: null,
      roundResult: null,
      timerSeconds: 45,
      timerActive: true,
    });
  }

  // CONTESTANT SELECTS & CONFIRMS ANSWER -> DEFENSE PHASE
  async confirmAnswer(roomCode: string, option: 'A' | 'B' | 'C' | 'D') {
    const code = roomCode.toUpperCase().trim();
    await this.updateRoom(code, {
      selectedOption: option,
      status: 'defense_phase',
      timerSeconds: 30,
      timerActive: true,
    });
  }

  // TRANSITION TO VOTING PHASE
  async startVoting(roomCode: string, players: Player[]) {
    const code = roomCode.toUpperCase().trim();
    await this.updateRoom(code, {
      status: 'voting',
      timerSeconds: 20,
      timerActive: true,
    });

    // Simulate bot votes automatically with realistic delay!
    const bots = players.filter((p) => p.isBot && p.role === 'challenger');
    bots.forEach((bot) => {
      const delayMs = 2000 + Math.random() * 6000;
      setTimeout(async () => {
        // Bots have a 50/50 intuition
        const botVote: VoteType = Math.random() > 0.45 ? 'bullshit' : 'believe';
        await this.castVote(code, bot.id, botVote);
      }, delayMs);
    });
  }

  // CAST VOTE BY CHALLENGER
  async castVote(roomCode: string, playerId: string, vote: 'believe' | 'bullshit') {
    const code = roomCode.toUpperCase().trim();
    await this.updatePlayer(code, playerId, {
      vote,
      voteTimestamp: Date.now(),
    });
  }

  // RESOLVE ROUND (THE CLIMAX OF THE TV SHOW)
  async resolveRound(roomCode: string, room: Room, players: Player[]) {
    const code = roomCode.toUpperCase().trim();
    const questionsList = room.customQuestions && room.customQuestions.length > 0 ? room.customQuestions : TRIVIA_QUESTIONS;
    const currentQ = questionsList[room.currentQuestionIndex % questionsList.length];
    const contestant = players.find((p) => p.id === room.activeContestantId);
    const challengers = players.filter((p) => p.role === 'challenger');

    const selected = room.selectedOption || 'A';
    const isTruth = selected === currentQ.correctOption;
    const wasLie = !isTruth;

    const believers = challengers.filter((c) => c.vote === 'believe').map((c) => c.name);
    const doubters = challengers.filter((c) => c.vote === 'bullshit').map((c) => c.name);

    let contestantWon = false;
    let reason = '';
    let newLadderStep = room.ladderStep;
    let newContestantId = room.activeContestantId;
    let newContestantName = contestant?.name;

    if (isTruth) {
      // Truth told: contestant advances automatically
      contestantWon = true;
      newLadderStep = Math.min(room.ladderStep + 1, LADDER_PRIZES.length - 1);
      reason = `¡El concursante dijo la VERDAD! La opción ${selected} era la respuesta correcta. Los panelistas que gritaron Bullshit quedaron en ridículo.`;

      // Reward believers with points
      for (const c of challengers) {
        if (c.vote === 'believe') {
          await this.updatePlayer(code, c.id, { score: (c.score || 0) + 500 });
        }
      }
    } else {
      // Contestant lied (BULLSHIT)!
      if (believers.length > 0) {
        // TRICKED AT LEAST ONE: Contestant triumphs!
        contestantWon = true;
        newLadderStep = Math.min(room.ladderStep + 1, LADDER_PRIZES.length - 1);
        reason = `¡ENGAÑO EXITOSO! La opción ${selected} era FALSA (Bullshit), pero ${believers.join(', ')} le creyó. El concursante se sale con la suya y sube en la escalera.`;

        // Reward the contestant with bonus points
        if (contestant) {
          await this.updatePlayer(code, contestant.id, { score: (contestant.score || 0) + 1000 });
        }
      } else {
        // UNANIMOUS BULLSHIT: ALL challengers called it! Contestant is busted!
        contestantWon = false;
        reason = `¡DESCUBIERTO POR UNANIMIDAD! Todo el panel gritó ¡BULLSHIT! La opción ${selected} era una mentira total. El concursante queda eliminado.`;

        // Find fastest challenger who voted bullshit to take the Hot Seat!
        const bullshitters = challengers.filter((c) => c.vote === 'bullshit');
        bullshitters.sort((a, b) => (a.voteTimestamp || 0) - (b.voteTimestamp || 0));

        const successor = bullshitters[0] || challengers[0];
        if (successor) {
          newContestantId = successor.id;
          newContestantName = successor.name;
          // Switch roles
          if (contestant) {
            await this.updatePlayer(code, contestant.id, { role: 'challenger' });
          }
          await this.updatePlayer(code, successor.id, { role: 'contestant', score: (successor.score || 0) + 1500 });
          // Reset ladder step or safe haven
          newLadderStep = room.ladderStep >= 6 ? 6 : room.ladderStep >= 3 ? 3 : 0;
        }
      }
    }

    const roundResult: RoundResult = {
      contestantId: room.activeContestantId || '',
      contestantName: contestant?.name || 'Concursante',
      selectedOption: selected,
      correctOption: currentQ.correctOption,
      wasLie,
      believers,
      doubters,
      contestantWon,
      reason,
      newLadderStep,
      newContestantId: newContestantId || undefined,
      newContestantName: newContestantName || undefined,
    };

    await this.updateRoom(code, {
      status: 'reveal',
      ladderStep: newLadderStep,
      activeContestantId: newContestantId,
      roundResult,
      timerActive: false,
    });
  }

  // ADVANCE TO NEXT QUESTION
  async nextRound(roomCode: string, room: Room, players: Player[]) {
    const code = roomCode.toUpperCase().trim();
    const questionsList = room.customQuestions && room.customQuestions.length > 0 ? room.customQuestions : TRIVIA_QUESTIONS;
    const nextQIndex = (room.currentQuestionIndex + 1) % questionsList.length;

    // Check if won the top prize ($1,000,000!)
    if (room.ladderStep >= LADDER_PRIZES.length - 1) {
      await this.updateRoom(code, {
        status: 'game_over',
        timerActive: false,
      });
      return;
    }

    await this.startQuestion(code, nextQIndex, players);
  }

  // ==========================================
  // QUESTION SETS MANAGEMENT (EXCEL TEMPLATES)
  // ==========================================

  // SAVE QUESTION SET
  async saveQuestionSet(name: string, questions: Question[]): Promise<QuestionSet> {
    const setId = `set_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const db = getFirestoreDB();

    const newSet: QuestionSet = {
      id: setId,
      name: name.trim(),
      createdAt: Date.now(),
      questionCount: questions.length,
      questions,
    };

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'questionSets', setId), newSet);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `questionSets/${setId}`);
      }
    } else {
      const store = getLocalStore();
      if (!store.questionSets) store.questionSets = {};
      store.questionSets[setId] = newSet;
      saveLocalStore(store);
      this.broadcastQuestionSetsChange();
    }

    return newSet;
  }

  // DELETE QUESTION SET
  async deleteQuestionSet(setId: string): Promise<void> {
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'questionSets', setId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `questionSets/${setId}`);
      }
    } else {
      const store = getLocalStore();
      if (store.questionSets && store.questionSets[setId]) {
        delete store.questionSets[setId];
        saveLocalStore(store);
        this.broadcastQuestionSetsChange();
      }
    }
  }

  // SUBSCRIBE TO QUESTION SETS (onSnapshot)
  subscribeQuestionSets(onUpdate: (sets: QuestionSet[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const db = getFirestoreDB();

    if (db && isFirebaseConfigured()) {
      const unsub = onSnapshot(
        collection(db, 'questionSets'),
        (snapshot) => {
          const list: QuestionSet[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as QuestionSet;
            list.push({ ...data, id: d.id });
          });
          list.sort((a, b) => b.createdAt - a.createdAt);
          onUpdate(list);
        },
        (error) => {
          if (onError) onError(error);
          else handleFirestoreError(error, OperationType.LIST, 'questionSets');
        }
      );
      return unsub;
    } else {
      this.activeQuestionSetsSubscribers.add(onUpdate);

      // Trigger immediate initial update
      const store = getLocalStore();
      const list = Object.values(store.questionSets || {}).sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(list);

      return () => {
        this.activeQuestionSetsSubscribers.delete(onUpdate);
      };
    }
  }

  // ASSIGN QUESTION SET TO A ROOM
  async setRoomQuestionSet(roomCode: string, questionSetName: string, questions: Question[] | null) {
    const code = roomCode.toUpperCase().trim();
    await this.updateRoom(code, {
      questionSetName,
      customQuestions: questions || undefined,
      currentQuestionIndex: 0,
    });
  }
}

export const gameService = new GameService();

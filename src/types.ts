export type RoomStatus =
  | 'lobby'
  | 'question_selection'
  | 'question_active'
  | 'defense_phase'
  | 'voting'
  | 'reveal'
  | 'game_over';

export type PlayerRole = 'contestant' | 'challenger';

export type VoteType = 'believe' | 'bullshit' | null;

export interface Player {
  id: string;
  name: string;
  avatar: string;
  avatarColor?: string;
  role: PlayerRole;
  vote: VoteType;
  voteTimestamp: number | null;
  isReady: boolean;
  score: number;
  isBot?: boolean;
}

export interface AvatarColorOption {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const PREDEFINED_AVATAR_ICONS = [
  '😎', '🦁', '🦊', '🦉', '👑', '🕵️‍♀️', '🤖', '🎭',
  '🎩', '⚡', '🍀', '🚀', '🔥', '🦄', '💎', '🎯',
  '🐉', '🍕', '🦈', '🧙‍♂️', '🏆', '👾', '🎲', '🧠'
] as const;

export const PREDEFINED_AVATAR_COLORS: AvatarColorOption[] = [
  { id: 'amber', name: 'Oro Estudio', hex: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-300', borderClass: 'border-amber-400', textClass: 'text-amber-400' },
  { id: 'red', name: 'Rojo Bullshit', hex: '#ef4444', bgClass: 'bg-red-500/20 text-red-300', borderClass: 'border-red-400', textClass: 'text-red-400' },
  { id: 'emerald', name: 'Verde Verdad', hex: '#10b981', bgClass: 'bg-emerald-500/20 text-emerald-300', borderClass: 'border-emerald-400', textClass: 'text-emerald-400' },
  { id: 'cyan', name: 'Cian Neón', hex: '#06b6d4', bgClass: 'bg-cyan-500/20 text-cyan-300', borderClass: 'border-cyan-400', textClass: 'text-cyan-400' },
  { id: 'purple', name: 'Púrpura Misterio', hex: '#a855f7', bgClass: 'bg-purple-500/20 text-purple-300', borderClass: 'border-purple-400', textClass: 'text-purple-400' },
  { id: 'rose', name: 'Rosa Vibrante', hex: '#f43f5e', bgClass: 'bg-rose-500/20 text-rose-300', borderClass: 'border-rose-400', textClass: 'text-rose-400' },
  { id: 'blue', name: 'Azul Real', hex: '#3b82f6', bgClass: 'bg-blue-500/20 text-blue-300', borderClass: 'border-blue-400', textClass: 'text-blue-400' },
  { id: 'orange', name: 'Naranja Fuego', hex: '#f97316', bgClass: 'bg-orange-500/20 text-orange-300', borderClass: 'border-orange-400', textClass: 'text-orange-400' },
];

export function getAvatarColorClasses(colorId?: string): AvatarColorOption {
  return PREDEFINED_AVATAR_COLORS.find((c) => c.id === colorId) || PREDEFINED_AVATAR_COLORS[0];
}

export interface Question {
  id: number;
  category: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  lieTrapHint?: string;
}

export interface RoundResult {
  contestantId: string;
  contestantName: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  correctOption: 'A' | 'B' | 'C' | 'D';
  wasLie: boolean;
  believers: string[];
  doubters: string[];
  contestantWon: boolean;
  reason: string;
  newLadderStep: number;
  newContestantId?: string;
  newContestantName?: string;
  eliminated?: boolean;
  takeHomeAmount?: string;
}

export interface Room {
  roomCode: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  activeContestantId: string | null;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  ladderStep: number;
  timerSeconds: number;
  timerActive: boolean;
  hostId: string;
  createdAt: number;
  roundResult?: RoundResult | null;
  questionSetName?: string;
  customQuestions?: Question[];
  locksRemaining?: number;
  lockedStep?: number;
  lockedAmount?: string;
  lockedSteps?: number[];
}

export interface QuestionSet {
  id: string;
  name: string;
  createdAt: number;
  questionCount: number;
  questions: Question[];
}

export interface LadderPrize {
  step: number;
  amount: string;
  isMilestone?: boolean;
}

export const LADDER_PRIZES: LadderPrize[] = [
  { step: 0, amount: '$0' },
  { step: 1, amount: '$1,000' },
  { step: 2, amount: '$5,000' },
  { step: 3, amount: '$10,000' },
  { step: 4, amount: '$25,000' },
  { step: 5, amount: '$50,000' },
  { step: 6, amount: '$100,000' },
  { step: 7, amount: '$250,000' },
  { step: 8, amount: '$500,000' },
  { step: 9, amount: '$1,000,000' },
];

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
  role: PlayerRole;
  vote: VoteType;
  voteTimestamp: number | null;
  isReady: boolean;
  score: number;
  isBot?: boolean;
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
  { step: 3, amount: '$10,000', isMilestone: true },
  { step: 4, amount: '$25,000' },
  { step: 5, amount: '$50,000' },
  { step: 6, amount: '$100,000', isMilestone: true },
  { step: 7, amount: '$250,000' },
  { step: 8, amount: '$500,000' },
  { step: 9, amount: '$1,000,000', isMilestone: true },
];

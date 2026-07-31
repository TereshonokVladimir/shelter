export declare const ALWAYS_HIDDEN_COUNT = 1;
export declare const TOTAL_VOLUNTARY_REVEALS = 7;
export type RevealStrategyId = 'classic' | 'slow' | 'custom';
export declare const REVEAL_STRATEGIES: Record<RevealStrategyId, {
    label: string;
    description: string;
}>;
export declare const REVEAL_QUOTA_BY_ROUND: Record<number, number>;
export declare function normalizeRevealStrategy(value: string | null | undefined): RevealStrategyId;
export declare function plannedVotingRounds(playerCount: number, shelterCapacity: number): number;
export declare function forceQuotaSum(quotas: number[], total: number): number[];
export declare function normalizeCustomRevealPlan(plan: number[] | null | undefined, rounds: number, total?: number): number[];
export declare function isValidCustomRevealPlan(plan: number[] | null | undefined, rounds: number, total?: number): boolean;
export declare function distributeRevealQuotas(rounds: number, strategy?: string | null, total?: number, customPlan?: number[] | null): number[];
export declare function revealQuotaForRound(round: number, strategy?: string | null, plannedRounds?: number | null, customPlan?: number[] | null): number;
export declare function eliminationsThisRound(input: {
    activeCount: number;
    shelterCapacity: number;
    currentRound?: number;
    strategy?: string | null;
}): number;
export declare function pickEliminations(tallies: Array<{
    player_id: string;
    votes: number;
}>, seats: number): {
    eliminateIds: string[];
    tieCandidateIds: string[] | null;
    seatsNeeded: number;
};
export declare const QUOTA_REVEAL_SOURCE: "player";
export declare function isQuotaRevealSource(source: string | null | undefined): boolean;
export declare const MIN_PRESENTATION_SEC = 60;
export declare const MAX_PRESENTATION_SEC = 180;
export declare const DEFAULT_PRESENTATION_SEC = 60;
export declare const MIN_VOTING_SEC = 30;
export declare const MAX_VOTING_SEC = 180;
export declare const DEFAULT_VOTING_SEC = 60;
export declare const MIN_REVEAL_SEC = 30;
export declare const MAX_REVEAL_SEC = 300;
export declare const DEFAULT_REVEAL_SEC = 90;
export declare const MIN_PREP_SEC = 0;
export declare const MAX_PREP_SEC = 180;
export declare const DEFAULT_PREP_SEC = 60;
export declare const DEFAULT_REVEAL_STRATEGY: RevealStrategyId;
export declare const VOTE_RESULT_AUTO_SEC = 12;

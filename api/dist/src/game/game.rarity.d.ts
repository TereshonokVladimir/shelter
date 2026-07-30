export type TraitRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export declare const TRAIT_RARITIES: TraitRarity[];
export declare const RARITY_DEAL_WEIGHT: Record<TraitRarity, number>;
export declare const RARITY_SCORE: Record<TraitRarity, number>;
export declare function normalizeRarity(value: string | null | undefined): TraitRarity;
export declare function rarityFromTitle(title: string): TraitRarity;
export declare function pickWeightedByRarity<T extends {
    rarity: string;
}>(pool: T[], count: number, random?: () => number): T[];
export interface PlayerFinishStat {
    player_id: string;
    name: string;
    status: 'active' | 'eliminated' | 'disconnected';
    survived: boolean;
    survival_chance: number;
    votes_against: number;
    rounds_lasted: number;
    rarity_power: number;
    rarity_counts: Record<TraitRarity, number>;
}
export declare function emptyRarityCounts(): Record<TraitRarity, number>;
export declare function computeSurvivalChance(input: {
    survived: boolean;
    votesAgainst: number;
    roundsLasted: number;
    rarityPower: number;
    maxRound: number;
}): number;

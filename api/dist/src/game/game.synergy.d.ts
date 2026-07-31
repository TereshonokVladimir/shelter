export type SynergyTag = 'medicine' | 'medkit' | 'engineering' | 'tools' | 'carpentry' | 'construction' | 'welding' | 'power' | 'electronics' | 'food' | 'farming' | 'seeds' | 'hunting' | 'fishing' | 'water' | 'filter' | 'radio' | 'navigation' | 'weapons' | 'defense' | 'fire' | 'cold' | 'shelter_gear' | 'radiation' | 'chem' | 'biology' | 'animals' | 'insects' | 'hygiene' | 'psychology' | 'morale' | 'money' | 'luxury' | 'bureaucracy' | 'darkness' | 'confined' | 'crowds' | 'height' | 'blood' | 'dirt' | 'smoke' | 'water_fear' | 'loud';
export type DisasterTheme = 'cold' | 'heat' | 'drought' | 'flood' | 'radiation' | 'plague' | 'spores' | 'power_loss' | 'emp' | 'famine' | 'predators' | 'raiders' | 'fire' | 'isolation' | 'surface_danger' | 'darkness' | 'toxic_air' | 'insects' | 'structural' | 'mental' | 'wilderness';
export interface SynergyPlayerInput {
    id: string;
    name: string;
    status: string;
    traits: Array<{
        category: string;
        title: string;
        description?: string | null;
    }>;
}
export interface PlayerSynergyBreakdown {
    player_id: string;
    theme_fit: number;
    synergy: number;
    conflict: number;
    notes: string[];
}
export interface CategoryContributionCell {
    player_id: string;
    name: string;
    survived: boolean;
    trait_title: string;
    delta: number;
}
export interface CategoryContributionColumn {
    category: string;
    team_total: number;
    verdict: string;
    entries: CategoryContributionCell[];
}
export type ReadinessCriterionId = 'food' | 'health' | 'water' | 'infra' | 'security' | 'morale';
export interface ReadinessCriterionDriver {
    player_id: string;
    name: string;
    trait_title: string;
    delta: number;
}
export interface ReadinessCriterion {
    id: ReadinessCriterionId;
    label: string;
    score: number;
    baseline: number;
    delta: number;
    verdict: string;
    drivers: ReadinessCriterionDriver[];
}
export interface BunkerSynergyReport {
    themes: DisasterTheme[];
    bunker_outlook: number;
    challenge_threshold: number;
    passed: boolean;
    bunker_verdict: string;
    highlights: string[];
    categories: CategoryContributionColumn[];
    criteria: ReadinessCriterion[];
    players: PlayerSynergyBreakdown[];
}
export declare function extractTags(text: string): SynergyTag[];
export declare function extractThemes(text: string): DisasterTheme[];
export declare function evaluateBunkerSynergy(input: {
    disasterTitle: string;
    disasterDescription: string;
    bunkerTitle?: string | null;
    bunkerDescription?: string | null;
    players: SynergyPlayerInput[];
}): BunkerSynergyReport;
export declare function challengeThreshold(themes: DisasterTheme[]): number;
export declare function bunkerVerdict(input: {
    outlook: number;
    threshold: number;
    passed: boolean;
}): string;
export declare function computeThematicSurvivalChance(input: {
    survived: boolean;
    themeFit: number;
    synergy: number;
    conflict: number;
}): number;

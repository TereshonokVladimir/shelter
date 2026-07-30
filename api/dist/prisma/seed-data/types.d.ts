export type Category = 'profession' | 'biology' | 'health' | 'hobby' | 'phobia' | 'baggage' | 'personality' | 'fact';
export type CharItem = string | readonly [string, string];
export type NamedDesc = readonly [string, string];
export type ActionEffectType = 'swap_characteristic' | 'reroll_characteristic' | 'force_reveal';
export type ActionSeed = {
    effectType: ActionEffectType;
    title: string;
    description: string;
};
export type PackSeed = {
    slug: string;
    title: string;
    description: string;
    rating: 'everyone' | 'teen' | 'mature' | 'explicit';
    topic: string;
    sortOrder: number;
    disasters: NamedDesc[];
    bunkers: NamedDesc[];
    characteristics: Record<Category, CharItem[]>;
    actions?: ActionSeed[];
};

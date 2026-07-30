"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RARITY_SCORE = exports.RARITY_DEAL_WEIGHT = exports.TRAIT_RARITIES = void 0;
exports.normalizeRarity = normalizeRarity;
exports.rarityFromTitle = rarityFromTitle;
exports.pickWeightedByRarity = pickWeightedByRarity;
exports.emptyRarityCounts = emptyRarityCounts;
exports.computeSurvivalChance = computeSurvivalChance;
exports.TRAIT_RARITIES = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic',
];
exports.RARITY_DEAL_WEIGHT = {
    common: 48,
    uncommon: 26,
    rare: 14,
    epic: 7,
    legendary: 3.5,
    mythic: 1.5,
};
exports.RARITY_SCORE = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 6,
    legendary: 8,
    mythic: 11,
};
function normalizeRarity(value) {
    if (value === 'unique')
        return 'mythic';
    if (value === 'uncommon' ||
        value === 'rare' ||
        value === 'epic' ||
        value === 'legendary' ||
        value === 'mythic') {
        return value;
    }
    return 'common';
}
function rarityFromTitle(title) {
    let hash = 0;
    for (let i = 0; i < title.length; i += 1) {
        hash = (hash * 33 + title.charCodeAt(i)) >>> 0;
    }
    const roll = hash % 1000;
    if (roll < 12)
        return 'mythic';
    if (roll < 42)
        return 'legendary';
    if (roll < 100)
        return 'epic';
    if (roll < 220)
        return 'rare';
    if (roll < 480)
        return 'uncommon';
    return 'common';
}
function pickWeightedByRarity(pool, count, random = Math.random) {
    const available = [...pool];
    const picked = [];
    const n = Math.min(count, available.length);
    for (let i = 0; i < n; i += 1) {
        const total = available.reduce((sum, item) => {
            return sum + (exports.RARITY_DEAL_WEIGHT[normalizeRarity(item.rarity)] ?? 1);
        }, 0);
        let cursor = random() * total;
        let index = available.length - 1;
        for (let j = 0; j < available.length; j += 1) {
            cursor -= exports.RARITY_DEAL_WEIGHT[normalizeRarity(available[j].rarity)] ?? 1;
            if (cursor <= 0) {
                index = j;
                break;
            }
        }
        picked.push(available.splice(index, 1)[0]);
    }
    return picked;
}
function emptyRarityCounts() {
    return {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0,
    };
}
function computeSurvivalChance(input) {
    const roundFactor = input.maxRound > 0 ? input.roundsLasted / input.maxRound : 0;
    let score = 28 +
        roundFactor * 32 +
        (input.survived ? 22 : 0) -
        input.votesAgainst * 11 +
        Math.min(18, input.rarityPower * 0.7);
    if (!input.survived)
        score -= 8;
    return Math.max(3, Math.min(97, Math.round(score)));
}
//# sourceMappingURL=game.rarity.js.map
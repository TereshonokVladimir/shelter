"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOTE_RESULT_AUTO_SEC = exports.DEFAULT_REVEAL_STRATEGY = exports.DEFAULT_PREP_SEC = exports.MAX_PREP_SEC = exports.MIN_PREP_SEC = exports.DEFAULT_REVEAL_SEC = exports.MAX_REVEAL_SEC = exports.MIN_REVEAL_SEC = exports.DEFAULT_VOTING_SEC = exports.MAX_VOTING_SEC = exports.MIN_VOTING_SEC = exports.DEFAULT_PRESENTATION_SEC = exports.MAX_PRESENTATION_SEC = exports.MIN_PRESENTATION_SEC = exports.QUOTA_REVEAL_SOURCE = exports.REVEAL_QUOTA_BY_ROUND = exports.REVEAL_STRATEGIES = exports.TOTAL_VOLUNTARY_REVEALS = exports.ALWAYS_HIDDEN_COUNT = void 0;
exports.normalizeRevealStrategy = normalizeRevealStrategy;
exports.plannedVotingRounds = plannedVotingRounds;
exports.distributeRevealQuotas = distributeRevealQuotas;
exports.revealQuotaForRound = revealQuotaForRound;
exports.eliminationsThisRound = eliminationsThisRound;
exports.pickEliminations = pickEliminations;
exports.isQuotaRevealSource = isQuotaRevealSource;
exports.ALWAYS_HIDDEN_COUNT = 1;
exports.TOTAL_VOLUNTARY_REVEALS = 7;
exports.REVEAL_STRATEGIES = {
    classic: {
        label: 'Классика',
        description: 'Ровно по раундам',
    },
    slow: {
        label: 'Ровная',
        description: 'Плоские квоты',
    },
    sprint: {
        label: 'Фронт',
        description: 'Больше в начале',
    },
};
exports.REVEAL_QUOTA_BY_ROUND = {
    1: 3,
    2: 2,
    3: 2,
};
function normalizeRevealStrategy(value) {
    if (value === 'slow' || value === 'sprint' || value === 'classic')
        return value;
    return 'classic';
}
function plannedVotingRounds(playerCount, shelterCapacity) {
    return Math.max(1, playerCount - shelterCapacity);
}
function evenDistribute(total, rounds) {
    if (rounds <= 0)
        return [];
    if (total <= 0)
        return Array.from({ length: rounds }, () => 0);
    if (total < rounds) {
        return Array.from({ length: rounds }, (_, i) => (i < total ? 1 : 0));
    }
    const quotas = Array.from({ length: rounds }, () => 1);
    let extra = total - rounds;
    let i = 0;
    while (extra > 0) {
        quotas[i % rounds] += 1;
        i += 1;
        extra -= 1;
    }
    return quotas;
}
function distributeRevealQuotas(rounds, strategy, total = exports.TOTAL_VOLUNTARY_REVEALS) {
    const id = normalizeRevealStrategy(strategy);
    if (rounds <= 0)
        return [];
    if (rounds === 1)
        return [Math.max(0, total)];
    if (id === 'slow') {
        return evenDistribute(total, rounds);
    }
    if (id === 'classic') {
        const quotas = evenDistribute(total, rounds);
        for (let i = quotas.length - 1; i > 0; i -= 1) {
            if (quotas[i] > 1) {
                quotas[i] -= 1;
                quotas[0] += 1;
                break;
            }
        }
        return quotas;
    }
    if (total <= 0)
        return Array.from({ length: rounds }, () => 0);
    if (total < rounds) {
        return Array.from({ length: rounds }, (_, i) => (i < total ? 1 : 0));
    }
    const quotas = Array.from({ length: rounds }, () => 1);
    let extra = total - rounds;
    let i = 0;
    while (extra > 0) {
        quotas[i] += 1;
        extra -= 1;
        if (i + 1 < rounds && quotas[i] > quotas[i + 1] + 1) {
            i += 1;
        }
        else {
            i = 0;
        }
    }
    return quotas;
}
function revealQuotaForRound(round, strategy, plannedRounds) {
    if (round < 1)
        return 0;
    const rounds = plannedRounds && plannedRounds > 0
        ? plannedRounds
        :
            evenDistribute(exports.TOTAL_VOLUNTARY_REVEALS, 3).length;
    const quotas = distributeRevealQuotas(rounds, strategy);
    return quotas[round - 1] ?? 0;
}
function eliminationsThisRound(input) {
    const remaining = input.activeCount - input.shelterCapacity;
    if (remaining <= 0)
        return 0;
    return 1;
}
function pickEliminations(tallies, seats) {
    if (seats <= 0) {
        return { eliminateIds: [], tieCandidateIds: null, seatsNeeded: 0 };
    }
    const sorted = [...tallies].sort((a, b) => b.votes - a.votes || a.player_id.localeCompare(b.player_id));
    const eliminateIds = [];
    let i = 0;
    while (eliminateIds.length < seats && i < sorted.length) {
        const bandVotes = sorted[i].votes;
        const band = [];
        while (i < sorted.length && sorted[i].votes === bandVotes) {
            band.push(sorted[i].player_id);
            i += 1;
        }
        const need = seats - eliminateIds.length;
        if (band.length <= need) {
            eliminateIds.push(...band);
        }
        else {
            return {
                eliminateIds,
                tieCandidateIds: band,
                seatsNeeded: need,
            };
        }
    }
    return { eliminateIds, tieCandidateIds: null, seatsNeeded: 0 };
}
exports.QUOTA_REVEAL_SOURCE = 'player';
function isQuotaRevealSource(source) {
    return !source || source === exports.QUOTA_REVEAL_SOURCE;
}
exports.MIN_PRESENTATION_SEC = 60;
exports.MAX_PRESENTATION_SEC = 180;
exports.DEFAULT_PRESENTATION_SEC = 60;
exports.MIN_VOTING_SEC = 30;
exports.MAX_VOTING_SEC = 180;
exports.DEFAULT_VOTING_SEC = 60;
exports.MIN_REVEAL_SEC = 30;
exports.MAX_REVEAL_SEC = 300;
exports.DEFAULT_REVEAL_SEC = 90;
exports.MIN_PREP_SEC = 0;
exports.MAX_PREP_SEC = 180;
exports.DEFAULT_PREP_SEC = 60;
exports.DEFAULT_REVEAL_STRATEGY = 'classic';
exports.VOTE_RESULT_AUTO_SEC = 12;
//# sourceMappingURL=game.rules.js.map
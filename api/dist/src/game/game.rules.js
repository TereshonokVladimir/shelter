"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOTE_RESULT_AUTO_SEC = exports.DEFAULT_REVEAL_SEC = exports.MAX_REVEAL_SEC = exports.MIN_REVEAL_SEC = exports.DEFAULT_VOTING_SEC = exports.MAX_VOTING_SEC = exports.MIN_VOTING_SEC = exports.DEFAULT_PRESENTATION_SEC = exports.MAX_PRESENTATION_SEC = exports.MIN_PRESENTATION_SEC = exports.ALWAYS_HIDDEN_COUNT = exports.REVEAL_QUOTA_BY_ROUND = void 0;
exports.revealQuotaForRound = revealQuotaForRound;
exports.REVEAL_QUOTA_BY_ROUND = {
    1: 3,
    2: 2,
    3: 2,
};
exports.ALWAYS_HIDDEN_COUNT = 1;
function revealQuotaForRound(round) {
    return exports.REVEAL_QUOTA_BY_ROUND[round] ?? 0;
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
exports.VOTE_RESULT_AUTO_SEC = 12;
//# sourceMappingURL=game.rules.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_BOT_NAMES = exports.BOT_NAME_PREFIX = void 0;
exports.isMockBotsEnabled = isMockBotsEnabled;
exports.isBotPlayerName = isBotPlayerName;
function isMockBotsEnabled() {
    const raw = process.env.ENABLE_MOCK_BOTS;
    if (raw === '0' || raw === 'false' || raw === 'off')
        return false;
    if (raw === '1' || raw === 'true' || raw === 'on')
        return true;
    return process.env.NODE_ENV !== 'production';
}
exports.BOT_NAME_PREFIX = 'Бот ';
function isBotPlayerName(name) {
    return name.startsWith(exports.BOT_NAME_PREFIX);
}
exports.MOCK_BOT_NAMES = [
    'Бот Алекс',
    'Бот Марина',
    'Бот Игорь',
    'Бот Лена',
    'Бот Кирилл',
    'Бот Оля',
    'Бот Дима',
    'Бот Настя',
    'Бот Сергей',
    'Бот Катя',
    'Бот Паша',
];
//# sourceMappingURL=mock-bots.config.js.map
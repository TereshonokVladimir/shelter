"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ACTIONS = void 0;
exports.DEFAULT_ACTIONS = [
    {
        effectType: 'swap_characteristic',
        title: 'Обмен',
        description: 'Выберите категорию и игрока: вы меняетесь характеристиками этой категории. Статус раскрытия переходит вместе с картой.',
    },
    {
        effectType: 'reroll_characteristic',
        title: 'Пересдача',
        description: 'Замените одну свою характеристику на случайную неиспользованную из колоды той же категории.',
    },
    {
        effectType: 'force_reveal',
        title: 'Принудительное раскрытие',
        description: 'Выберите игрока — одна его скрытая характеристика откроется для всех (не тратит его квоту раунда).',
    },
];
//# sourceMappingURL=actions.js.map
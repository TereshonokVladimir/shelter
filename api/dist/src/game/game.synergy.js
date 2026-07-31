"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTags = extractTags;
exports.extractThemes = extractThemes;
exports.evaluateBunkerSynergy = evaluateBunkerSynergy;
exports.challengeThreshold = challengeThreshold;
exports.bunkerVerdict = bunkerVerdict;
exports.computeThematicSurvivalChance = computeThematicSurvivalChance;
const TAG_KEYWORDS = [
    ['medkit', ['аптеч', 'антибиот', 'инсулин', 'ингалятор', 'шины и бинт', 'медицинских инструмент']],
    [
        'medicine',
        [
            'хирург',
            'медсестр',
            'санитар',
            'фармац',
            'анестезиолог',
            'стоматолог',
            'токсиколог',
            'врач',
            'фельдшер',
        ],
    ],
    ['carpentry', ['плотник', 'столяр']],
    ['welding', ['сварщик', 'свароч']],
    ['construction', ['строител', 'каменщик', 'архитектор', 'кровельщик', 'укрепл']],
    [
        'engineering',
        [
            'инженер',
            'механик',
            'электрик',
            'слесарь',
            'сантехник',
            'токарь',
            'радиотехник',
            'системный админ',
        ],
    ],
    [
        'tools',
        [
            'отвёрт',
            'мультитул',
            'инструмент',
            'молоток',
            'гвозд',
            'пила',
            'топор',
            'лопата',
            'кирка',
            'паяльник',
            'мультиметр',
            'набор ключ',
        ],
    ],
    ['power', ['генератор', 'солнечн', 'динамо', 'аккумулятор', 'дизел', 'бензин', 'энергет']],
    ['electronics', ['программист', 'контроллер', 'электрон', 'сеть', 'бэкап']],
    ['farming', ['агроном', 'садовник', 'теплиц', 'урожай', 'выращив', 'миколог', 'энтомолог']],
    ['seeds', ['семян', 'семена', 'саженц', 'удобрен', 'компост', 'лампы роста']],
    ['food', ['повар', 'консерв', 'тушён', 'рис ', 'гречк', 'мука', 'сублим', 'диетолог', 'продоволь']],
    ['hunting', ['охотник', 'охотнич']],
    ['fishing', ['рыбак', 'леск', 'крючк']],
    ['filter', ['фильтр', 'опреснит', 'очистки воды', 'респиратор', 'масок']],
    ['water', ['гидролог', 'геолог', 'скважин', 'насос', 'пресн']],
    ['radio', ['радист', 'рация', 'радио', 'передат']],
    ['navigation', ['картограф', 'компас', 'навигац', 'пилот', 'секстант', 'бинокль', 'карт местности']],
    [
        'weapons',
        [
            'оруж',
            'револьвер',
            'пистолет',
            'винтовк',
            'ружь',
            'патрон',
            'арбалет',
            'охотничий нож',
            'ракетниц',
            'баллончик перца',
            'солдат',
            'боеприпас',
        ],
    ],
    ['defense', ['охранник', 'периметр', 'дежурств', 'собака-охран', 'наручник']],
    ['fire', ['пожар', 'спичк', 'зажигал', 'огниво', 'свеч', 'маслян', 'сухой спирт']],
    ['cold', ['мороз', 'тёплый', 'спальный мешок', 'антифриз']],
    ['shelter_gear', ['палатк', 'канат', 'карабин', 'герметик', 'уплотнител']],
    ['radiation', ['дозиметр', 'гейгер', 'радиац', 'свинц']],
    ['chem', ['химик', 'химикат', 'реактив']],
    ['biology', ['биолог', 'спор', 'заражен', 'патоген']],
    ['animals', ['ветеринар', 'собак', 'кот —', 'куриц', 'кролик', 'улей', 'скот']],
    ['insects', ['насеком', 'саранч', 'паук', 'крыс']],
    ['hygiene', ['уборщик', 'мыло', 'гигиен', 'туалетная', 'мешки для мусор']],
    ['psychology', ['психолог', 'священник']],
    ['morale', ['музыкант', 'актёр', 'гитар', 'анекдот', 'шоколад', 'кофе', 'шахмат', 'настольн']],
    [
        'money',
        [
            'деньг',
            'золот',
            'валют',
            'налич',
            'банкнот',
            'крипто',
            'кассир',
            'бухгалтер',
            'сейф',
            'сигарет',
            'коньяк',
            'золотые зуб',
        ],
    ],
    ['luxury', ['ювелир', 'духи', 'коллекц']],
    ['bureaucracy', ['юрист', 'диспетчер', 'логист', 'договор']],
    ['darkness', ['фонар', 'ламп']],
    ['confined', ['люк']],
    ['blood', ['крови']],
    ['dirt', ['гряз']],
    ['smoke', ['дым']],
];
const THEME_KEYWORDS = [
    ['cold', ['зим', 'мороз', 'лед', 'холод', 'снег', 'наст']],
    ['heat', ['жар', 'пустын', 'иссуш']],
    ['drought', ['засух', 'иссушен', 'пресная вода', 'каждая капля', 'скважин']],
    ['flood', ['цунами', 'затоплен', 'прилив', 'волна', 'океан', 'наводнен', 'остров']],
    ['radiation', ['радиац', 'аэс', 'фоновая']],
    ['plague', ['пандеми', 'патоген', 'чума', 'эпидеми', 'бешенств', 'инфек', 'вирус', 'зомби']],
    ['spores', ['спор', 'гриб', 'плесен', 'мицел']],
    ['power_loss', ['электро', 'генератор', 'обесточ', 'энерг', 'трансформатор']],
    ['emp', ['магнитн', 'солнечн вспыш', 'электрон', 'корональн']],
    ['famine', ['голод', 'неурожай', 'продоволь', 'урожай', 'белок']],
    ['predators', ['хищник', 'волк', 'существ', 'звер']],
    ['raiders', ['мародёр', 'бунт', 'штурм', 'война', 'кланы', 'дронов']],
    ['fire', ['пожар', 'огонь', 'молни']],
    ['isolation', ['необитаем', 'изоляц', 'без ориентир']],
    ['surface_danger', ['поверхност', 'вылазк', 'снаруж']],
    ['darkness', ['темнот', 'ноч', 'видимость', 'туман', 'смог']],
    ['toxic_air', ['отрав', 'кислот', 'химическ', 'ядовит', 'кислород', 'респиратор']],
    ['insects', ['саранч', 'насеком', 'крыс', 'паразит']],
    ['structural', ['обвал', 'бетон', 'фундамент', 'ремонт', 'шахт']],
    ['mental', ['психоген', 'галлюцин', 'паник', 'гипнот', 'депресс']],
    ['wilderness', ['остров', 'пустын', 'степ', 'джунгл']],
];
const THEME_TAG_WEIGHT = {
    cold: { cold: 3, fire: 2, power: 2, shelter_gear: 2, food: 1, money: -2, luxury: -2 },
    heat: { water: 3, filter: 2, shelter_gear: 1, cold: -1, money: -1 },
    drought: { water: 3, filter: 3, farming: 1, money: -2, luxury: -2 },
    flood: { navigation: 2, fishing: 2, construction: 2, electronics: -1, money: -2 },
    radiation: { radiation: 3, medicine: 2, medkit: 2, filter: 2, shelter_gear: 1, hunting: -1 },
    plague: { medicine: 3, medkit: 3, hygiene: 2, biology: 2, filter: 2, animals: -1 },
    spores: { biology: 3, filter: 3, hygiene: 2, medicine: 2, farming: -1 },
    power_loss: { power: 3, engineering: 3, tools: 2, electronics: 1, fire: 1, money: -1 },
    emp: { engineering: 2, tools: 2, radio: 1, electronics: -2, money: -1 },
    famine: {
        food: 3,
        farming: 3,
        seeds: 3,
        hunting: 2,
        fishing: 2,
        money: -3,
        luxury: -2,
        bureaucracy: -1,
    },
    predators: { weapons: 3, defense: 2, hunting: 2, animals: 1, psychology: 1 },
    raiders: { weapons: 3, defense: 3, psychology: 1 },
    fire: { construction: 2, water: 2, shelter_gear: 1, fire: -1 },
    isolation: {
        navigation: 2,
        tools: 2,
        medicine: 1,
        food: 2,
        radio: 2,
        money: -3,
        luxury: -3,
        bureaucracy: -2,
    },
    wilderness: {
        hunting: 2,
        fishing: 2,
        tools: 2,
        navigation: 2,
        shelter_gear: 2,
        money: -3,
        luxury: -3,
        bureaucracy: -2,
    },
    surface_danger: { navigation: 2, defense: 1, weapons: 1, shelter_gear: 1, medicine: 1 },
    darkness: { darkness: 2, navigation: 1, psychology: 1 },
    toxic_air: { filter: 3, chem: 2, biology: 1, medicine: 1 },
    insects: { insects: 2, hygiene: 2, biology: 1, farming: 1 },
    structural: { construction: 3, carpentry: 2, engineering: 2, tools: 2, welding: 2 },
    mental: { psychology: 3, morale: 2, medicine: 1, money: -1 },
};
const SYNERGY_RULES = [
    { need: 'carpentry', provide: 'tools', bonus: 14, label: 'Плотник + инструменты' },
    { need: 'construction', provide: 'tools', bonus: 12, label: 'Строитель + инструменты' },
    { need: 'welding', provide: 'tools', bonus: 12, label: 'Сварщик + инструменты' },
    { need: 'engineering', provide: 'tools', bonus: 10, label: 'Инженер + инструменты' },
    { need: 'engineering', provide: 'power', bonus: 12, label: 'Технарь + источник энергии' },
    { need: 'medicine', provide: 'medkit', bonus: 14, label: 'Медик + аптечка/препараты' },
    { need: 'farming', provide: 'seeds', bonus: 14, label: 'Агронавык + семена/рост' },
    { need: 'farming', provide: 'water', bonus: 8, label: 'Выращивание + вода' },
    { need: 'food', provide: 'farming', bonus: 8, label: 'Повар + производство еды' },
    { need: 'hunting', provide: 'weapons', bonus: 10, label: 'Охотник + оружие' },
    { need: 'fishing', provide: 'tools', bonus: 6, label: 'Рыбак + снасти/инструменты' },
    { need: 'water', provide: 'filter', bonus: 12, label: 'Вода + фильтрация' },
    { need: 'radio', provide: 'electronics', bonus: 8, label: 'Связь + электроника' },
    { need: 'radio', provide: 'power', bonus: 8, label: 'Связь + питание' },
    { need: 'defense', provide: 'weapons', bonus: 10, label: 'Охрана + оружие' },
    { need: 'psychology', provide: 'morale', bonus: 8, label: 'Психолог + мораль' },
    { need: 'biology', provide: 'filter', bonus: 8, label: 'Биолог + защита дыхания' },
    { need: 'radiation', provide: 'medicine', bonus: 8, label: 'Радконтроль + медицина' },
];
const CONFLICT_RULES = [
    {
        fear: 'weapons',
        trigger: 'weapons',
        penalty: 16,
        label: 'Фобия оружия рядом с оружием в бункере',
    },
    {
        fear: 'fire',
        trigger: 'fire',
        penalty: 12,
        label: 'Фобия огня рядом с источниками огня',
        themeTriggers: ['fire'],
    },
    {
        fear: 'animals',
        trigger: 'animals',
        penalty: 12,
        label: 'Фобия животных рядом с живностью',
    },
    {
        fear: 'insects',
        trigger: 'insects',
        penalty: 10,
        label: 'Фобия насекомых / вредителей в группе',
        themeTriggers: ['insects'],
    },
    { fear: 'blood', trigger: 'medicine', penalty: 10, label: 'Фобия крови рядом с медициной' },
    { fear: 'blood', trigger: 'medkit', penalty: 8, label: 'Фобия крови рядом с медснаряжением' },
    {
        fear: 'darkness',
        trigger: 'darkness',
        penalty: 6,
        label: 'Фобия темноты в тёмной обстановке',
        themeTriggers: ['darkness'],
    },
    {
        fear: 'confined',
        trigger: 'confined',
        penalty: 8,
        label: 'Клаустрофобия в тесном убежище',
        themeTriggers: ['structural'],
    },
    { fear: 'smoke', trigger: 'fire', penalty: 8, label: 'Фобия дыма / искр рядом с огнём' },
    { fear: 'loud', trigger: 'weapons', penalty: 6, label: 'Фобия громкого рядом с оружием' },
    { fear: 'dirt', trigger: 'farming', penalty: 4, label: 'Фобия грязи рядом с агроработами' },
    {
        fear: 'water_fear',
        trigger: 'water',
        penalty: 8,
        label: 'Фобия воды рядом с водными задачами',
        themeTriggers: ['flood', 'drought'],
    },
];
const PHOBIA_FEAR_KEYWORDS = [
    ['weapons', ['оруж', 'остр', 'нож', 'выстрел', 'пистолет']],
    ['fire', ['огня', 'огн', 'искр', 'гроз']],
    ['animals', ['животн', 'собак', 'кош', 'змей', 'птиц', 'крыс']],
    ['insects', ['насеком', 'паук', 'черв', 'пчёл']],
    ['blood', ['крови', 'кровь']],
    ['darkness', ['темнот', 'тьмы']],
    ['confined', ['замкнут', 'тесных', 'люк', 'лифт']],
    ['crowds', ['толп', 'очеред', 'заполнен']],
    ['height', ['высот', 'лестниц']],
    ['dirt', ['гряз', 'пыл', 'плесен', 'сырост']],
    ['smoke', ['дым', 'озон', 'бензин', 'химическ']],
    ['water_fear', ['воды', 'глубок', 'луж', 'капающ']],
    ['loud', ['громк', 'сирен', 'эха', 'скрежет']],
    ['medicine', ['врач', 'больниц', 'укол', 'халат', 'масок', 'перчат']],
];
function normalizeText(value) {
    return value.toLowerCase().split('ё').join('е');
}
function extractTags(text) {
    const hay = normalizeText(text);
    const found = new Set();
    for (const [tag, words] of TAG_KEYWORDS) {
        if (words.some((w) => hay.includes(normalizeText(w))))
            found.add(tag);
    }
    return [...found];
}
function extractThemes(text) {
    const hay = normalizeText(text);
    const found = new Set();
    for (const [theme, words] of THEME_KEYWORDS) {
        if (words.some((w) => hay.includes(normalizeText(w))))
            found.add(theme);
    }
    if (found.size === 0)
        found.add('surface_danger');
    return [...found];
}
function extractFears(title, description) {
    const hay = normalizeText(`${title} ${description}`);
    const found = new Set();
    for (const [tag, words] of PHOBIA_FEAR_KEYWORDS) {
        if (words.some((w) => hay.includes(normalizeText(w))))
            found.add(tag);
    }
    return [...found];
}
function tagTrait(trait) {
    const description = trait.description ?? '';
    const blob = `${trait.title} ${description}`;
    return {
        category: trait.category,
        title: trait.title,
        description,
        tags: extractTags(blob),
        fears: trait.category === 'phobia' ? extractFears(trait.title, description) : [],
    };
}
function playerHasTag(traits, tag) {
    return traits.some((t) => t.category !== 'phobia' && t.tags.includes(tag));
}
function playerFears(traits, tag) {
    return traits.some((t) => t.category === 'phobia' && t.fears.includes(tag));
}
function themeFitForTags(tags, themes) {
    let score = 0;
    const seen = new Set();
    for (const theme of themes) {
        const weights = THEME_TAG_WEIGHT[theme];
        if (!weights)
            continue;
        for (const tag of tags) {
            const w = weights[tag];
            if (w === undefined)
                continue;
            const key = `${theme}:${tag}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            score += w;
        }
    }
    return Math.max(-22, Math.min(26, Math.round(score * 1.4)));
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function evaluateBunkerSynergy(input) {
    const themeText = [
        input.disasterTitle,
        input.disasterDescription,
        input.bunkerTitle ?? '',
        input.bunkerDescription ?? '',
    ].join(' ');
    const themes = extractThemes(themeText);
    const hands = input.players.map((p) => ({
        ...p,
        tagged: p.traits.map(tagTrait),
    }));
    const breakdowns = hands.map((p) => {
        const usefulTags = p.tagged.filter((t) => t.category !== 'phobia').flatMap((t) => t.tags);
        return {
            player_id: p.id,
            theme_fit: themeFitForTags(usefulTags, themes),
            synergy: 0,
            conflict: 0,
            notes: [],
        };
    });
    const byId = new Map(breakdowns.map((b) => [b.player_id, b]));
    const highlights = [];
    for (const rule of SYNERGY_RULES) {
        const needPlayers = hands.filter((p) => playerHasTag(p.tagged, rule.need));
        const providePlayers = hands.filter((p) => playerHasTag(p.tagged, rule.provide));
        if (needPlayers.length === 0 || providePlayers.length === 0)
            continue;
        let appliedHighlight = false;
        for (const needP of needPlayers) {
            const partner = providePlayers.find((p) => p.id !== needP.id) ??
                providePlayers.find((p) => p.id === needP.id);
            if (!partner)
                continue;
            const self = partner.id === needP.id;
            const needStat = byId.get(needP.id);
            const provideStat = byId.get(partner.id);
            const share = self ? Math.round(rule.bonus * 0.55) : Math.round(rule.bonus * 0.55);
            needStat.synergy += share;
            if (!self)
                provideStat.synergy += share;
            const note = self
                ? `${rule.label} (у вас)`
                : `${rule.label}: ${needP.name} ↔ ${partner.name}`;
            if (!needStat.notes.includes(note))
                needStat.notes.push(note);
            if (!self && !provideStat.notes.includes(note))
                provideStat.notes.push(note);
            if (!appliedHighlight) {
                highlights.push(note);
                appliedHighlight = true;
            }
        }
    }
    for (const rule of CONFLICT_RULES) {
        const afraid = hands.filter((p) => playerFears(p.tagged, rule.fear));
        if (afraid.length === 0)
            continue;
        const triggers = hands.filter((p) => playerHasTag(p.tagged, rule.trigger));
        const themeHit = (rule.themeTriggers ?? []).some((t) => themes.includes(t));
        if (triggers.length === 0 && !themeHit)
            continue;
        for (const victim of afraid) {
            const triggerOthers = triggers.filter((t) => t.id !== victim.id);
            const note = triggerOthers.length > 0
                ? `${rule.label} (${triggerOthers
                    .slice(0, 2)
                    .map((t) => t.name)
                    .join(', ')})`
                : `${rule.label} (обстановка)`;
            const stat = byId.get(victim.id);
            stat.conflict += rule.penalty;
            if (!stat.notes.includes(note))
                stat.notes.push(note);
            for (const t of triggerOthers) {
                const ts = byId.get(t.id);
                ts.conflict += Math.round(rule.penalty * 0.35);
                const shared = `Напряжение в бункере: ${rule.label}`;
                if (!ts.notes.includes(shared))
                    ts.notes.push(shared);
            }
            if (!highlights.includes(note))
                highlights.push(note);
        }
    }
    for (const b of breakdowns) {
        b.synergy = clamp(b.synergy, 0, 24);
        b.conflict = clamp(b.conflict, 0, 28);
        if (b.theme_fit <= -8) {
            const tip = 'Слабая польза характеристик в этой катастрофе';
            if (!b.notes.includes(tip))
                b.notes.unshift(tip);
        }
        else if (b.theme_fit >= 12) {
            const tip = 'Сильное совпадение с условиями катастрофы';
            if (!b.notes.includes(tip))
                b.notes.unshift(tip);
        }
        b.notes = b.notes.slice(0, 4);
    }
    const survivorIds = new Set(input.players.filter((p) => p.status === 'active').map((p) => p.id));
    const challenge_threshold = challengeThreshold(themes);
    const criteria = buildReadinessCriteria({
        themes,
        hands,
        survivorIds,
        threshold: challenge_threshold,
    });
    const bunker_outlook = clamp(Math.round(criteria.reduce((s, c) => s + c.score, 0) / Math.max(1, criteria.length)), 5, 95);
    const passed = bunker_outlook >= challenge_threshold;
    const categories = buildCategoryContributionReport({
        themes,
        hands,
        survivorIds,
    });
    return {
        themes,
        bunker_outlook,
        challenge_threshold,
        passed,
        bunker_verdict: bunkerVerdict({
            outlook: bunker_outlook,
            threshold: challenge_threshold,
            passed,
        }),
        highlights: highlights.slice(0, 6),
        categories,
        criteria,
        players: breakdowns,
    };
}
function challengeThreshold(themes) {
    const weight = {
        plague: 9,
        radiation: 8,
        famine: 8,
        toxic_air: 7,
        emp: 7,
        spores: 7,
        predators: 6,
        raiders: 6,
        cold: 5,
        drought: 5,
        flood: 5,
        power_loss: 5,
        fire: 5,
        wilderness: 6,
        isolation: 5,
        structural: 4,
        mental: 5,
        darkness: 3,
        heat: 4,
        insects: 4,
        surface_danger: 3,
    };
    if (themes.length === 0)
        return 50;
    const avg = themes.reduce((sum, t) => sum + (weight[t] ?? 3), 0) / themes.length;
    return clamp(Math.round(28 + avg * 5.5), 40, 78);
}
function bunkerVerdict(input) {
    if (input.passed) {
        return 'Состав закрыл порог катастрофы — сценарий пройден.';
    }
    return 'Состава не хватило до порога катастрофы.';
}
const CRITERION_META = [
    {
        id: 'food',
        label: 'Продовольствие',
        tags: { food: 7, farming: 8, seeds: 5, hunting: 6, fishing: 5 },
        categories: { profession: 0 },
    },
    {
        id: 'health',
        label: 'Здоровье',
        tags: { medicine: 8, medkit: 7, hygiene: 5, biology: 4, chem: 3 },
        categories: { health: 2 },
    },
    {
        id: 'water',
        label: 'Водоснабжение',
        tags: { water: 8, filter: 7 },
    },
    {
        id: 'infra',
        label: 'Инфраструктура',
        tags: {
            engineering: 7,
            tools: 5,
            construction: 6,
            carpentry: 5,
            welding: 5,
            power: 7,
            electronics: 4,
            shelter_gear: 5,
        },
    },
    {
        id: 'security',
        label: 'Безопасность',
        tags: { weapons: 7, defense: 7, fire: 3, radiation: 3 },
    },
    {
        id: 'morale',
        label: 'Мораль',
        tags: { psychology: 7, morale: 6, luxury: 3, animals: 2 },
        categories: { personality: 3, phobia: -4, hobby: 3, fact: 1 },
    },
];
function themePressureOnCriterion(id, themes) {
    const has = (t) => themes.includes(t);
    switch (id) {
        case 'food':
            return (has('famine') ? -10 : 0) + (has('drought') ? -6 : 0) + (has('wilderness') ? -4 : 0);
        case 'health':
            return ((has('plague') ? -10 : 0) +
                (has('spores') ? -8 : 0) +
                (has('radiation') ? -6 : 0) +
                (has('toxic_air') ? -6 : 0));
        case 'water':
            return (has('drought') ? -10 : 0) + (has('flood') ? -4 : 0) + (has('toxic_air') ? -3 : 0);
        case 'infra':
            return ((has('emp') ? -10 : 0) +
                (has('power_loss') ? -8 : 0) +
                (has('structural') ? -6 : 0) +
                (has('cold') ? -4 : 0));
        case 'security':
            return (has('raiders') ? -8 : 0) + (has('predators') ? -8 : 0) + (has('fire') ? -3 : 0);
        case 'morale':
            return ((has('isolation') ? -8 : 0) +
                (has('mental') ? -8 : 0) +
                (has('darkness') ? -4 : 0));
        default:
            return 0;
    }
}
function criterionVerdict(id, score, threshold) {
    if (score >= threshold + 15) {
        const good = {
            food: 'запасы и добыча закрывают голод',
            health: 'медицина тянет группу',
            water: 'питьё и фильтрация в порядке',
            infra: 'бункер можно чинить и питать',
            security: 'угрозы снаружи сдерживаются',
            morale: 'команда держится',
        };
        return good[id];
    }
    if (score >= threshold) {
        return 'закрывает порог катастрофы';
    }
    const bad = {
        food: 'риск голода',
        health: 'медицины мало',
        water: 'питьё — узкое место',
        infra: 'техника и ремонт слабые',
        security: 'уязвимы к нападению',
        morale: 'мораль проседает',
    };
    return bad[id];
}
function buildReadinessCriteria(input) {
    const survivors = input.hands.filter((h) => input.survivorIds.has(h.id));
    const pool = survivors.length > 0 ? survivors : input.hands;
    const threshold = input.threshold;
    return CRITERION_META.map((meta) => {
        const baseline = 50;
        let raw = baseline + themePressureOnCriterion(meta.id, input.themes);
        const driverMap = new Map();
        for (const hand of pool) {
            for (const trait of hand.tagged) {
                let traitDelta = 0;
                for (const tag of trait.tags) {
                    traitDelta += meta.tags[tag] ?? 0;
                }
                if (meta.categories?.[trait.category]) {
                    if (traitDelta === 0 || trait.category === 'phobia' || trait.category === 'health') {
                        traitDelta += meta.categories[trait.category] ?? 0;
                    }
                }
                if (meta.id === 'morale' && trait.category === 'phobia' && traitDelta === 0) {
                    traitDelta = -3;
                }
                if (traitDelta === 0)
                    continue;
                const scaled = Math.round(traitDelta * (pool.length <= 2 ? 1 : 0.75));
                raw += scaled;
                const key = `${hand.id}:${trait.title}`;
                const prev = driverMap.get(key);
                if (prev)
                    prev.delta += scaled;
                else {
                    driverMap.set(key, {
                        player_id: hand.id,
                        name: hand.name,
                        trait_title: trait.title,
                        delta: scaled,
                    });
                }
            }
        }
        const score = clamp(Math.round(raw), 5, 95);
        const drivers = [...driverMap.values()]
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, 5);
        return {
            id: meta.id,
            label: meta.label,
            score,
            baseline,
            delta: score - baseline,
            verdict: criterionVerdict(meta.id, score, threshold),
            drivers,
        };
    });
}
function traitDelta(trait, themes) {
    if (trait.category === 'phobia') {
        const fearPressure = trait.fears.length > 0 ? -2 : -1;
        const themeFear = (trait.fears.includes('darkness') && themes.includes('darkness') ? -2 : 0) +
            (trait.fears.includes('fire') && themes.includes('fire') ? -2 : 0) +
            (trait.fears.includes('insects') && themes.includes('insects') ? -2 : 0) +
            (trait.fears.includes('water_fear') &&
                (themes.includes('flood') || themes.includes('drought'))
                ? -2
                : 0) +
            (trait.fears.includes('confined') && themes.includes('structural') ? -1 : 0);
        return clamp(fearPressure + themeFear, -6, 0);
    }
    const fit = themeFitForTags(trait.tags, themes);
    if (trait.tags.length === 0) {
        if (trait.category === 'health')
            return 0;
        if (trait.category === 'hobby' || trait.category === 'fact')
            return 0;
        return 0;
    }
    return clamp(Math.round(fit / 2.2), -5, 6);
}
const CATEGORY_ORDER = [
    'profession',
    'health',
    'biology',
    'baggage',
    'hobby',
    'personality',
    'fact',
    'phobia',
];
function categoryVerdict(category, teamTotal) {
    if (category === 'phobia') {
        if (teamTotal <= -8)
            return 'фобии сильно давят на мораль';
        if (teamTotal <= -3)
            return 'есть напряжённые фобии';
        return 'фобии терпимы';
    }
    if (teamTotal >= 8)
        return 'сильная опора бункера';
    if (teamTotal >= 3)
        return 'полезный вклад';
    if (teamTotal >= 0)
        return 'нейтрально';
    if (teamTotal >= -4)
        return 'слабое место';
    return 'дыра в готовности';
}
function buildCategoryContributionReport(input) {
    return CATEGORY_ORDER.map((category) => {
        const entries = [];
        for (const hand of input.hands) {
            const trait = hand.tagged.find((t) => t.category === category);
            if (!trait)
                continue;
            const delta = traitDelta(trait, input.themes);
            if (delta === 0)
                continue;
            const survived = input.survivorIds.has(hand.id);
            entries.push({
                player_id: hand.id,
                name: hand.name,
                survived,
                trait_title: trait.title,
                delta,
            });
        }
        entries.sort((a, b) => {
            if (a.survived !== b.survived)
                return a.survived ? -1 : 1;
            return b.delta - a.delta;
        });
        const team_total = entries
            .filter((e) => e.survived)
            .reduce((s, e) => s + e.delta, 0);
        return {
            category,
            team_total,
            verdict: categoryVerdict(category, team_total),
            entries,
        };
    }).filter((col) => col.entries.length > 0);
}
function computeThematicSurvivalChance(input) {
    let score = 42 + input.themeFit + input.synergy - input.conflict;
    if (input.survived)
        score += 10;
    else
        score -= 8;
    return clamp(Math.round(score), 3, 97);
}
//# sourceMappingURL=game.synergy.js.map
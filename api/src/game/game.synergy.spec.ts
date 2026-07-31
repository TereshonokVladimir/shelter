import {
  computeThematicSurvivalChance,
  evaluateBunkerSynergy,
  extractTags,
  extractThemes,
} from './game.synergy'

describe('game.synergy', () => {
  it('tags carpenter and tools', () => {
    expect(extractTags('Плотник Делает опоры')).toContain('carpentry')
    expect(extractTags('Набор отвёрток и ключей')).toContain('tools')
  })

  it('marks money as weak on wilderness / island disasters', () => {
    const themes = extractThemes('Необитаемый остров. Джунгли и голод.')
    expect(themes).toEqual(expect.arrayContaining(['wilderness']))

    const report = evaluateBunkerSynergy({
      disasterTitle: 'Необитаемый остров',
      disasterDescription: 'Выброшены на берег. Джунгли, голод, никакой цивилизации.',
      players: [
        {
          id: 'a',
          name: 'Аня',
          status: 'active',
          traits: [{ category: 'baggage', title: 'Золотые зубы в мешочке', description: null }],
        },
        {
          id: 'b',
          name: 'Боря',
          status: 'active',
          traits: [{ category: 'profession', title: 'Агроном', description: 'Выращивает еду' }],
        },
      ],
    })

    const anya = report.players.find((p) => p.player_id === 'a')!
    const borya = report.players.find((p) => p.player_id === 'b')!
    expect(anya.theme_fit).toBeLessThan(borya.theme_fit)
  })

  it('gives carpenter + tools synergy', () => {
    const report = evaluateBunkerSynergy({
      disasterTitle: 'Гниение бетона',
      disasterDescription: 'Стены требуют ремонта.',
      players: [
        {
          id: 'c',
          name: 'Коля',
          status: 'active',
          traits: [{ category: 'profession', title: 'Плотник', description: null }],
        },
        {
          id: 'd',
          name: 'Дина',
          status: 'active',
          traits: [
            {
              category: 'baggage',
              title: 'Набор отвёрток и ключей',
              description: null,
            },
          ],
        },
      ],
    })

    expect(report.players.every((p) => p.synergy > 0)).toBe(true)
    expect(report.highlights.some((h) => h.includes('Плотник'))).toBe(true)
  })

  it('penalizes weapon phobia next to weapons', () => {
    const report = evaluateBunkerSynergy({
      disasterTitle: 'Бунты голодных',
      disasterDescription: 'Нужна оборона.',
      players: [
        {
          id: 'e',
          name: 'Егор',
          status: 'active',
          traits: [{ category: 'phobia', title: 'Боязнь оружия', description: null }],
        },
        {
          id: 'f',
          name: 'Федя',
          status: 'active',
          traits: [
            { category: 'baggage', title: 'Смазанный пистолет без номера', description: null },
          ],
        },
      ],
    })

    const egor = report.players.find((p) => p.player_id === 'e')!
    const fedya = report.players.find((p) => p.player_id === 'f')!
    expect(egor.conflict).toBeGreaterThan(0)
    expect(fedya.conflict).toBeGreaterThan(0)
    expect(egor.conflict).toBeGreaterThan(fedya.conflict)
  })

  it('clamps survival chance', () => {
    expect(
      computeThematicSurvivalChance({
        survived: true,
        themeFit: 26,
        synergy: 24,
        conflict: 0,
      }),
    ).toBeLessThanOrEqual(97)
    expect(
      computeThematicSurvivalChance({
        survived: false,
        themeFit: -22,
        synergy: 0,
        conflict: 28,
      }),
    ).toBeGreaterThanOrEqual(3)
  })

  it('sets pass/fail against disaster threshold', () => {
    const report = evaluateBunkerSynergy({
      disasterTitle: 'Пандемия X',
      disasterDescription: 'Новый патоген. Карантин — единственный шанс.',
      players: [
        {
          id: 'a',
          name: 'Аня',
          status: 'active',
          traits: [
            { category: 'profession', title: 'Хирург', description: 'Операции' },
            { category: 'baggage', title: 'Аптечка первой помощи', description: null },
          ],
        },
      ],
    })
    expect(report.challenge_threshold).toBeGreaterThanOrEqual(40)
    expect(report.passed).toBe(report.bunker_outlook >= report.challenge_threshold)
    expect(report.bunker_verdict.length).toBeGreaterThan(0)
  })

  it('builds readiness criteria from 50% baseline; outlook is average', () => {
    const report = evaluateBunkerSynergy({
      disasterTitle: 'Засуха',
      disasterDescription: 'Нет воды и еды. Радиация на поверхности.',
      players: [
        {
          id: 'a',
          name: 'Аня',
          status: 'active',
          traits: [
            { category: 'profession', title: 'Агроном', description: 'Выращивает еду' },
            { category: 'baggage', title: 'Фильтр для воды', description: null },
            { category: 'hobby', title: 'Гитара', description: null },
          ],
        },
      ],
    })

    expect(report.criteria).toHaveLength(6)
    expect(report.criteria.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        'food',
        'health',
        'water',
        'infra',
        'security',
        'morale',
      ]),
    )
    for (const c of report.criteria) {
      expect(c.baseline).toBe(50)
      expect(c.score).toBeGreaterThanOrEqual(5)
      expect(c.score).toBeLessThanOrEqual(95)
      expect(c.delta).toBe(c.score - 50)
    }
    const food = report.criteria.find((c) => c.id === 'food')!
    const water = report.criteria.find((c) => c.id === 'water')!
    expect(food.score).toBeGreaterThan(50)
    expect(water.score).toBeGreaterThan(40)
    const avg = Math.round(
      report.criteria.reduce((s, c) => s + c.score, 0) / report.criteria.length,
    )
    expect(report.bunker_outlook).toBe(avg)
  })
})

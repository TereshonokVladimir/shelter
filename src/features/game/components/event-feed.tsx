import type { GameEvent } from '@/lib/api/types'

const EVENT_LABELS: Record<string, string> = {
  room_created: 'Комната создана',
  player_joined: 'Игрок присоединился',
  player_removed: 'Игрок удалён',
  game_started: 'Игра началась',
  characteristic_revealed: 'Характеристика раскрыта',
  action_played: 'Сыграна карточка действия',
  discussion_started: 'Речи',
  presentation_started: 'Речи',
  presentation_advanced: 'Следующая речь',
  voting_started: 'Голосование',
  vote_submitted: 'Голос принят',
  vote_tie: 'Ничья',
  player_eliminated: 'Исключение',
  reveal_started: 'Новый раунд',
  game_paused: 'Пауза',
  game_resumed: 'Игра продолжена',
  game_finished: 'Финал',
}

interface EventFeedProps {
  events: GameEvent[]
  compact?: boolean
}

export function EventFeed({ events, compact = false }: EventFeedProps) {
  return (
    <div className={compact ? 'flex min-h-0 flex-1 flex-col' : 'rounded-lg border border-border/40 bg-background/30 p-3'}>
      <h3 className={`font-medium text-stone-200 ${compact ? 'mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-500' : 'mb-2 text-sm'}`}>
        {compact ? 'События' : 'События'}
      </h3>
      <ul
        className={`scrollbar-none flex flex-col gap-2 overflow-y-auto ${
          compact ? 'min-h-0 flex-1' : 'max-h-56'
        }`}
      >
        {events.length === 0 ? (
          <li className="text-sm text-muted-foreground">Пока тихо…</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="text-xs leading-snug text-stone-400">
              <span className="text-stone-600">
                {new Date(event.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>{' '}
              <span className="text-stone-300">{EVENT_LABELS[event.type] ?? event.type}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

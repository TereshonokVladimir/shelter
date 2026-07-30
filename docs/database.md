# Database

Prisma models (SQLite locally):

- `users` — anonymous accounts
- `rooms` — game rooms / FSM status
- `players` — room membership
- `characteristics` / `player_characteristics`
- `disasters` / `bunkers`
- `votes`
- `game_events`

Enums хранятся как строки (SQLite). Критичные операции выполняются в `prisma.$transaction`.

Seed: `npm --prefix api run prisma:seed`

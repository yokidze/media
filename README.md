# Политех Медиа Архив

Production-ready платформа цифрового архива колледжа с акцентом на медиа-контент:
- публичный каталог с разделами: статьи, телесюжеты, фото мероприятий
- фильтрация и полнотекстовый поиск
- защищённая админ-панель с RBAC
- загрузка файлов (multi-file), поддержка Local/S3 storage
- Prisma + PostgreSQL, готовность к облачной БД

## Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL 16+
- Search: PostgreSQL Full-Text Search + `pg_trgm`
- Auth: JWT access/refresh cookies, RBAC, CSRF
- Storage: Local filesystem или S3-compatible (MinIO/AWS S3)
- Infra: Docker Compose

## Project Structure
```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src
│   │   │   ├── modules/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── app.ts
│   │   └── tests/
│   └── web
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── tests/
├── packages/shared
├── docs
├── storage
├── docker-compose.yml
└── .env.example
```

## Контент и разделы
Ключевые разделы каталога:
- `ARTICLE` -> Статьи
- `TV_STORY` -> Телесюжеты
- `EVENT_PHOTO` -> Фото мероприятий

В модели `ArchiveItem` сохранён `materialType` и добавлен `contentSection` для отдельной навигации по разделам без ломки старой логики.

## API Endpoints (v1)
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET|POST|DELETE /auth/me/avatar`
- `GET|POST|PATCH|DELETE /users`
- `GET|POST|PATCH|DELETE /archive-items`, `POST /archive-items/bulk`
- `POST /archive-items/:itemId/files`
- `GET /files/:id/view`, `GET /files/:id/preview`, `GET /files/:id/download`, `DELETE /files/:id`
- `GET|POST|PATCH|DELETE /categories`
- `GET|POST|PATCH|DELETE /tags`
- `GET /search`, `GET /search/autocomplete`, `GET /search/suggestions`
- `GET /filters/options`
- `GET /statistics/dashboard`
- `GET /favorites`, `POST /favorites`, `DELETE /favorites/:archiveItemId`
- `GET /history`
- `GET /admin/audit-logs`, `POST /admin/import/csv`, `GET /admin/export/archive-items`

## Запуск (рекомендуемый: внешняя БД)
1. Скопируйте env:
   - `copy .env.example .env` (Windows)
2. Укажите `DATABASE_URL` (облачный PostgreSQL).
3. Установите зависимости:
   - `npm install`
4. Примените миграции:
   - `npm run prisma:migrate -w apps/api`
5. (Опционально) заполните seed:
   - `npm run prisma:seed -w apps/api`
6. Запустите dev:
   - `npm run dev`

Frontend: [http://localhost](http://localhost)
Backend: [http://localhost:4000](http://localhost:4000)

## Локальный Postgres (опционально)
Если нужен локальный контейнер БД:
```bash
docker compose --profile local-db up -d postgres
```

Затем можно использовать `DATABASE_URL` вида:
```text
postgresql://archive_user:archive_password@localhost:5432/polytech_media_archive?schema=public
```

## Полный Docker запуск
```bash
docker compose up --build
```

Важно: `api` теперь использует внешний `DATABASE_URL` из `.env` и не зависит от локального контейнера Postgres по умолчанию.

## Tests
```bash
npm run test -w apps/api
npm run test -w apps/web
```

## Security
- Argon2 password hashing
- JWT access/refresh lifecycle + session storage
- RBAC middleware checks
- CSRF check (`x-csrf-token` vs cookie)
- Helmet, CORS, rate limiting
- Upload MIME validation and size limits
- Prisma ORM + parameterized/raw SQL safeguards

## Backups
См. [`docs/deployment.md`](docs/deployment.md):
- PostgreSQL backup/restore
- file storage backup
- recommended backup schedules

# Архитектура

Подробная версия: [Полная документация и справочник](project-reference.md).

## Обзор

`Polytech Media Archive` - TypeScript-монорепозиторий из трех рабочих пакетов:

- `apps/web` - Next.js 15 frontend: публичный каталог, поиск, личный кабинет, админ-панель.
- `apps/api` - Express API: авторизация, RBAC, CRUD, поиск, загрузки, аудит.
- `packages/shared` - общие DTO-типы.

Основные внешние зависимости:

- PostgreSQL 16+ для бизнес-данных, сессий, полнотекстового поиска и статистики.
- Local filesystem или S3-compatible storage для файлов.
- Docker Compose, PM2 или systemd для production-запуска.

## Поток запроса

1. Пользователь открывает страницу в `apps/web`.
2. Frontend обращается к `/api/v1`.
3. Next.js rewrite проксирует `/api/*` на Express backend.
4. API валидирует входные данные через Zod.
5. Middleware проверяют auth, CSRF и роли.
6. Prisma выполняет запросы в PostgreSQL.
7. Файлы читаются из локального storage или S3.
8. API возвращает JSON, file response или redirect на remote storage.

## Backend-слои

| Слой | Путь | Назначение |
| --- | --- | --- |
| Entry | `src/main.ts`, `src/app.ts` | Запуск сервера, Express app, глобальные middleware |
| Config | `src/config/env.ts` | Валидация переменных окружения |
| Modules | `src/modules/*` | Feature-route-ы и use-case логика |
| Middleware | `src/middleware/*` | Auth, RBAC, CSRF, validation, rate limit, errors |
| Services | `src/services/*` | Audit, preview, storage, profile sync, file utils |
| Prisma | `prisma/schema.prisma` | Схема БД, enum-ы и связи |

## Frontend-слои

| Слой | Путь | Назначение |
| --- | --- | --- |
| Routes | `app/*` | Next.js App Router страницы |
| Components | `components/*` | UI и рабочие формы |
| API client | `lib/api.ts` | `fetch` wrapper с cookies, CSRF и refresh retry |
| Config | `lib/config.ts` | API base URL и cookie names |
| Middleware | `middleware.ts` | Защита `/admin`, `/account`, redirect login |

## Основные доменные сущности

- `ArchiveItem` - материал архива.
- `ArchiveFile` - файл материала.
- `Category` - категория, поддерживает дерево.
- `Tag` - тег.
- `Author` - автор материала.
- `User`, `Profile`, `Role`, `UserRole`, `Session` - пользователи, роли и сессии.
- `Favorite`, `ViewHistory` - пользовательские сценарии.
- `AuditLog`, `StatisticsDaily` - аудит и статистика.

## Разделы и типы материалов

Верхнеуровневые разделы:

- `ARTICLE`
- `TV_STORY`
- `EVENT_PHOTO`
- `METHODICAL_AUTHOR_PROGRAM`

Типы материалов:

- `DOCUMENT`
- `ARTICLE`
- `NEWSPAPER`
- `BOOKLET`
- `UMKD`
- `IMAGE`
- `VIDEO`
- `AUDIO`
- `SCAN`
- `OTHER`

## Доступ

Роли:

- `GUEST` - публичный просмотр.
- `STAFF` - доступ к внутренним материалам и управление своими материалами.
- `ADMIN` - полный доступ.

Уровни доступа:

- `PUBLIC`
- `STAFF_ONLY`
- `HIDDEN`

Статусы:

- `DRAFT`
- `PUBLISHED`

## Поиск

Поиск использует PostgreSQL:

- generated `searchVector`;
- GIN index;
- `websearch_to_tsquery`;
- `ts_rank`;
- `ts_headline`;
- trigram-подсказки через `pg_trgm`.

`/search` возвращает полнотекстовые результаты, `/search/autocomplete` - быстрые подсказки, `/search/suggestions` - похожие варианты по заголовкам и тегам.

## Масштабирование

- API stateless, кроме refresh-сессий в БД.
- Storage abstraction позволяет заменить local filesystem на S3/MinIO.
- PostgreSQL indexes поддерживают быстрый поиск и фильтры.
- Frontend и API можно масштабировать отдельно, если вынести storage и DB в общие внешние сервисы.

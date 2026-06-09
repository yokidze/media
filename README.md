# Polytech Media Archive

Цифровой медиаархив колледжа: публичный каталог материалов, полнотекстовый поиск, фильтры, избранное, история просмотров, личный кабинет преподавателя и защищенная административная панель.

Проект построен как TypeScript-монорепозиторий:

- `apps/web` - Next.js 15 frontend.
- `apps/api` - Express REST API.
- `packages/shared` - общие типы DTO.
- `docs` - документация по архитектуре, администрированию и развертыванию.
- `storage` - локальные загрузки и служебные файлы хранилища.
- `backups` - резервные копии БД.
- `release` - собранные архивы для передачи на сервер.

## Документация

Основной справочник проекта:

- [Полная документация и справочник](docs/project-reference.md)

Дополнительные документы:

- [Архитектура](docs/architecture.md)
- [Руководство администратора](docs/admin-guide.md)
- [Развертывание](docs/deployment.md)
- [Развертывание на сервере колледжа](docs/college-server-deploy.md)

## Технологии

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- Database: PostgreSQL 16+, Prisma ORM.
- Search: PostgreSQL Full-Text Search и `pg_trgm`.
- Auth: JWT cookies, refresh-сессии, CSRF, RBAC.
- Storage: локальная файловая система или S3-совместимое хранилище.
- Tests: Vitest.
- Deploy: Docker Compose, PM2 или systemd.

## Быстрый локальный запуск

Требования:

- Node.js `>=20.11.0`
- npm
- PostgreSQL 16+ или Docker

```bash
cp .env.example .env
npm install
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
npm run dev
```

После запуска:

- Web: `http://localhost`
- API healthcheck: `http://localhost:4000/health`
- API base path: `http://localhost:4000/api/v1`

Если PostgreSQL поднимается через Docker Compose:

```bash
docker compose --profile local-db up -d postgres
```

## Основные команды

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
```

Команды отдельных приложений:

```bash
npm run dev -w apps/api
npm run dev -w apps/web
npm run build -w apps/api
npm run build -w apps/web
```

## Переменные окружения

Скопируйте шаблон:

```bash
cp .env.example .env
```

Ключевые переменные:

- `DATABASE_URL` - строка подключения PostgreSQL.
- `DIRECT_DATABASE_URL` - прямая строка для Prisma migrations, может совпадать с `DATABASE_URL`.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - секреты длиной не меньше 32 символов.
- `APP_ORIGIN` - публичный origin frontend.
- `NEXT_PUBLIC_SITE_URL` - публичный URL сайта.
- `NEXT_PUBLIC_CLIENT_API_BASE` - клиентский API-префикс, обычно `/api/v1`.
- `NEXT_PUBLIC_API_PROXY_TARGET` - адрес backend для Next.js rewrites.
- `INTERNAL_API_BASE` - backend URL для server-side запросов frontend.
- `STORAGE_DRIVER` - `LOCAL` или `S3`.
- `STORAGE_LOCAL_ROOT` - путь к локальному хранилищу.
- `FILE_MAX_SIZE_MB` - лимит размера загружаемого файла.

Для production обязательно замените все значения `CHANGE_ME...`.

## Docker Compose

Серверный запуск с локальной PostgreSQL и локальным storage:

```bash
cp .env.server.example .env
docker compose -f docker-compose.server.yml up -d --build
```

После первого запуска примените миграции:

```bash
docker compose -f docker-compose.server.yml exec api npm run prisma:migrate -w apps/api
```

Опционально заполните начальными данными:

```bash
docker compose -f docker-compose.server.yml exec api npm run prisma:seed -w apps/api
```

## Роли и доступ

- `GUEST` - неавторизованный пользователь; видит только опубликованные `PUBLIC` материалы.
- `STAFF` - сотрудник/преподаватель; видит `PUBLIC` и `STAFF_ONLY`, может создавать и редактировать свои материалы.
- `ADMIN` - полный доступ к материалам, пользователям, справочникам, журналу аудита, импорту и экспорту.

Уровни доступа материалов:

- `PUBLIC` - доступно всем.
- `STAFF_ONLY` - доступно сотрудникам и администраторам.
- `HIDDEN` - доступно только администраторам.

Статусы материалов:

- `DRAFT` - черновик.
- `PUBLISHED` - опубликованный материал.

## Основные разделы сайта

- `/` - главная страница.
- `/archive` - каталог архива.
- `/archive/[slug]` - карточка материала.
- `/search` - поиск.
- `/categories` - категории.
- `/login` - вход.
- `/account` - личный кабинет.
- `/account/change-password` - смена пароля.
- `/admin` - панель администратора.
- `/admin/items` - управление материалами.
- `/admin/items/new` - создание материала.
- `/admin/categories` - категории.
- `/admin/tags` - теги.
- `/admin/users` - пользователи.
- `/admin/access` - сводка доступа.
- `/admin/import` - импорт/экспорт CSV.
- `/admin/logs` - журнал аудита.

## API

Backend публикует REST API под префиксом `/api/v1`.

Основные группы:

- `/auth` - вход, refresh, logout, профиль, аватар, смена пароля.
- `/archive-items` - материалы архива и загрузка файлов.
- `/files` - просмотр, скачивание и превью файлов.
- `/search` - полнотекстовый поиск, autocomplete, suggestions.
- `/categories` - категории.
- `/tags` - теги.
- `/filters/options` - значения для фильтров.
- `/favorites` - избранное пользователя.
- `/history` - история просмотров пользователя.
- `/statistics/dashboard` - административная статистика.
- `/users` - управление пользователями.
- `/admin` - overview, audit logs, CSV import/export.

Полный перечень endpoint-ов описан в [справочнике](docs/project-reference.md).

## Проверки перед сдачей или обновлением

```bash
npm run lint
npm run test
npm run build
npm run prisma:migrate -w apps/api
```

Smoke-check:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/categories
curl http://localhost/api/v1/categories
```

Проверьте вручную:

- вход и выход из аккаунта;
- открытие каталога и карточки материала;
- поиск и фильтры;
- загрузку, просмотр и скачивание файлов;
- создание, редактирование и удаление материалов;
- страницы категорий, тегов, пользователей и журнала аудита;
- импорт и экспорт CSV.

## Безопасность репозитория

Нельзя коммитить:

- `.env`, `apps/api/.env`, `apps/web/.env`;
- пароли БД, JWT-секреты, S3-ключи, приватные ключи;
- `storage` с загруженными файлами и локальными данными PostgreSQL;
- `backups` с дампами БД;
- `release` архивы;
- `node_modules`, `dist`, `.next`, `.next-dev`, логи и временные файлы.

Используйте `.env.example`, `.env.server.example`, `apps/api/.env.example` и `apps/web/.env.example` только как шаблоны.

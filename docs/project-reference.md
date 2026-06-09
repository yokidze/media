# Polytech Media Archive: полная документация и справочник

## 1. Назначение проекта

`Polytech Media Archive` - веб-платформа для хранения, публикации и поиска материалов колледжа. Система закрывает два сценария:

- публичный каталог для студентов, сотрудников и внешних посетителей;
- административную рабочую область для наполнения архива, управления пользователями, справочниками и доступом.

В архиве поддерживаются статьи, телесюжеты, фотографии мероприятий, методические материалы, документы, газеты, буклеты, изображения, видео, аудио, сканы и прочие файлы.

## 2. Архитектура

Проект разделен на три рабочих пакета:

| Путь | Назначение |
| --- | --- |
| `apps/web` | Next.js приложение: публичный интерфейс, личный кабинет, админ-панель |
| `apps/api` | Express API: авторизация, RBAC, CRUD, поиск, загрузки, аудит |
| `packages/shared` | Общие TypeScript-типы DTO |

Инфраструктурные каталоги:

| Путь | Назначение |
| --- | --- |
| `docs` | Документация проекта |
| `storage` | Локальные загрузки, превью, аватары и локальные данные |
| `backups` | SQL-дампы и резервные копии |
| `release` | Готовые пакеты поставки |
| `scripts` | Вспомогательные скрипты |

Высокоуровневый поток:

1. Пользователь открывает frontend.
2. Frontend обращается к API через `/api/v1`.
3. Next.js rewrites проксируют `/api/*` на backend.
4. API читает и пишет данные через Prisma в PostgreSQL.
5. Файлы сохраняются в локальное хранилище или S3.
6. Права доступа проверяются по JWT-cookie, сессиям, ролям и уровню доступа материала.

## 3. Технологический стек

| Слой | Технологии |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 4, TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL 16+ |
| Search | PostgreSQL Full-Text Search, `pg_trgm` |
| Auth | JWT access/refresh cookies, DB sessions, CSRF |
| Validation | Zod |
| Uploads | Multer |
| Images | Sharp |
| Logging | Pino |
| Tests | Vitest, Supertest |
| Deploy | Docker Compose, PM2, systemd |

## 4. Требования

Для разработки:

- Node.js `>=20.11.0`
- npm
- PostgreSQL 16+ или Docker
- Windows, Linux или macOS

Для production:

- Linux-сервер;
- PostgreSQL 16+;
- reverse proxy с HTTPS;
- постоянное хранилище для `storage`;
- регулярные backup-и БД и файлов.

## 5. Установка и локальный запуск

1. Скопировать переменные окружения:

```bash
cp .env.example .env
```

2. Заполнить `DATABASE_URL`, JWT-секреты и адреса.

3. Установить зависимости:

```bash
npm install
```

4. Применить миграции:

```bash
npm run prisma:migrate -w apps/api
```

5. Опционально заполнить начальными данными:

```bash
npm run prisma:seed -w apps/api
```

6. Запустить оба приложения:

```bash
npm run dev
```

Адреса:

- Web: `http://localhost`
- API: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/health`

## 6. Команды

Корневые команды:

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запуск API и web одновременно |
| `npm run build` | Сборка shared, API и web |
| `npm run lint` | TypeScript-проверка API и web |
| `npm run test` | Тесты API и web |
| `npm run prisma:migrate` | Production-миграции Prisma |
| `npm run prisma:seed` | Заполнение начальными данными |

API:

| Команда | Назначение |
| --- | --- |
| `npm run dev -w apps/api` | API в watch-режиме |
| `npm run build -w apps/api` | Сборка API в `dist` |
| `npm run start -w apps/api` | Запуск собранного API |
| `npm run lint -w apps/api` | TypeScript-проверка API |
| `npm run test -w apps/api` | Тесты API |
| `npm run prisma:generate -w apps/api` | Генерация Prisma Client |
| `npm run prisma:migrate:dev -w apps/api` | Dev-миграции |

Web:

| Команда | Назначение |
| --- | --- |
| `npm run dev -w apps/web` | Next.js dev server на `0.0.0.0:80` |
| `npm run build -w apps/web` | Production-сборка |
| `npm run start -w apps/web` | Production-запуск |
| `npm run lint -w apps/web` | TypeScript-проверка |
| `npm run test -w apps/web` | Тесты frontend |

## 7. Переменные окружения

Главный шаблон: `.env.example`.

### 7.1 API

| Переменная | Назначение |
| --- | --- |
| `NODE_ENV` | `development`, `test` или `production` |
| `HOST` | Адрес bind для API, обычно `0.0.0.0` |
| `PORT` | Порт API, по умолчанию `4000` |
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | Прямая строка для миграций |
| `API_BASE_PATH` | Префикс API, по умолчанию `/api/v1` |
| `APP_ORIGIN` | Разрешенный origin frontend для CORS |
| `JWT_ACCESS_SECRET` | Секрет access token, минимум 32 символа |
| `JWT_REFRESH_SECRET` | Секрет refresh token, минимум 32 символа |
| `JWT_ACCESS_TTL` | Время жизни access token, например `15m` |
| `JWT_REFRESH_TTL_DAYS` | Срок refresh-сессии в днях |
| `CSRF_COOKIE_NAME` | Имя CSRF cookie |
| `ACCESS_TOKEN_COOKIE_NAME` | Имя access cookie |
| `REFRESH_TOKEN_COOKIE_NAME` | Имя refresh cookie |
| `FILE_MAX_SIZE_MB` | Максимальный размер файла |

### 7.2 Storage

| Переменная | Назначение |
| --- | --- |
| `STORAGE_DRIVER` | `LOCAL` или `S3` |
| `STORAGE_LOCAL_ROOT` | Корень локального хранилища |
| `S3_ENDPOINT` | Endpoint S3/MinIO |
| `S3_REGION` | Регион |
| `S3_BUCKET` | Bucket |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |
| `S3_FORCE_PATH_STYLE` | Path-style URL для MinIO/S3-compatible |

### 7.3 Frontend

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Публичный URL сайта |
| `NEXT_PUBLIC_CLIENT_API_BASE` | Клиентский API base, обычно `/api/v1` |
| `NEXT_PUBLIC_API_PROXY_TARGET` | Backend target для Next.js rewrites |
| `INTERNAL_API_BASE` | API base для server-side кода Next.js |
| `NEXT_PUBLIC_CSRF_COOKIE_NAME` | Имя CSRF cookie на клиенте |
| `NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME` | Имя access cookie на клиенте |
| `NEXT_PUBLIC_REFRESH_TOKEN_COOKIE_NAME` | Имя refresh cookie на клиенте |

### 7.4 Seed

| Переменная | Назначение |
| --- | --- |
| `SEED_ADMIN_PASSWORD` | Начальный пароль администратора |
| `SEED_STAFF_PASSWORD` | Начальный пароль сотрудника |

Если seed-пароли пустые, seed должен сгенерировать временные пароли и вывести их один раз. После первого входа их нужно сменить.

## 8. Frontend

### 8.1 Маршруты

| Route | Назначение |
| --- | --- |
| `/` | Главная страница |
| `/archive` | Каталог материалов |
| `/archive/[slug]` | Детальная карточка материала |
| `/search` | Поиск |
| `/categories` | Просмотр категорий |
| `/login` | Вход |
| `/account` | Личный кабинет пользователя |
| `/account/change-password` | Смена пароля |
| `/admin` | Dashboard администратора |
| `/admin/items` | Список материалов |
| `/admin/items/new` | Создание материала |
| `/admin/items/[id]` | Редактирование материала |
| `/admin/categories` | Управление категориями |
| `/admin/tags` | Управление тегами |
| `/admin/users` | Управление пользователями |
| `/admin/access` | Сводка ролей и возможностей |
| `/admin/import` | CSV импорт/экспорт |
| `/admin/logs` | Журнал аудита |

### 8.2 Middleware

`apps/web/middleware.ts` защищает:

- `/admin/*`
- `/account/*`

Если cookies отсутствуют или `/auth/me` возвращает ошибку, пользователь отправляется на `/login?next=...`. При открытии `/login` уже авторизованный пользователь перенаправляется на `/`.

### 8.3 API-клиент

`apps/web/lib/api.ts` предоставляет `apiFetch`.

Особенности:

- автоматически выбирает server/client API base;
- отправляет cookies;
- добавляет `x-csrf-token` для небезопасных методов;
- при `401` на клиенте пробует `/auth/refresh` и повторяет запрос;
- возвращает JSON или `null` для `204`.

## 9. Backend

### 9.1 Точка входа

- `apps/api/src/main.ts` - запуск HTTP-сервера.
- `apps/api/src/app.ts` - Express app, middleware и роутинг.

Глобальные middleware:

- `pino-http` - request logging;
- `helmet` - security headers;
- `cors` - CORS с `APP_ORIGIN`;
- `apiRateLimiter` - rate limit;
- `express.json` и `express.urlencoded`;
- `cookieParser`;
- `notFoundHandler`;
- `errorHandler`.

### 9.2 API base

По умолчанию все бизнес-route-ы доступны под:

```text
/api/v1
```

Healthcheck расположен отдельно:

```text
GET /health
```

## 10. Справочник API

В таблицах ниже `Auth` означает необходимость авторизации, `CSRF` - необходимость заголовка `x-csrf-token` для mutating-запросов.

### 10.1 Auth

Base: `/api/v1/auth`

| Метод | Endpoint | Auth | CSRF | Назначение |
| --- | --- | --- | --- | --- |
| `POST` | `/login` | Нет | Нет | Вход, установка access/refresh/CSRF cookies |
| `POST` | `/refresh` | Нет | Нет | Ротация refresh token и выдача нового access token |
| `POST` | `/logout` | Да | Да | Выход и отзыв refresh-сессии |
| `GET` | `/me` | Да | Нет | Текущий пользователь |
| `PATCH` | `/me` | Да | Да | Обновление профиля |
| `GET` | `/me/avatar` | Да | Нет | Получение аватара |
| `POST` | `/me/avatar` | Да | Да | Загрузка аватара |
| `DELETE` | `/me/avatar` | Да | Да | Удаление аватара |
| `POST` | `/change-password` | Да | Да | Смена пароля |
| `GET` | `/me/materials` | Да | Нет | Материалы текущего пользователя |

### 10.2 Archive Items

Base: `/api/v1/archive-items`

| Метод | Endpoint | Auth | CSRF | Роли | Назначение |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | Опционально | Нет | Все | Список материалов с фильтрами и пагинацией |
| `GET` | `/:idOrSlug` | Опционально | Нет | Все | Детальная карточка, инкремент просмотров |
| `POST` | `/` | Да | Да | `ADMIN`, `STAFF` | Создание материала |
| `PATCH` | `/:id` | Да | Да | `ADMIN`, `STAFF` | Обновление материала |
| `DELETE` | `/:id` | Да | Да | `ADMIN`, `STAFF` | Soft delete материала |
| `POST` | `/bulk` | Да | Да | `ADMIN` | Bulk delete/publish/draft/access |
| `POST` | `/:itemId/files` | Да | Да | `ADMIN`, `STAFF` | Загрузка файлов к материалу |

Для `STAFF` действует правило владения: сотрудник может редактировать только материалы, где он `createdBy`.

Основные query-параметры списка зависят от schema-файлов, но используются фильтры по разделу, типу, категории, тегам, году, языку, доступу, статусу, сортировке и пагинации.

### 10.3 Files

Base: `/api/v1/files`

| Метод | Endpoint | Auth | CSRF | Роли | Назначение |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/:id/download` | Опционально | Нет | Все с доступом | Скачать файл |
| `GET` | `/:id/view` | Опционально | Нет | Все с доступом | Посмотреть файл inline |
| `GET` | `/:id/preview` | Опционально | Нет | Все с доступом | Получить превью |
| `DELETE` | `/:id` | Да | Да | `ADMIN`, `STAFF` | Удалить файл |

Скачивание увеличивает `downloadsCount` у материала и дневную статистику.

### 10.4 Search

Base: `/api/v1/search`

| Метод | Endpoint | Auth | Назначение |
| --- | --- | --- | --- |
| `GET` | `/` | Опционально | Полнотекстовый поиск с ranking и highlight |
| `GET` | `/autocomplete` | Опционально | Быстрые подсказки материалов |
| `GET` | `/suggestions` | Опционально | Подсказки исправлений/похожих запросов |

Доступность результатов зависит от роли:

- без входа: только `PUBLIC` и `PUBLISHED`;
- `STAFF`: `PUBLIC`, `STAFF_ONLY`, опубликованные;
- `ADMIN`: все уровни доступа и черновики.

### 10.5 Categories

Base: `/api/v1/categories`

| Метод | Endpoint | Auth | CSRF | Роли | Назначение |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | Нет | Нет | Все | Список категорий, поиск по `q` |
| `POST` | `/` | Да | Да | `ADMIN` | Создать категорию |
| `PATCH` | `/:id` | Да | Да | `ADMIN` | Обновить категорию |
| `DELETE` | `/:id` | Да | Да | `ADMIN` | Удалить категорию |

Категория не удаляется, если используется активными материалами.

### 10.6 Tags

Base: `/api/v1/tags`

| Метод | Endpoint | Auth | CSRF | Роли | Назначение |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | Нет | Нет | Все | Список тегов с пагинацией |
| `POST` | `/` | Да | Да | `ADMIN`, `STAFF` | Создать тег |
| `PATCH` | `/:id` | Да | Да | `ADMIN`, `STAFF` | Обновить тег |
| `DELETE` | `/:id` | Да | Да | `ADMIN` | Удалить тег |

### 10.7 Filters

Base: `/api/v1/filters`

| Метод | Endpoint | Auth | Назначение |
| --- | --- | --- | --- |
| `GET` | `/options` | Нет | Значения для фильтров каталога |

Возвращает годы, категории, авторов, теги, языки, расширения файлов, буквы, уровни доступа, типы материалов, разделы и счетчики по разделам. Ответ кэшируется в памяти и сбрасывается при изменениях материалов/справочников.

### 10.8 Favorites

Base: `/api/v1/favorites`

| Метод | Endpoint | Auth | CSRF | Назначение |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Да | Нет | Избранные материалы пользователя |
| `POST` | `/` | Да | Да | Добавить материал в избранное |
| `DELETE` | `/:archiveItemId` | Да | Да | Удалить материал из избранного |

### 10.9 History

Base: `/api/v1/history`

| Метод | Endpoint | Auth | Назначение |
| --- | --- | --- | --- |
| `GET` | `/` | Да | Последние 100 просмотренных материалов |

### 10.10 Statistics

Base: `/api/v1/statistics`

| Метод | Endpoint | Auth | Роли | Назначение |
| --- | --- | --- | --- | --- |
| `GET` | `/dashboard` | Да | `ADMIN` | Сводка для dashboard |

### 10.11 Users

Base: `/api/v1/users`

| Метод | Endpoint | Auth | CSRF | Роли | Назначение |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | Да | Нет | `ADMIN` | Список пользователей |
| `POST` | `/` | Да | Да | `ADMIN` | Создать пользователя |
| `PATCH` | `/:id` | Да | Да | `ADMIN` | Обновить пользователя |
| `POST` | `/:id/block` | Да | Да | `ADMIN` | Заблокировать пользователя |
| `POST` | `/:id/unblock` | Да | Да | `ADMIN` | Разблокировать пользователя |
| `POST` | `/:id/reset-password` | Да | Да | `ADMIN` | Сбросить пароль |
| `DELETE` | `/:id` | Да | Да | `ADMIN` | Удалить пользователя |

Администратор не может удалить собственный аккаунт.

### 10.12 Admin

Base: `/api/v1/admin`

Все route-ы требуют `ADMIN`.

| Метод | Endpoint | CSRF | Назначение |
| --- | --- | --- | --- |
| `GET` | `/overview` | Нет | Сводка пользователей, материалов, категорий, тегов и последних действий |
| `GET` | `/access-summary` | Нет | Сводка возможностей admin/teacher |
| `GET` | `/audit-logs` | Нет | Журнал аудита с фильтрами |
| `POST` | `/import/csv` | Да | Импорт материалов из CSV |
| `GET` | `/export/archive-items` | Нет | Экспорт материалов в CSV |

## 11. Модель данных

### 11.1 Enum-ы

`RoleName`:

- `GUEST`
- `STAFF`
- `ADMIN`

`MaterialType`:

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

`ContentSection`:

- `ARTICLE`
- `TV_STORY`
- `EVENT_PHOTO`
- `METHODICAL_AUTHOR_PROGRAM`

`AccessLevel`:

- `PUBLIC`
- `STAFF_ONLY`
- `HIDDEN`

`ArchiveStatus`:

- `DRAFT`
- `PUBLISHED`

`StorageDriver`:

- `LOCAL`
- `S3`

### 11.2 Основные таблицы

| Модель | Назначение |
| --- | --- |
| `User` | Пользователь системы |
| `Profile` | Профиль пользователя и зеркальные поля |
| `Role` | Роль |
| `UserRole` | Связь пользователя и роли |
| `Session` | Refresh-сессия |
| `ArchiveItem` | Материал архива |
| `ArchiveFile` | Файл материала |
| `Category` | Категория, включая дерево через `parentId` |
| `Tag` | Тег |
| `ArchiveItemTag` | N:M связь материала и тега |
| `Author` | Автор материала |
| `AccessPermission` | Расширяемая модель прав на материал |
| `Favorite` | Избранное |
| `ViewHistory` | История просмотров |
| `AuditLog` | Журнал действий |
| `StatisticsDaily` | Дневная статистика |

### 11.3 ArchiveItem

Ключевые поля:

- `id`, `slug` - идентификаторы.
- `title`, `description`, `textContent` - контент.
- `materialType` - тип материала.
- `contentSection` - верхнеуровневый раздел.
- `accessLevel` - уровень доступа.
- `status` - черновик или публикация.
- `language`, `keywords`, `alphabetLetter`.
- `archiveYear`, `academicYear`, `issueNumber`, `publicationDate`.
- `viewsCount`, `downloadsCount`.
- `categoryId`, `authorId`.
- `createdById`, `updatedById`.
- `deletedAt` - soft delete.

Индексы есть по заголовку, типу, разделу, доступу, статусу, году, дате публикации и дате создания.

### 11.4 ArchiveFile

Ключевые поля:

- `archiveItemId` - владелец файла.
- `fileName` - имя в хранилище.
- `originalName` - исходное имя.
- `relativePath` - путь в storage.
- `storageDriver` - `LOCAL` или `S3`.
- `mimeType`, `extension`, `sizeBytes`.
- `previewPath` - путь к превью.
- `isPrimary` - основной файл карточки.
- `sortOrder` - порядок вывода.
- `width`, `height`, `durationSec`, `pageCount`, `metadataJson`.

## 12. Роли, доступ и безопасность

### 12.1 Роли

`GUEST`:

- публичный просмотр `PUBLIC` материалов;
- поиск и фильтры;
- просмотр/скачивание публичных опубликованных файлов.

`STAFF`:

- возможности гостя;
- просмотр `STAFF_ONLY`;
- создание материалов;
- редактирование и удаление своих материалов;
- управление тегами;
- личный кабинет.

`ADMIN`:

- полный доступ к материалам, включая `HIDDEN` и `DRAFT`;
- управление пользователями;
- управление категориями и тегами;
- dashboard, статистика, аудит;
- импорт и экспорт CSV;
- bulk-операции.

### 12.2 Auth

После login API устанавливает cookies:

- access token;
- refresh token;
- CSRF token.

Access token живет коротко. Refresh token хранится в таблице `Session`, может быть отозван при logout, reset password или block user. Клиент при `401` пытается обновить сессию через `/auth/refresh`.

### 12.3 CSRF

Все небезопасные методы (`POST`, `PATCH`, `DELETE`) для защищенных endpoint-ов требуют CSRF. Frontend читает CSRF cookie и отправляет `x-csrf-token`.

### 12.4 Проверка доступа к материалам

Для чтения:

- `PUBLIC` - доступно всем.
- `STAFF_ONLY` - только `STAFF` и `ADMIN`.
- `HIDDEN` - только `ADMIN`.
- `DRAFT` - только `ADMIN`, кроме рабочих сценариев владения.

Для управления:

- `ADMIN` управляет всеми материалами.
- `STAFF` управляет только своими материалами.

## 13. Поиск и фильтры

Поиск реализован на PostgreSQL:

- `searchVector` на `ArchiveItem`;
- `websearch_to_tsquery`;
- `ts_rank`;
- `ts_headline`;
- trigram-подсказки через `similarity`.

`/search` ищет по полнотекстовому индексу и возвращает `highlight`.

`/search/autocomplete` сначала ищет по началу заголовка, затем по вхождению в заголовок, затем по описанию, тегам и автору.

`/search/suggestions` использует trigram similarity по заголовкам и тегам.

`/filters/options` собирает значения для UI-фильтров и кэширует их в памяти процесса. Кэш сбрасывается при создании/обновлении/удалении материалов, тегов, категорий и файлов.

## 14. Файлы и хранилище

Поддерживаются два драйвера:

- `LOCAL` - файлы сохраняются в `STORAGE_LOCAL_ROOT`;
- `S3` - файлы сохраняются в S3-compatible bucket.

Загрузка:

1. `POST /archive-items/:itemId/files`.
2. Multer принимает до 20 файлов.
3. API проверяет MIME и лимит размера.
4. Storage service сохраняет файл.
5. Для изображений в локальном режиме генерируется preview.
6. Метаданные записываются в `ArchiveFile`.

Получение:

- `/files/:id/view` - inline просмотр.
- `/files/:id/download` - скачивание.
- `/files/:id/preview` - preview.

Для S3 API может вернуть redirect на подписанную/удаленную ссылку в зависимости от реализации storage service.

## 15. Импорт и экспорт CSV

Импорт:

```text
POST /api/v1/admin/import/csv
```

Формат CSV ожидает заголовки:

- `title` или `name`;
- `description`;
- `category`;
- `author`;
- `materialType`;
- `contentSection`;
- `accessLevel`;
- `status`;
- `language`;
- `archiveYear`;
- `publicationDate`;
- `issueNumber`;
- `keywords`.

Особенности:

- `keywords` разделяются символом `|`;
- неизвестный `materialType` заменяется на `DOCUMENT`;
- категория создается автоматически по названию;
- автор создается автоматически по ФИО;
- slug строится от title и дополняется коротким UUID;
- ошибки по строкам возвращаются в ответе, максимум 200 деталей.

Экспорт:

```text
GET /api/v1/admin/export/archive-items
```

Экспортирует CSV с колонками:

- `id`
- `title`
- `slug`
- `contentSection`
- `materialType`
- `accessLevel`
- `status`
- `category`
- `author`
- `archiveYear`
- `language`
- `filesCount`
- `createdAt`

## 16. Администрирование

### 16.1 Материалы

Обычный сценарий:

1. Открыть `/admin/items/new`.
2. Заполнить заголовок, описание, тип, раздел, категорию, дату, год, язык, ключевые слова.
3. Выбрать `accessLevel` и `status`.
4. Добавить теги.
5. Загрузить файлы.
6. Сохранить.

Рекомендуемые правила:

- публиковать только проверенные материалы;
- черновики держать в `DRAFT`;
- внутренние документы помечать `STAFF_ONLY`;
- непубличные служебные материалы помечать `HIDDEN`;
- загружать основной файл первым или выбирать primary index.

### 16.2 Пользователи

Администратор может:

- создавать пользователей;
- назначать роль `admin` или `teacher`;
- блокировать и разблокировать;
- сбрасывать пароль;
- редактировать профиль;
- удалять пользователя, кроме собственного аккаунта.

После сброса пароля `mustChangePassword` становится `true`, а активные refresh-сессии пользователя отзываются.

### 16.3 Категории и теги

Категории поддерживают дерево через `parentId`, сортировку и локализованные названия `nameRu`, `nameKaz`.

Теги используются для поиска, фильтров, карточек и рекомендаций.

### 16.4 Журнал аудита

`AuditLog` фиксирует действия:

- login/logout;
- создание, обновление, удаление материалов;
- загрузка и удаление файлов;
- управление пользователями;
- категории и теги;
- импорт CSV;
- профиль и аватар.

Журнал доступен на `/admin/logs` и через `/api/v1/admin/audit-logs`.

## 17. Развертывание

### 17.1 Docker Compose

Серверный вариант:

```bash
cp .env.server.example .env
docker compose -f docker-compose.server.yml up -d --build
docker compose -f docker-compose.server.yml exec api npm run prisma:migrate -w apps/api
```

Сервисы:

- `postgres` - PostgreSQL 16;
- `api` - Express backend;
- `web` - Next.js frontend.

`docker-compose.yml` дополнительно содержит `minio` и `minio-init` для S3-compatible сценария.

### 17.2 PM2

```bash
npm ci
npm run build
npm run prisma:migrate -w apps/api
pm2 start "npm run start -w apps/api" --name polytech-api
pm2 start "npm run start -w apps/web" --name polytech-web
pm2 save
pm2 startup
```

### 17.3 systemd

Создаются два сервиса:

- `polytech-api.service`;
- `polytech-web.service`.

Оба должны запускаться из корня проекта после `npm ci`, миграций и `npm run build`.

### 17.4 Reverse proxy

Рекомендуется Nginx или Traefik:

- HTTPS;
- HSTS;
- frontend на `web:80` или `127.0.0.1:80`;
- API через frontend rewrite или прямой proxy на `api:4000`;
- лимиты размера тела запроса должны быть не меньше `FILE_MAX_SIZE_MB`.

## 18. Backup и восстановление

### 18.1 PostgreSQL

Backup:

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
```

Restore:

```bash
psql "$DATABASE_URL" < backup_2026-06-07.sql
```

Рекомендации:

- ежедневный logical backup;
- еженедельный полный backup;
- внешнее хранение копий;
- проверка восстановления на staging;
- backup перед миграциями и крупным импортом.

### 18.2 Файлы

Для локального storage:

```bash
tar -czf storage_backup_$(date +%F).tar.gz storage
```

Для S3:

- включить versioning bucket-а, если доступно;
- делать регулярную синхронизацию или snapshots;
- проверять права на чтение/запись/удаление.

## 19. Обновление проекта

Стандартный порядок:

```bash
git pull
npm ci
npm run prisma:migrate -w apps/api
npm run build
```

Затем перезапуск:

```bash
pm2 restart polytech-api polytech-web
```

или:

```bash
sudo systemctl restart polytech-api polytech-web
```

или Docker:

```bash
docker compose -f docker-compose.server.yml up -d --build
```

Перед обновлением production желательно сделать backup БД и `storage`.

## 20. Проверка качества

Перед сдачей:

```bash
npm run lint
npm run test
npm run build
```

Проверка API:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/categories
curl http://localhost:4000/api/v1/filters/options
```

Ручная проверка:

- публичная главная страница открывается;
- каталог показывает опубликованные материалы;
- поиск возвращает результаты;
- фильтры работают;
- вход, refresh и logout работают;
- защищенные страницы редиректят неавторизованного пользователя;
- админ создает материал;
- сотрудник редактирует только свои материалы;
- загрузка, просмотр, preview и скачивание файла работают;
- избранное и история работают для авторизованного пользователя;
- CSV export скачивается;
- CSV import создает материалы;
- журнал аудита пополняется.

## 21. Безопасность и эксплуатационные правила

Обязательно:

- использовать HTTPS в production;
- хранить `.env` вне Git;
- генерировать длинные случайные JWT-секреты;
- ограничить доступ к PostgreSQL по сети;
- не публиковать `storage`, `backups`, `release`;
- регулярно менять временные пароли;
- ограничить число `ADMIN` аккаунтов;
- проверять backup-и восстановлением;
- мониторить дисковое место, особенно `storage` и PostgreSQL;
- не запускать destructive SQL без backup-а.

Нельзя коммитить:

- `.env`;
- дампы БД;
- загруженные пользовательские файлы;
- секреты S3;
- приватные ключи;
- production-логи;
- `node_modules`, `dist`, `.next`, `.next-dev`.

## 22. Типовые проблемы

### API не стартует

Проверьте:

- `DATABASE_URL`;
- доступность PostgreSQL;
- длину `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`;
- порт `4000`;
- применены ли миграции.

### Frontend не видит API

Проверьте:

- `NEXT_PUBLIC_CLIENT_API_BASE`;
- `NEXT_PUBLIC_API_PROXY_TARGET`;
- `INTERNAL_API_BASE`;
- Next.js rewrite в `apps/web/next.config.mjs`;
- CORS `APP_ORIGIN`.

### Не проходят POST/PATCH/DELETE

Вероятные причины:

- нет авторизации;
- нет CSRF cookie;
- frontend не отправляет `x-csrf-token`;
- роль не подходит;
- пользователь пытается редактировать чужой материал.

### Файлы не скачиваются

Проверьте:

- запись в `ArchiveFile`;
- `relativePath`;
- наличие файла в `storage`;
- права доступа материала;
- `STORAGE_DRIVER`;
- S3 credentials и bucket.

### Поиск не находит ожидаемое

Проверьте:

- материал опубликован;
- уровень доступа подходит роли пользователя;
- заполнены `title`, `description`, `textContent`, теги;
- применены миграции, создающие search indexes/vector;
- запрос не слишком короткий или не содержит только стоп-слова.

## 23. Карта ключевых файлов

| Файл | Назначение |
| --- | --- |
| `package.json` | Workspaces и корневые команды |
| `.env.example` | Главный шаблон окружения |
| `.env.server.example` | Серверный шаблон окружения |
| `docker-compose.yml` | Compose с MinIO и опциональной local-db |
| `docker-compose.server.yml` | Compose для серверного запуска |
| `apps/api/src/app.ts` | Express app и роуты |
| `apps/api/src/config/env.ts` | Валидация окружения |
| `apps/api/prisma/schema.prisma` | Схема БД |
| `apps/api/prisma/seed.ts` | Начальные данные |
| `apps/api/src/modules/*` | Feature-модули API |
| `apps/api/src/middleware/*` | Auth, RBAC, CSRF, validation, errors |
| `apps/api/src/services/*` | Audit, preview, profile sync, file utils |
| `apps/api/src/services/storage/*` | Storage abstraction |
| `apps/web/app/*` | Next.js routes |
| `apps/web/components/*` | React-компоненты |
| `apps/web/lib/api.ts` | API-клиент |
| `apps/web/lib/config.ts` | API base и cookie names |
| `apps/web/middleware.ts` | Защита `/admin` и `/account` |
| `packages/shared/src/index.ts` | Общие DTO-типы |

## 24. Глоссарий

| Термин | Значение |
| --- | --- |
| Материал | Основная архивная запись `ArchiveItem` |
| Файл | Загруженный файл материала `ArchiveFile` |
| Раздел | Верхнеуровневое деление архива `ContentSection` |
| Тип материала | Более детальный формат `MaterialType` |
| Уровень доступа | `PUBLIC`, `STAFF_ONLY`, `HIDDEN` |
| Черновик | Материал со статусом `DRAFT` |
| Публикация | Материал со статусом `PUBLISHED` |
| Сотрудник | Пользователь с ролью `STAFF` |
| Администратор | Пользователь с ролью `ADMIN` |
| CSRF | Защита mutating-запросов через cookie + header |
| Refresh-сессия | Запись `Session`, позволяющая обновлять access token |

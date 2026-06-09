# Развертывание

Подробная версия: [Полная документация и справочник](project-reference.md).

## Требования production

- Linux-сервер.
- Node.js `>=20.11.0`.
- PostgreSQL 16+.
- npm.
- Reverse proxy с HTTPS.
- Постоянное хранилище для `storage`.
- Настроенные backup-и БД и файлов.

## Подготовка окружения

```bash
cp .env.server.example .env
```

Заполните:

- `DATABASE_URL`;
- `DIRECT_DATABASE_URL`;
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, если PostgreSQL запускается через Compose;
- `JWT_ACCESS_SECRET`;
- `JWT_REFRESH_SECRET`;
- `APP_ORIGIN`;
- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_API_PROXY_TARGET`;
- `INTERNAL_API_BASE`;
- `STORAGE_DRIVER`;
- storage/S3 переменные.

Все `CHANGE_ME...` значения должны быть заменены.

## Docker Compose

Серверный Compose:

```bash
docker compose -f docker-compose.server.yml up -d --build
```

Применить миграции:

```bash
docker compose -f docker-compose.server.yml exec api npm run prisma:migrate -w apps/api
```

Опционально выполнить seed:

```bash
docker compose -f docker-compose.server.yml exec api npm run prisma:seed -w apps/api
```

Проверить:

```bash
curl http://localhost:4000/health
curl http://localhost/api/v1/categories
```

## Docker Compose с MinIO

`docker-compose.yml` содержит:

- `postgres` с profile `local-db`;
- `minio`;
- `minio-init`;
- `api`;
- `web`.

Запуск PostgreSQL из profile:

```bash
docker compose --profile local-db up -d postgres
```

Запуск полного набора:

```bash
docker compose up -d --build
```

## PM2

```bash
npm ci
npm run prisma:migrate -w apps/api
npm run build
sudo npm install -g pm2
pm2 start "npm run start -w apps/api" --name polytech-api
pm2 start "npm run start -w apps/web" --name polytech-web
pm2 save
pm2 startup
```

Команды:

```bash
pm2 status
pm2 logs polytech-api
pm2 logs polytech-web
pm2 restart polytech-api polytech-web
```

## systemd

API service:

```ini
[Unit]
Description=Polytech Media Archive API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/media-main
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -w apps/api
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Web service:

```ini
[Unit]
Description=Polytech Media Archive Web
After=network.target polytech-api.service

[Service]
Type=simple
WorkingDirectory=/opt/media-main
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -w apps/web
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now polytech-api polytech-web
sudo systemctl status polytech-api polytech-web
```

## Reverse proxy

Рекомендуется Nginx или Traefik:

- включить HTTPS;
- проксировать web на `127.0.0.1:80`;
- API может идти через Next.js rewrite или отдельный upstream `127.0.0.1:4000`;
- `client_max_body_size` должен соответствовать `FILE_MAX_SIZE_MB`;
- включить HSTS после проверки HTTPS.

## Обновление

```bash
git pull
npm ci
npm run prisma:migrate -w apps/api
npm run build
```

Перезапуск PM2:

```bash
pm2 restart polytech-api polytech-web
```

Перезапуск systemd:

```bash
sudo systemctl restart polytech-api polytech-web
```

Перезапуск Docker:

```bash
docker compose -f docker-compose.server.yml up -d --build
```

Перед production-обновлением сделайте backup БД и `storage`.

## Backup

PostgreSQL:

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
```

Restore:

```bash
psql "$DATABASE_URL" < backup_2026-06-07.sql
```

Файлы:

```bash
tar -czf storage_backup_$(date +%F).tar.gz storage
```

## Проверка после deploy

```bash
npm run lint
npm run test
npm run build
curl http://localhost:4000/health
curl http://localhost/api/v1/categories
```

Проверьте вручную:

- login/logout;
- каталог;
- поиск;
- карточку материала;
- upload/view/download файла;
- создание и редактирование материала;
- пользователей;
- категории и теги;
- импорт/экспорт;
- журнал аудита.

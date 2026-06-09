# College Server Deploy With GitHub

This project should be deployed from GitHub with `git clone` or `git pull`.

## Do Not Commit

Keep these files outside GitHub:

- `.env` files
- database dumps in `backups/`
- uploaded files in `storage/`
- local PostgreSQL data in `storage/pgdata`
- logs and release archives
- private keys, tokens, passwords

Use `.env.example` and `.env.server.example` as templates.

## First Deploy

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git media-main
cd media-main
cp .env.server.example .env
nano .env
npm ci
npm run prisma:migrate -w apps/api
npm run build
```

Run with PM2:

```bash
sudo npm install -g pm2
pm2 start "npm run start -w apps/api" --name polytech-api
pm2 start "npm run start -w apps/web" --name polytech-web
pm2 save
pm2 startup
```

Or run with Docker Compose:

```bash
docker compose -f docker-compose.server.yml up -d --build
```

## Updating

```bash
cd /path/to/media-main
git pull
npm ci
npm run prisma:migrate -w apps/api
npm run build
pm2 restart polytech-api polytech-web
```

For Docker Compose:

```bash
git pull
docker compose -f docker-compose.server.yml up -d --build
```

## Data Restore

Restore production data from a private backup location, not from GitHub:

```bash
psql "$DATABASE_URL" < /secure/backups/polytech_media_archive_data.sql
```

Uploaded files should be restored to the server storage folder or S3 bucket separately.

## After Deploy

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/categories
```

Then check login, archive list, search, admin pages, and file upload/download.

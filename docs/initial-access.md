# Initial Access

After the first deploy, run database migrations and seed data:

```bash
docker compose -f docker-compose.server.yml exec api npm run prisma:migrate -w apps/api
docker compose -f docker-compose.server.yml exec api npm run prisma:seed -w apps/api
```

Default administrator account:

```text
Email: polytech@admin.com
Password: adminpolytech
```

These values are controlled by `.env`:

```env
SEED_ADMIN_EMAIL=polytech@admin.com
SEED_ADMIN_PASSWORD=adminpolytech
```

The seed command resets the administrator password from `SEED_ADMIN_PASSWORD` every time it runs. For production, change the password after the first login or set a stronger value in the server `.env` before running seed.

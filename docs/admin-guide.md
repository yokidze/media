# Administrator Guide

## Login
1. Open `/login`
2. Enter admin credentials
3. Go to `/admin`

## Dashboard
- Review totals (materials, files, users, views, downloads)
- Track popular and recently added materials

## Create New Archive Record
1. Open `/admin/items/new`
2. Fill metadata fields
3. Select archive section (`Статьи`, `Телесюжеты`, `Фото мероприятий`)
4. Select tags and access level
5. Add files with drag-and-drop
6. Save record

## Edit or Delete
- Open `/admin/items`
- Click `Редактировать` to update metadata/files
- Use bulk actions for publish/draft/delete

## Category and Tag Management
- `/admin/categories`: add/remove categories
- `/admin/tags`: add/remove tags

## User Management
- `/admin/users`
- Add staff/admin accounts
- Update access through roles

## Import / Export
- `/admin/import`
- CSV import/export supports `contentSection` and `materialType`

## Audit Log
- `/admin/logs`
- View who changed what and when

## Operational Rules
- Keep `ADMIN` role limited to trusted users
- Use `STAFF_ONLY` for internal documents
- Use `HIDDEN` for records not ready for publication
- Regularly back up database and files

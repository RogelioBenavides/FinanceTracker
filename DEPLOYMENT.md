# Deployment & Updates

The app runs as three Docker Compose services: `db` (MariaDB), `backend` (FastAPI),
and `frontend` (React build served by Nginx). Both app images are built **from source
at image-build time**, so updating means: pull the new code, **rebuild the image**, and
**recreate the container**. A plain `docker compose up -d` (without `--build`) keeps the
old image running and is the #1 reason changes don't appear.

All commands below are run from the repository root on the server.

## Update everything (frontend + backend)

```bash
git pull
docker compose up -d --build
```

This rebuilds any image whose source changed and recreates the affected containers.
`db` is left untouched. The backend runs `alembic upgrade head` on startup, so any new
database migrations apply automatically.

## Update only the frontend

Use when only `frontend/` changed (UI tweaks, styling, etc.).

```bash
git pull
docker compose up -d --build frontend
```

## Update only the backend

Use when only `backend/` changed (API, models, migrations).

```bash
git pull
docker compose up -d --build backend
```

Migrations run automatically on container start. To check they applied:

```bash
docker compose logs backend | grep -i alembic
```

## If changes still don't appear

1. **Confirm the code is actually present** on the server:
   ```bash
   git log --oneline -1
   ```
2. **Force a clean rebuild** (bypasses Docker's layer cache) and recreate the container:
   ```bash
   docker compose build --no-cache frontend   # or: backend
   docker compose up -d --force-recreate frontend
   ```
3. **Verify the new build is inside the running container** (frontend example):
   ```bash
   docker compose exec frontend ls -l /usr/share/nginx/html/assets
   ```
4. **Hard-reload the browser** — Nginx serves cached `index.html`/assets, so do
   `Ctrl+Shift+R` or open a private window. This is the final step even after a
   successful rebuild.

## Verify services are healthy

```bash
docker compose ps          # all services should be "Up"
docker compose logs -f backend frontend
```

## Clean up old images

After several rebuilds, dangling images accumulate:

```bash
docker image prune -f
```

## Notes

- **Environment variables** live in `.env` at the repo root (see `.env.example`).
  Changing `.env` requires recreating the affected containers:
  `docker compose up -d --force-recreate`.
- **`docker-compose` (v1):** if `docker compose` (v2) isn't available, substitute
  `docker-compose` in every command above.
- **Database data** persists in the volume at `${DATA_DIR:-./data}/db` and survives
  rebuilds and container recreation. It is *not* removed unless you run
  `docker compose down -v`.

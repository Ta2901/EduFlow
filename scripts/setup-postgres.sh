#!/usr/bin/env bash
# Setup EduFlow with a PostgreSQL database (Neon / Supabase / local).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit DATABASE_URL first."
  exit 1
fi

if grep -q 'USER:PASSWORD@HOST' .env 2>/dev/null; then
  echo "Please set DATABASE_URL in .env to your PostgreSQL connection string."
  exit 1
fi

echo "Applying migrations..."
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/apply-migrations-pg.ts

echo "Seeding default accounts (non-destructive)..."
npm run db:seed

echo ""
echo "Done. Start app: npm run dev"
echo "Admin: eduflow.admin / firstedu.eduflow"

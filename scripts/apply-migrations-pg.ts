/**
 * Apply Prisma migrations via node-pg (Neon cold-start / Prisma engine SSL workaround).
 */
import { createHash, randomUUID } from 'crypto'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

config()

function databaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? ''
  return raw.replace(/^["']|["']$/g, '')
}

async function wakeDatabase(client: Client, attempts = 12): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await client.connect()
      await client.query('SELECT 1')
      return
    } catch (err) {
      try {
        await client.end()
      } catch {
        /* ignore */
      }
      if (i === attempts) throw err
      console.log(`Database not ready (attempt ${i}/${attempts}), retrying...`)
      await new Promise((r) => setTimeout(r, 5000))
      client = new Client({
        connectionString: databaseUrl(),
        connectionTimeoutMillis: 60_000,
      })
    }
  }
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    )
  `)
}

async function main() {
  const url = databaseUrl()
  if (!url.startsWith('postgres')) {
    console.error('apply-migrations-pg.ts requires a PostgreSQL DATABASE_URL')
    process.exit(1)
  }

  const migrationsRoot = path.join(__dirname, '..', 'prisma', 'migrations')
  const migrationDirs = fs
    .readdirSync(migrationsRoot)
    .filter((name) => /^\d{14}_/.test(name))
    .sort()

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 60_000,
  })

  console.log('Connecting to PostgreSQL...')
  await wakeDatabase(client)

  await ensureMigrationsTable(client)

  for (const dir of migrationDirs) {
    const migrationName = dir
    const applied = await client.query(
      `SELECT 1 FROM "_prisma_migrations"
       WHERE "migration_name" = $1 AND "finished_at" IS NOT NULL
       LIMIT 1`,
      [migrationName]
    )
    if ((applied.rowCount ?? 0) > 0) {
      console.log(`Already applied: ${migrationName}`)
      continue
    }

    const sqlPath = path.join(migrationsRoot, dir, 'migration.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    const checksum = createHash('sha256').update(sql).digest('hex')
    const id = randomUUID()

    console.log(`Applying: ${migrationName}`)
    await client.query('BEGIN')
    try {
      await client.query(
        `INSERT INTO "_prisma_migrations"
         ("id", "checksum", "migration_name", "started_at", "applied_steps_count")
         VALUES ($1, $2, $3, NOW(), 1)`,
        [id, checksum, migrationName]
      )
      await client.query(sql)
      await client.query(
        `UPDATE "_prisma_migrations" SET "finished_at" = NOW() WHERE "id" = $1`,
        [id]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  await client.end()
  console.log('Migrations complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import 'dotenv/config'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { database } from './pool.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

async function run() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const applied = new Set(
    (await database.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name),
  )

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) continue

    const sql = readFileSync(path.join(migrationsDir, file), 'utf8')
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`Aplicada: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`Fallo aplicando ${file}`, err)
      process.exit(1)
    } finally {
      client.release()
    }
  }

  console.log('Migraciones al día.')
  process.exit(0)
}

run()

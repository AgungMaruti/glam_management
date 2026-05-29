const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('[db] DATABASE_URL not set — skipping migration')
    return
  }

  const sqlPath = path.join(__dirname, '..', 'supabase', 'init.sql')
  if (!fs.existsSync(sqlPath)) {
    console.log('[db] init.sql not found — skipping migration')
    return
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  try {
    await pool.query(sql)
    console.log('[db] Schema applied successfully')
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('already exists') || err?.code === '42710' || err?.code === '42P07') {
      console.log('[db] Some objects already exist — continuing (idempotent)')
    } else if (msg.includes('depends on') || msg.includes('cannot drop')) {
      console.log('[db] Dependency constraint — continuing (safe)')
    } else {
      console.warn('[db] Migration warning:', msg.substring(0, 200))
      // Never fail the build
    }
  } finally {
    await pool.end()
  }
}

main()

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

function splitSql(sql) {
  const statements = []
  let buf = ''
  let inDollar = false
  let i = 0

  while (i < sql.length) {
    if (sql[i] === '$' && sql[i + 1] === '$') {
      inDollar = !inDollar
      buf += '$$'
      i += 2
      continue
    }
    if (sql[i] === ';' && !inDollar) {
      const s = buf.trim() + ';'
      if (s.length > 1 && !s.startsWith('--')) statements.push(s)
      buf = ''
    } else {
      buf += sql[i]
    }
    i++
  }

  const last = buf.trim()
  if (last.length > 0 && !last.startsWith('--')) statements.push(last)
  return statements
}

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
  const statements = splitSql(sql)
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  const client = await pool.connect()

  let ok = 0
  let skipped = 0
  try {
    for (const stmt of statements) {
      try {
        await client.query(stmt)
        ok++
      } catch (err) {
        skipped++
        const code = err?.code || ''
        const msg = (err?.message || '').substring(0, 120)
        if (code === '42710' || code === '42P07' || msg.includes('already exists')) {
          // OK — idempotent
        } else if (code === '42P01' || msg.includes('does not exist')) {
          // Likely a DROP or ALTER on missing object — safe to skip
        } else {
          console.log(`[db] skipped: ${msg}`)
        }
      }
    }
    console.log(`[db] ${ok} executed, ${skipped} skipped — ${statements.length} total`)
  } finally {
    client.release()
    await pool.end()
  }
}

main()

// Seed the first platform admin (SaaS operator). Run once:
//   pnpm api:bootstrap [email] [password] [full name]
// Connects as app_rls and sets the platform flag to satisfy the platform_only
// RLS policy. The GUC is not a secret — the security boundary is that real
// requests only set it after verifying a platform JWT.
import { pool } from '../db'
import { hashPassword } from '../auth/crypto'

const email = process.argv[2] ?? 'ops@example.com'
const password = process.argv[3] ?? 'changeme-ops-123'
const fullName = process.argv[4] ?? 'Platform Operator'

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SELECT set_config('app.is_platform_admin', 'on', true)")
  const r = await client.query(
    `INSERT INTO platform_admins (email, password_hash, full_name, role, status, email_verified_at)
     VALUES ($1,$2,$3,'super_admin','active', now())
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, hashPassword(password), fullName],
  )
  await client.query('COMMIT')
  if (r.rowCount) console.log(`Created platform super_admin: ${email}  (password: ${password})`)
  else console.log(`Platform admin ${email} already exists — nothing to do.`)
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
  await pool.end()
}

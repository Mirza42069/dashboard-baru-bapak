import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../env'

// Passwords: scrypt (stdlib, no native build). Format: scrypt$<saltHex>$<hashHex>.
export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const h = scryptSync(pw, salt, 64)
  return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false
  const [alg, saltHex, hHex] = stored.split('$')
  if (alg !== 'scrypt' || !saltHex || !hHex) return false
  const expected = Buffer.from(hHex, 'hex')
  const actual = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Refresh tokens: opaque random, stored as sha256 hash (never the raw value).
export function newRefreshToken() {
  const raw = randomBytes(32).toString('hex')
  return { raw, hash: hashRefresh(raw) }
}
export const hashRefresh = (raw: string) => createHash('sha256').update(raw).digest('hex')

// Access tokens: short-lived JWT.
export type AccessClaims =
  | { typ: 'tenant'; sub: string; tid: string; sid: string }
  | { typ: 'platform'; sub: string; sid: string; role: string }

export const signAccess = (claims: AccessClaims) =>
  jwt.sign(claims, env.JWT_SECRET, { expiresIn: env.ACCESS_TTL_S })

export const verifyAccess = (token: string) => jwt.verify(token, env.JWT_SECRET) as AccessClaims

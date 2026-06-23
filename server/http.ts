import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodType } from 'zod'
import type { Ctx } from './db'

export type Authed = Request & {
  id: string
  ctx: Ctx
  user?: { id: string; tid: string; sid: string }
  admin?: { id: string; sid: string; role: string }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { field: string; issue: string }[],
  ) {
    super(message)
  }
}

export const errors = {
  badRequest: (m: string, d?: any) => new ApiError(400, 'BAD_REQUEST', m, d),
  unauth: (m = 'Authentication required.') => new ApiError(401, 'UNAUTHENTICATED', m),
  forbidden: (m = 'Forbidden.') => new ApiError(403, 'FORBIDDEN', m),
  notFound: (m = 'Not found.') => new ApiError(404, 'NOT_FOUND', m),
  conflict: (m: string, d?: any) => new ApiError(409, 'CONFLICT', m, d),
  unprocessable: (m: string, d?: any) => new ApiError(422, 'UNPROCESSABLE', m, d),
}

export const asyncHandler =
  (fn: (req: Authed, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req as Authed, res, next)).catch(next)

// Aggregate all zod issues into details[] (don't fail on the first field).
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data)
  if (!r.success) {
    throw errors.unprocessable(
      'One or more fields are invalid.',
      r.error.issues.map((i) => ({ field: i.path.join('.') || '(root)', issue: i.message })),
    )
  }
  return r.data
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const request_id = (req as Authed).id
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details, request_id } })
  }
  // Postgres unique violation -> 409 without leaking which row (RLS may hide it).
  if (err?.code === '23505') {
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'Resource already exists.', request_id } })
  }
  // Malformed UUID (or other bad literal) in a path/param -> treat as not found.
  if (err?.code === '22P02') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.', request_id } })
  }
  // Raised by trigger / RAISE EXCEPTION (e.g. baseline weight check).
  if (err?.code === 'P0001') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, request_id } })
  }
  console.error(`[${request_id}]`, err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error.', request_id } })
}

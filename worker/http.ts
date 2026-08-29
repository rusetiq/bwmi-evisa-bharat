import { z } from 'zod'
import type { Context } from 'hono'
import type { AppEnv } from './types'

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly fields?: Record<string, string>) {
    super(message)
    this.name = 'HttpError'
  }
}

export function ok<T>(c: Context<AppEnv>, data: T, status = 200) {
  return c.json({ ok: true as const, data }, status as 200)
}

export function fail(c: Context<AppEnv>, status: number, code: string, message: string, fields?: Record<string, string>) {
  return c.json({ ok: false as const, error: { code, message, ...(fields ? { fields } : {}) } }, status as 400)
}

export async function readJson<T>(c: Context<AppEnv>, schema: z.ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Send a valid JSON request.')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw validationError(parsed.error)
  return parsed.data
}

export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.length ? issue.path.join('.') : 'form'
    if (!fields[path]) fields[path] = issue.message
  }
  return new HttpError(422, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.', fields)
}

export function notFound(message = 'We could not find that application.') {
  return new HttpError(404, 'NOT_FOUND', message)
}

export function now() { return new Date().toISOString() }

export function parseDate(value: string | undefined | null) {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : new Date(timestamp)
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function sanitizeText(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

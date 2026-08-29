import { Hono } from 'hono'
import { ok, readJson } from '../http'
import type { AppEnv } from '../types'
import { eligibilitySchema } from '../validation'
import { checkEligibility } from '../services/eligibility'

export const eligibilityRoutes = new Hono<AppEnv>()

eligibilityRoutes.post('/', async (c) => ok(c, await checkEligibility(c.env.DB, await readJson(c, eligibilitySchema))))

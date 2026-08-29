import { Hono } from 'hono'
import { ok, readJson } from '../http'
import type { AppEnv } from '../types'
import { applicationPatchSchema, createApplicationSchema, findApplicationSchema } from '../validation'
import { createApplication, findApplication, getApplication, getDashboard, submitApplication, updateApplication } from '../services/applications'

export const applicationRoutes = new Hono<AppEnv>()

applicationRoutes.post('/find', async (c) => ok(c, await findApplication(c.env.DB, await readJson(c, findApplicationSchema))))

applicationRoutes.post('/', async (c) => ok(c, await createApplication(c.env.DB, await readJson(c, createApplicationSchema)), 201))

applicationRoutes.get('/:id/dashboard', async (c) => ok(c, await getDashboard(c.env.DB, c.req.param('id'))))

applicationRoutes.get('/:id', async (c) => ok(c, await getApplication(c.env.DB, c.req.param('id'))))

applicationRoutes.patch('/:id', async (c) => ok(c, await updateApplication(c.env.DB, c.req.param('id'), await readJson(c, applicationPatchSchema))))

applicationRoutes.post('/:id/submit', async (c) => ok(c, await submitApplication(c.env.DB, c.req.param('id'))))

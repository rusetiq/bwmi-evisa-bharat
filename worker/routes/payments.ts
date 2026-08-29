import { Hono } from 'hono'
import { ok, readJson } from '../http'
import type { AppEnv } from '../types'
import { paymentSchema } from '../validation'
import { getPaymentForApplication, simulatePayment } from '../services/payments'

export const paymentRoutes = new Hono<AppEnv>()

paymentRoutes.post('/applications/:id/payments', async (c) => ok(c, await simulatePayment(c.env.DB, c.req.param('id'), await readJson(c, paymentSchema))))

paymentRoutes.get('/applications/:id/payment', async (c) => ok(c, await getPaymentForApplication(c.env.DB, c.req.param('id'))))

import type { AppEnv } from '../types'
import { createNotificationStatement, getNotifications, parseNotifications } from '../db/queries'
import { now } from '../http'

type Database = AppEnv['Bindings']['DB']

export async function listNotifications(db: Database, applicationId: number) {
  return parseNotifications(await getNotifications(db, applicationId))
}

export function notificationStatement(db: Database, applicationId: number, type: string, title: string, message: string, createdAt = now()) {
  return createNotificationStatement(db, applicationId, type, title, message, createdAt)
}

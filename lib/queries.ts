import "server-only"

import { db } from "@/lib/db"
import { staff, timeAdjustments, timeEntries, timeOffRequests, user } from "@/lib/db/schema"
import { and, desc, eq, gte, getTableColumns, lte, or, isNull } from "drizzle-orm"

/** Todos os colaboradores (uso admin). */
export async function listStaff() {
  return db
    .select({ ...getTableColumns(staff), email: user.email })
    .from(staff)
    .leftJoin(user, eq(staff.userId, user.id))
    .orderBy(desc(staff.createdAt))
}

export async function getTimeAdjustments(staffId: number) {
  return db.select().from(timeAdjustments).where(eq(timeAdjustments.staffId, String(staffId)))
}

export async function getAdjustmentMinutes(staffId: number, sinceISO?: string, untilISO?: string) {
  const conditions = [eq(timeAdjustments.staffId, String(staffId))]
  if (sinceISO && untilISO) conditions.push(or(isNull(timeAdjustments.workDate), and(gte(timeAdjustments.workDate, sinceISO), lte(timeAdjustments.workDate, untilISO))) as any)
  const rows = await db.select().from(timeAdjustments).where(and(...conditions))
  return rows.reduce((total, row) => total + row.minutes, 0)
}

/** Um colaborador pelo userId. */
export async function getStaffByUserId(userId: string) {
  const rows = await db.select().from(staff).where(eq(staff.userId, userId)).limit(1)
  return rows[0] ?? null
}

/** Registros de um colaborador desde uma data (YYYY-MM-DD). */
export async function getEntriesForUser(userId: string, sinceISO: string) {
  return db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), gte(timeEntries.workDate, sinceISO)))
    .orderBy(desc(timeEntries.workDate))
}

/** Registro de um dia específico. */
export async function getTimeOffRequestsForUser(userId: string) {
  const member = await getStaffByUserId(userId)
  if (!member) return []
  return db.select().from(timeOffRequests).where(eq(timeOffRequests.staffId, member.id)).orderBy(desc(timeOffRequests.workDate), desc(timeOffRequests.createdAt))
}

export async function getPendingTimeOffRequests() {
  return db.select({ request: timeOffRequests, memberName: staff.name, memberUserId: staff.userId })
    .from(timeOffRequests)
    .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
    .where(eq(timeOffRequests.status, "pending"))
    .orderBy(timeOffRequests.workDate)
}

export async function getTimeOffRequestsForAdmin() {
  return db.select({ request: timeOffRequests, memberName: staff.name, memberUserId: staff.userId })
    .from(timeOffRequests)
    .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
    .orderBy(desc(timeOffRequests.createdAt))
}

export async function getEntryForDay(userId: string, workDate: string) {
  const rows = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.workDate, workDate)))
    .limit(1)
  return rows[0] ?? null
}

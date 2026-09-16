"use server"

import { db } from "@/lib/db"
import { staff, timeAdjustments, timeOffRequests } from "@/lib/db/schema"
import { getCurrentStaff, getCurrentUserId, requireAdmin } from "@/lib/session"
import { scheduledMinutesForStaff } from "@/lib/time-utils"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createTimeOffRequest(formData: FormData) {
  const member = await getCurrentStaff()
  if (!member || member.role !== "employee") return { error: "Acesso não autorizado." }
  const workDate = String(formData.get("workDate") ?? "")
  const requestType = formData.get("requestType") === "partial" ? "partial" : "full_day"
  const reason = String(formData.get("reason") ?? "").trim()
  const hours = Math.max(0, Number(formData.get("hours") ?? 0) || 0)
  const minutes = Math.min(59, Math.max(0, Number(formData.get("minutes") ?? 0) || 0))
  const requestedMinutes = requestType === "full_day" ? 0 : hours * 60 + minutes
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate) || !reason) return { error: "Informe a data e o motivo." }
  if (requestType === "partial" && requestedMinutes <= 0) return { error: "Informe quantas horas serão compensadas." }
  await db.insert(timeOffRequests).values({ id: crypto.randomUUID(), staffId: member.id, requestedByUserId: member.userId, workDate, requestType, minutes: requestedMinutes, reason })
  revalidatePath("/painel")
  revalidatePath("/admin")
  return { success: true }
}

export async function reviewTimeOffRequest(formData: FormData) {
  const admin = await requireAdmin()
  const id = String(formData.get("requestId") ?? "")
  const status = formData.get("status") === "approved" ? "approved" : "rejected"
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null
  const request = (await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1))[0]
  if (!request) return { error: "Solicitação não encontrada." }
  let minutes = request.minutes
  if (status === "approved" && request.requestType === "full_day") {
    const member = (await db.select().from(staff).where(eq(staff.id, request.staffId)).limit(1))[0]
    minutes = member ? scheduledMinutesForStaff(member, request.workDate) : 0
  }
  await db.update(timeOffRequests).set({ status, minutes, reviewNote, reviewedByUserId: admin.userId, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(timeOffRequests.id, id))
  const adjustmentId = `time-off-${request.id}`
  if (status === "approved" && minutes > 0) {
    await db.insert(timeAdjustments).values({ id: adjustmentId, staffId: String(request.staffId), minutes: -minutes, workDate: request.workDate, description: `Compensação aprovada em ${request.workDate}: ${request.reason}` }).onConflictDoUpdate({ target: timeAdjustments.id, set: { staffId: String(request.staffId), minutes: -minutes, workDate: request.workDate, description: `Compensação aprovada em ${request.workDate}: ${request.reason}` } })
  } else {
    await db.delete(timeAdjustments).where(eq(timeAdjustments.id, adjustmentId))
  }
  revalidatePath("/admin")
  revalidatePath("/painel")
  return { success: true }
}

export async function reviewTimeOffRequestWithState(_state: { success?: boolean; error?: string }, formData: FormData) {
  "use server"
  return reviewTimeOffRequest(formData)
}

export async function deleteTimeOffRequest(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("requestId") ?? "")
  const request = (await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1))[0]
  if (!request) return { error: "Solicitação não encontrada." }
  if (request.status === "approved") await db.delete(timeAdjustments).where(eq(timeAdjustments.id, `time-off-${request.id}`))
  await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id))
  revalidatePath("/admin")
  revalidatePath("/painel")
  return { success: true }
}

export async function updateTimeOffRequestWithState(_state: { success?: boolean; error?: string }, formData: FormData) {
  "use server"
  return updateTimeOffRequest(formData)
}

export async function cancelTimeOffRequest(formData: FormData) {
  const userId = await getCurrentUserId()
  const id = String(formData.get("requestId") ?? "")
  const request = (await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1))[0]
  if (!request || request.requestedByUserId !== userId || request.status !== "pending") return { error: "Solicitação não pode ser cancelada." }
  await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id))
  revalidatePath("/painel")
  return { success: true }
}

export async function updateTimeOffRequest(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("requestId") ?? "")
  const reason = String(formData.get("reason") ?? "").trim()
  const workDate = String(formData.get("workDate") ?? "")
  const requestType = formData.get("requestType") === "partial" ? "partial" : "full_day"
  const status = ["pending", "approved", "rejected"].includes(String(formData.get("status"))) ? String(formData.get("status")) : "pending"
  const requestedMinutes = Math.max(0, Number(formData.get("minutes") ?? 0) || 0)
  if (!id || !reason || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return { error: "Informe data e motivo válidos." }
  const request = (await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1))[0]
  if (!request) return { error: "Solicitação não encontrada." }
  let minutes = requestType === "full_day" ? 0 : requestedMinutes
  if (status === "approved" && requestType === "full_day") {
    const member = (await db.select().from(staff).where(eq(staff.id, request.staffId)).limit(1))[0]
    minutes = member ? scheduledMinutesForStaff(member, workDate) : 0
  }
  await db.update(timeOffRequests).set({ workDate, requestType, minutes, reason, status, updatedAt: new Date(), reviewedAt: status === "pending" ? null : new Date() }).where(eq(timeOffRequests.id, id))
  const adjustmentId = `time-off-${id}`
  if (status === "approved" && minutes > 0) {
    await db.insert(timeAdjustments).values({ id: adjustmentId, staffId: String(request.staffId), minutes: -minutes, workDate, description: `Compensação aprovada em ${workDate}: ${reason}` }).onConflictDoUpdate({ target: timeAdjustments.id, set: { minutes: -minutes, workDate, description: `Compensação aprovada em ${workDate}: ${reason}` } })
  } else {
    await db.delete(timeAdjustments).where(eq(timeAdjustments.id, adjustmentId))
  }
  revalidatePath("/admin")
  revalidatePath("/painel")
  return { success: true }
}

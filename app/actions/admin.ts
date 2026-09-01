"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { staff, timeEntries } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { parseHHMM, TZ_OFFSET } from "@/lib/time-utils"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// ---------------------------------------------------------------------------
// Criar colaborador (cria conta Better Auth + perfil de staff)
// ---------------------------------------------------------------------------
export async function createEmployee(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const entryTime = String(formData.get("entryTime") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const exitTime = String(formData.get("exitTime") ?? "").trim() || null
  const satEntryTime = String(formData.get("satEntryTime") ?? "").trim() || null
  const satLunchStart = String(formData.get("satLunchStart") ?? "").trim() || null
  const satLunchEnd = String(formData.get("satLunchEnd") ?? "").trim() || null
  const satExitTime = String(formData.get("satExitTime") ?? "").trim() || null

  if (!name || !email || password.length < 8) {
    return { error: "Preencha nome, e-mail e uma senha de ao menos 8 caracteres." }
  }
  for (const [label, v] of [
    ["entrada", entryTime],
    ["início do almoço", lunchStart],
    ["fim do almoço", lunchEnd],
    ["saída", exitTime],
    ["entrada (sábado)", satEntryTime],
    ["início do almoço (sábado)", satLunchStart],
    ["fim do almoço (sábado)", satLunchEnd],
    ["saída (sábado)", satExitTime],
  ] as const) {
    if (v && parseHHMM(v) === null) {
      return { error: `Horário de ${label} inválido. Use o formato HH:MM.` }
    }
  }

  // O signUpEmail cria uma sessão para o novo usuário e, via plugin
  // nextCookies, sobrescreve o cookie de sessão do admin — o que o
  // deslogaria. Guardamos os cookies de sessão do admin antes e os
  // restauramos depois para manter o administrador logado.
  const cookieStore = await cookies()
  const adminAuthCookies = cookieStore
    .getAll()
    .filter((c) => c.name.includes("better-auth"))
    .map((c) => ({ name: c.name, value: c.value }))

  // Cria o usuário via Better Auth (hash de senha gerenciado pela lib).
  let userId: string
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    })
    userId = result.user.id
  } catch {
    return { error: "Não foi possível criar a conta. O e-mail já pode estar em uso." }
  }

  // Restaura a sessão do administrador (desfaz o login automático do novo
  // colaborador no navegador de quem está cadastrando).
  const isDev = process.env.NODE_ENV === "development"
  for (const c of adminAuthCookies) {
    cookieStore.set(c.name, c.value, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: isDev ? "none" : "lax",
    })
  }

  await db.insert(staff).values({
    userId,
    name,
    role: "employee",
    entryTime,
    lunchStart,
    lunchEnd,
    exitTime,
    satEntryTime,
    satLunchStart,
    satLunchEnd,
    satExitTime,
  })

  revalidatePath("/admin")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Atualizar jornada / status do colaborador
// ---------------------------------------------------------------------------
export async function updateEmployee(formData: FormData) {
  await requireAdmin()

  const staffId = Number(formData.get("staffId"))
  const name = String(formData.get("name") ?? "").trim()
  const entryTime = String(formData.get("entryTime") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const exitTime = String(formData.get("exitTime") ?? "").trim() || null
  const satEntryTime = String(formData.get("satEntryTime") ?? "").trim() || null
  const satLunchStart = String(formData.get("satLunchStart") ?? "").trim() || null
  const satLunchEnd = String(formData.get("satLunchEnd") ?? "").trim() || null
  const satExitTime = String(formData.get("satExitTime") ?? "").trim() || null
  const active = formData.get("active") === "on" || formData.get("active") === "true"

  if (!staffId || !name) return { error: "Dados inválidos." }
  for (const v of [
    entryTime,
    lunchStart,
    lunchEnd,
    exitTime,
    satEntryTime,
    satLunchStart,
    satLunchEnd,
    satExitTime,
  ]) {
    if (v && parseHHMM(v) === null) {
      return { error: "Horário inválido. Use o formato HH:MM." }
    }
  }

  await db
    .update(staff)
    .set({
      name,
      entryTime,
      lunchStart,
      lunchEnd,
      exitTime,
      satEntryTime,
      satLunchStart,
      satLunchEnd,
      satExitTime,
      active,
    })
    .where(eq(staff.id, staffId))

  revalidatePath("/admin")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Editar registro de ponto (SOMENTE admin)
// ---------------------------------------------------------------------------
function combineDateTime(workDate: string, hhmm: string | null): Date | null {
  if (!hhmm) return null
  const minutes = parseHHMM(hhmm)
  if (minutes === null) return null
  const h = String(Math.floor(minutes / 60)).padStart(2, "0")
  const mm = String(minutes % 60).padStart(2, "0")
  // Interpreta o horário digitado como horário de Brasília (fixo -03:00),
  // independentemente do fuso do servidor (que roda em UTC).
  return new Date(`${workDate}T${h}:${mm}:00${TZ_OFFSET}`)
}

export async function updateTimeEntry(formData: FormData) {
  await requireAdmin()

  const employeeUserId = String(formData.get("employeeUserId") ?? "")
  const workDate = String(formData.get("workDate") ?? "")
  const clockIn = String(formData.get("clockIn") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const clockOut = String(formData.get("clockOut") ?? "").trim() || null

  if (!employeeUserId || !workDate) return { error: "Dados inválidos." }
  for (const v of [clockIn, lunchStart, lunchEnd, clockOut]) {
    if (v && parseHHMM(v) === null) {
      return { error: "Horário inválido. Use o formato HH:MM." }
    }
  }

  const values = {
    clockIn: combineDateTime(workDate, clockIn),
    lunchStart: combineDateTime(workDate, lunchStart),
    lunchEnd: combineDateTime(workDate, lunchEnd),
    clockOut: combineDateTime(workDate, clockOut),
    editedByAdmin: true,
  }

  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, employeeUserId),
        eq(timeEntries.workDate, workDate),
      ),
    )
    .limit(1)

  if (existing[0]) {
    await db
      .update(timeEntries)
      .set(values)
      .where(eq(timeEntries.id, existing[0].id))
  } else {
    await db
      .insert(timeEntries)
      .values({ userId: employeeUserId, workDate, ...values })
  }

  revalidatePath("/admin")
  return { success: true }
}

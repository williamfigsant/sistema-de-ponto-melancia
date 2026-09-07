"use server"

import { db } from "@/lib/db"
import { timeEntries } from "@/lib/db/schema"
import { getCurrentStaff } from "@/lib/session"
import { todayISO } from "@/lib/time-utils"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type PunchType = "clockIn" | "lunchStart" | "lunchEnd" | "clockOut"

/**
 * Registra um evento de ponto em tempo real para o colaborador logado.
 * O horário é gravado pelo servidor (não pode ser informado pelo cliente).
 */
type Location = { latitude: number; longitude: number; accuracy: number }

function distanceInMeters(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const earthRadius = 6371000
  const radians = (value: number) => (value * Math.PI) / 180
  const dLat = radians(toLat - fromLat)
  const dLon = radians(toLon - fromLon)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLon / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function punch(type: PunchType, location?: Location) {
  const profile = await getCurrentStaff()
  if (!profile) return { error: "Perfil não encontrado." }
  if (!profile.active) return { error: "Colaborador inativo." }
  const storeLatitude = profile.storeLatitude ? Number(profile.storeLatitude) : null
  const storeLongitude = profile.storeLongitude ? Number(profile.storeLongitude) : null
  const radius = Number(profile.storeRadiusMeters ?? 100)
  if (storeLatitude === null || storeLongitude === null || !Number.isFinite(storeLatitude) || !Number.isFinite(storeLongitude)) {
    return { error: "A localização da loja ainda não foi configurada. O administrador precisa informar latitude e longitude antes do registro." }
  }
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return { error: "Ative a localização do dispositivo para registrar o ponto." }
  if (!Number.isFinite(location.accuracy) || location.accuracy > 100) return { error: "A precisão do GPS está baixa. Tente novamente em um local com melhor sinal." }
  if (!Number.isFinite(radius) || radius < 10) return { error: "O raio permitido da loja está configurado incorretamente." }
  const distance = distanceInMeters(storeLatitude, storeLongitude, location.latitude, location.longitude)
  if (distance > radius) return { error: `Check-in bloqueado: você está a aproximadamente ${Math.round(distance)} m da loja. O limite é ${radius} m.` }

  const workDate = todayISO()
  const now = new Date()

  // Busca ou cria o registro do dia.
  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(eq(timeEntries.userId, profile.userId), eq(timeEntries.workDate, workDate)),
    )
    .limit(1)

  let entry = existing[0]
  if (!entry) {
    const inserted = await db
      .insert(timeEntries)
      .values({ userId: profile.userId, workDate })
      .returning()
    entry = inserted[0]
  }

  // Validação de ordem e de não sobrescrever registros já feitos.
  const guards: Record<PunchType, () => string | null> = {
    clockIn: () => (entry.clockIn ? "Entrada já registrada hoje." : null),
    lunchStart: () => {
      if (!entry.clockIn) return "Registre a entrada primeiro."
      if (entry.lunchStart) return "Saída para o almoço já registrada."
      return null
    },
    lunchEnd: () => {
      if (!entry.lunchStart) return "Registre a saída para o almoço primeiro."
      if (entry.lunchEnd) return "Retorno do almoço já registrado."
      return null
    },
    clockOut: () => {
      if (!entry.clockIn) return "Registre a entrada primeiro."
      if (entry.lunchStart && !entry.lunchEnd)
        return "Registre o retorno do almoço primeiro."
      if (entry.clockOut) return "Saída já registrada hoje."
      return null
    },
  }

  const error = guards[type]()
  if (error) return { error }

  await db
    .update(timeEntries)
    .set({ [type]: now })
    .where(eq(timeEntries.id, entry.id))

  revalidatePath("/painel")
  return { success: true }
}

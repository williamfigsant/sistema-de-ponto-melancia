import type { Staff, TimeEntry } from "@/lib/db/schema"

/**
 * Fuso horário oficial da loja (Brasília). O Brasil não adota mais horário
 * de verão desde 2019, então o deslocamento é fixo em -03:00. Usamos isto
 * tanto para exibir horários (independente do fuso do servidor, que roda em
 * UTC) quanto para interpretar horários digitados pelo admin.
 */
export const TIMEZONE = "America/Sao_Paulo"
export const TZ_OFFSET = "-03:00"

/** Converte "HH:MM" em minutos desde meia-noite. Retorna null se inválido. */
export function parseHHMM(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** Formata minutos totais em "Hh MMmin", com sinal opcional. */
export function formatMinutes(totalMinutes: number, withSign = false): string {
  const sign = totalMinutes < 0 ? "-" : withSign ? "+" : ""
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}h ${String(m).padStart(2, "0")}min`
}

/** Formata um Date em "HH:MM" sempre no fuso de Brasília. */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "--:--"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  })
}

/**
 * Formata um Date como "HH:MM" (fuso de Brasília) para uso em <input type="time">.
 * Retorna "" quando não há valor. Evita divergência de hidratação, pois não
 * depende do fuso do runtime (servidor vs. navegador).
 */
export function toTimeInputValue(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  })
}

function diffMinutes(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0
  return (end.getTime() - start.getTime()) / 60000
}

/** Aplica a tolerância legal de até 5 min por marcação e 10 min no dia. */
export function calcularToleranciaArt58({
  marcacoes,
  saldoBruto,
}: {
  marcacoes: Array<{ nome: string; prevista: number; realizada: number }>
  saldoBruto: number
}): {
  variacoesPorMarcacao: Array<{ nome: string; variacao: number; dentroDoLimite: boolean }>
  totalVariacoes: number
  minutosTolerados: number
  minutosComputaveis: number
  saldoFinal: number
} {
  const variacoesPorMarcacao = marcacoes.map(({ nome, prevista, realizada }) => {
    const variacao = realizada - prevista
    return { nome, variacao, dentroDoLimite: Math.abs(variacao) <= 5 }
  })
  const totalVariacoes = variacoesPorMarcacao.reduce((total, item) => total + Math.abs(item.variacao), 0)
  const podeTolerar = variacoesPorMarcacao.every((item) => item.dentroDoLimite) && totalVariacoes <= 10
  const entradaVariacao = variacoesPorMarcacao.find((item) => item.nome === "Entrada")?.variacao ?? 0
  const saidaVariacao = variacoesPorMarcacao.find((item) => item.nome === "Saída")?.variacao ?? 0
  // A tolerância deve atuar sobre a duração líquida, nunca sobre a soma das marcações.
  // Ex.: 09:03–18:03 mantém a mesma duração e não altera o saldo.
  const variacaoDaDuracao = saidaVariacao - entradaVariacao
  const minutosTolerados = podeTolerar ? Math.abs(variacaoDaDuracao) : 0
  const minutosComputaveis = podeTolerar ? 0 : Math.abs(variacaoDaDuracao)
  return { variacoesPorMarcacao, totalVariacoes, minutosTolerados, minutosComputaveis, saldoFinal: podeTolerar ? saldoBruto - variacaoDaDuracao : saldoBruto }
}

export type OccurrenceType = "normal" | "holiday" | "justified_absence" | "unjustified_absence" | "medical_certificate" | "compensatory_day_off" | "early_departure" | "compensatory_early_departure"

export const occurrenceLabels: Record<OccurrenceType, string> = {
  normal: "",
  holiday: "Feriado",
  justified_absence: "Falta justificada",
  unjustified_absence: "Falta injustificada",
  medical_certificate: "Atestado",
  compensatory_day_off: "Folga compensatória",
  early_departure: "Saída antecipada",
  compensatory_early_departure: "Saída antecipada compensatória",
}

export interface DayCalculation {
  workedMinutes: number // minutos trabalhados (descontando almoço)
  lunchMinutes: number // minutos de almoço
  scheduledMinutes: number // jornada cadastrada (descontando almoço)
  overtimeMinutes: number // saldo positivo (horas extras)
  deficitMinutes: number // saldo negativo (faltou)
  balanceMinutes: number // workedMinutes - scheduledMinutes
  complete: boolean // registro completo (entrada + saída)
  variacoesPorMarcacao: Array<{ nome: string; variacao: number; dentroDoLimite: boolean }>
  totalVariacoes: number
  minutosTolerados: number
  minutosComputaveis: number
  intervalo: { realizado: number; previsto: number; diferenca: number; excedente: number; status: "SEM_INTERVALO" | "REDUZIDO" | "REGULAR" | "SUPERIOR_AO_PREVISTO" }
  alertas: string[]
  regraAplicada: { regra: string; versao: string; origem: string; dataAplicacao: string }
}

/** Retorna true se a data YYYY-MM-DD cai em um sábado. */
export function isSaturdayISO(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number)
  // Meio-dia UTC evita virar o dia por causa do fuso.
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() === 6
}

export interface DaySchedule {
  entry: string | null
  lunchStart: string | null
  lunchEnd: string | null
  exit: string | null
}

/**
 * Jornada aplicável a um dia. Aos sábados usa a jornada de sábado quando
 * cadastrada; caso contrário, cai para a jornada padrão (seg-sex).
 */
export function scheduleForDay(member: Staff, workDate?: string): DaySchedule {
  const isSat = workDate ? isSaturdayISO(workDate) : false
  if (isSat && member.satEntryTime && member.satExitTime) {
    return {
      entry: member.satEntryTime,
      lunchStart: member.satLunchStart,
      lunchEnd: member.satLunchEnd,
      exit: member.satExitTime,
    }
  }
  return {
    entry: member.entryTime,
    lunchStart: member.lunchStart,
    lunchEnd: member.lunchEnd,
    exit: member.exitTime,
  }
}

/**
 * Jornada cadastrada em minutos, descontando o almoço previsto.
 * Ex.: 09:00 -> 18:00 com almoço 12:00-13:00 = 8h.
 * Passe workDate para aplicar a jornada de sábado quando for o caso.
 */
export function scheduledMinutesForStaff(member: Staff, workDate?: string): number {
  const sched = scheduleForDay(member, workDate)
  const entry = parseHHMM(sched.entry)
  const exit = parseHHMM(sched.exit)
  if (entry === null || exit === null) return 0
  let total = exit - entry
  const ls = parseHHMM(sched.lunchStart)
  const le = parseHHMM(sched.lunchEnd)
  if (ls !== null && le !== null && le > ls) {
    total -= le - ls
  }
  return Math.max(0, total)
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null
  return typeof value === "string" ? new Date(value) : value
}

/**
 * Calcula horas trabalhadas de um registro, descontando o almoço,
 * e compara com a jornada cadastrada do colaborador.
 */
export function calculateDay(entry: TimeEntry, member: Staff): DayCalculation {
  const clockIn = toDate(entry.clockIn)
  const clockOut = toDate(entry.clockOut)
  const lunchStart = toDate(entry.lunchStart)
  const lunchEnd = toDate(entry.lunchEnd)

  const lunchMinutes = Math.max(0, diffMinutes(lunchStart, lunchEnd))
  const scheduled = scheduleForDay(member, entry.workDate)
  const previstoInicioAlmoco = parseHHMM(scheduled.lunchStart)
  const previstoFimAlmoco = parseHHMM(scheduled.lunchEnd)
  const intervaloPrevisto = previstoInicioAlmoco !== null && previstoFimAlmoco !== null ? Math.max(0, previstoFimAlmoco - previstoInicioAlmoco) : 0
  const intervaloDiferenca = lunchMinutes - intervaloPrevisto
  const intervaloStatus = !lunchStart || !lunchEnd ? "SEM_INTERVALO" as const : intervaloDiferenca < -5 ? "REDUZIDO" as const : intervaloDiferenca > 0 ? "SUPERIOR_AO_PREVISTO" as const : "REGULAR" as const
  const alertas = intervaloStatus === "REDUZIDO" ? ["ALERTA_DE_INTERVALO_IRREGULAR"] : intervaloStatus === "SUPERIOR_AO_PREVISTO" ? ["INTERVALO_SUPERIOR_AO_PREVISTO"] : []
  const grossMinutes = Math.max(0, diffMinutes(clockIn, clockOut))
  const workedMinutes = Math.max(0, grossMinutes - lunchMinutes)

  const scheduledMinutes = scheduledMinutesForStaff(member, entry.workDate)
  const occurrence = entry.occurrenceType ?? "normal"
  const complete = Boolean(clockIn && clockOut) || occurrence !== "normal"
  const absenceMinutes = occurrence === "unjustified_absence" || occurrence === "compensatory_day_off" ? scheduledMinutes : 0
  const creditedMinutes = occurrence === "medical_certificate" ? Math.min(scheduledMinutes, Number(entry.occurrenceNote?.match(/([0-9]+)\s*h/i)?.[1] ?? 0) * 60) : 0
  const scheduledIn = parseHHMM(scheduled.entry)
  const scheduledOut = parseHHMM(scheduled.exit)
  const actualIn = clockIn ? parseHHMM(formatTime(clockIn)) : null
  const actualOut = clockOut ? parseHHMM(formatTime(clockOut)) : null
  const saldoBruto = workedMinutes + creditedMinutes - scheduledMinutes
  const tolerancia = scheduledIn !== null && scheduledOut !== null && actualIn !== null && actualOut !== null
    ? calcularToleranciaArt58({ marcacoes: [{ nome: "Entrada", prevista: scheduledIn, realizada: actualIn }, { nome: "Saída", prevista: scheduledOut, realizada: actualOut }], saldoBruto })
    : null
  const excedenteIntervalo = Math.max(0, intervaloDiferenca)
  const earlyDepartureMinutes = occurrence === "early_departure" || occurrence === "compensatory_early_departure" ? Math.max(0, scheduledMinutes - workedMinutes) : 0
  // workedMinutes já desconta o intervalo real. Não subtrair o excedente novamente.
  const balanceMinutes = occurrence === "holiday" ? 0 : complete ? (tolerancia?.saldoFinal ?? saldoBruto) - earlyDepartureMinutes : -absenceMinutes

  return {
    workedMinutes,
    lunchMinutes,
    scheduledMinutes,
    overtimeMinutes: balanceMinutes > 0 ? balanceMinutes : 0,
    deficitMinutes: balanceMinutes < 0 ? -balanceMinutes : 0,
    balanceMinutes,
    complete,
    variacoesPorMarcacao: tolerancia?.variacoesPorMarcacao ?? [],
    totalVariacoes: tolerancia?.totalVariacoes ?? 0,
    minutosTolerados: tolerancia?.minutosTolerados ?? 0,
    minutosComputaveis: tolerancia?.minutosComputaveis ?? 0,
    intervalo: { realizado: lunchMinutes, previsto: intervaloPrevisto, diferenca: intervaloDiferenca, excedente: excedenteIntervalo, status: intervaloStatus },
    alertas,
    regraAplicada: { regra: "CLT Art. 58, §1º e intervalo intrajornada", versao: "2026.1", origem: "CLT/TST — parametrização padrão", dataAplicacao: new Date().toISOString() },
  }
}

/** Agrega vários dias em totais. */
export function aggregateDays(
  entries: TimeEntry[],
  member: Staff,
): {
  totalWorked: number
  totalOvertime: number
  totalDeficit: number
  totalBalance: number
  daysCompleted: number
} {
  let totalWorked = 0
  let totalOvertime = 0
  let totalDeficit = 0
  let daysCompleted = 0

  for (const entry of entries) {
    const calc = calculateDay(entry, member)
    if (!calc.complete) continue
    totalWorked += calc.workedMinutes
    totalOvertime += calc.overtimeMinutes
    totalDeficit += calc.deficitMinutes
    daysCompleted += 1
  }

  return {
    totalWorked,
    totalOvertime,
    totalDeficit,
    totalBalance: totalOvertime - totalDeficit,
    daysCompleted,
  }
}

/** Data de hoje em formato YYYY-MM-DD, no fuso de Maricá/Rio de Janeiro. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Primeiro dia do mês corrente no fuso de Maricá/Rio de Janeiro. */
export function currentMonthStartISO(): string {
  const today = todayISO()
  return `${today.slice(0, 7)}-01`
}

/** Data/hora atual formatada para emissão de relatórios. */
export function nowBR(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date())
}

/** Formata YYYY-MM-DD em "dd/mm/aaaa". */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

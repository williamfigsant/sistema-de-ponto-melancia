import type { Staff, TimeAdjustment, TimeEntry, TimeOffRequest } from "@/lib/db/schema"
import { calculateDay, formatDateBR, formatMinutes, formatTime, isBankUsageAdjustment } from "@/lib/time-utils"

export function MonthlyCalculationReport({ entries, adjustments, timeOffRequests, member, year, month, emittedAt }: { entries: TimeEntry[]; adjustments: TimeAdjustment[]; timeOffRequests: TimeOffRequest[]; member: Staff; year: number; month: number; emittedAt: string }) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDate = new Map(entries.map((entry) => [String(entry.workDate).slice(0, 10), entry]))
  const timeOffByDate = new Map(timeOffRequests.filter((request) => request.status === "approved").map((request) => [String(request.workDate).slice(0, 10), request]))
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  const label = `${monthNames[month - 1] ?? ""} de ${year}`
  const rows = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
    const entry = byDate.get(date)
    const dailyDebits = adjustments
      .filter((adjustment) => String(adjustment.workDate ?? "").slice(0, 10) === date && adjustment.minutes < 0 && isBankUsageAdjustment(adjustment))
      .reduce((sum, adjustment) => sum + Math.abs(adjustment.minutes), 0)
    const calc = entry ? calculateDay(entry, member) : null
    return { date, entry, calc, dailyDebits, bankUsage: Math.max(calc?.usedFromBankMinutes ?? 0, dailyDebits), timeOff: timeOffByDate.get(date) }
  })
  const complete = rows.filter((row) => row.calc?.complete)
  const credit = complete.reduce((sum, row) => sum + Math.max(0, row.calc?.balanceMinutes ?? 0), 0)
  const debit = complete.reduce((sum, row) => sum + Math.max(0, Math.max(0, -(row.calc?.balanceMinutes ?? 0)) - row.dailyDebits), 0)
  const undatedBankUsage = adjustments.filter((adjustment) => !adjustment.workDate && isBankUsageAdjustment(adjustment)).reduce((sum, adjustment) => sum + Math.abs(adjustment.minutes), 0)
  const usedFromBank = rows.reduce((sum, row) => sum + row.bankUsage, undatedBankUsage)
  const net = credit - debit - usedFromBank
  const treatmentLabels: Record<string, string> = {
    normal: "Registro normal",
    unjustified_absence: "FI — Falta injustificada",
    justified_absence: "FJ — Falta justificada",
    medical_certificate: "AT — Atestado",
    compensatory_day_off: "FC — Folga compensatória",
    early_departure: "SA — Saída antecipada",
    compensatory_early_departure: "SAC — Saída antecipada compensatória",
    compensatory_late_entry: "Entrada compensada",
    holiday: "FER — Feriado",
  }

  return <section className="monthly-calculation-report" aria-label="Memória de cálculo mensal">
    <header className="monthly-report-header"><div><h1>MEMÓRIA DE CÁLCULO MENSAL</h1><p>Banco de horas e tratamento das marcações</p></div><div className="monthly-report-meta"><b>Competência</b><span>{label}</span><b>Emitido em</b><span>{emittedAt}</span></div></header>
    <div className="monthly-report-identity"><div><b>Empregador</b><span>{"Melancia Foto e Presentes"}</span></div><div><b>Colaborador</b><span>{member.name}</span></div><div><b>Jornada contratual</b><span>{member.entryTime ?? "--:--"} às {member.exitTime ?? "--:--"}</span></div></div>
    <table className="monthly-report-table"><thead><tr><th>Data</th><th>Marcações</th><th>Jornada prevista</th><th>Trabalhado</th><th>Crédito</th><th>Débito</th><th>Uso do banco</th><th>Tratamento / observação</th></tr></thead><tbody>{rows.map(({ date, entry, calc, dailyDebits, bankUsage, timeOff }) => {
      const rawBalance = calc?.balanceMinutes ?? 0
      const compensatedMinutes = calc && dailyDebits > 0 ? Math.min(calc.deficitMinutes, dailyDebits) : 0
      const balance = calc && dailyDebits > 0 && calc.deficitMinutes > 0 ? Math.max(0, rawBalance + compensatedMinutes) : rawBalance
      const timeOffLabel = timeOff ? (timeOff.requestType === "full_day" ? "FC — Folga" : "HC — Hora compensatória") : ""
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
      const dayLabel = weekday === 0 ? "DOM" : ""
      const occurrenceLabel = entry ? treatmentLabels[entry.occurrenceType] ?? "Registro normal" : ""
      const observation = timeOff ? `${dayLabel ? `${dayLabel} · ` : ""}${timeOffLabel}` : !entry ? `${dayLabel ? `${dayLabel} · ` : ""}Sem registro` : [dayLabel, occurrenceLabel, ...(calc?.alertas ?? []).map((alerta) => alerta === "INTERVALO_SUPERIOR_AO_PREVISTO" ? "Intervalo superior ao previsto" : alerta === "ALERTA_DE_INTERVALO_IRREGULAR" ? "Intervalo irregular" : alerta === "SABADO_JORNADA_NORMAL_4H" ? "Sábado: jornada normal de 4h" : alerta)].filter(Boolean).join(" · ")
      const bankNote = bankUsage > 0 ? `${formatMinutes(bankUsage)} utilizada do saldo acumulado` : ""
      return <tr key={date}><td>{formatDateBR(date)}</td><td>{entry?.occurrenceType === "compensatory_day_off" ? "Folga compensatória" : entry ? `${formatTime(entry.clockIn)} · ${formatTime(entry.lunchStart)}–${formatTime(entry.lunchEnd)} · ${formatTime(entry.clockOut)}` : "—"}</td><td>{calc ? formatMinutes(calc.scheduledMinutes) : "—"}</td><td>{calc?.complete ? formatMinutes(calc.workedMinutes) : "—"}</td><td>{balance > 0 ? formatMinutes(balance) : "—"}</td><td>{balance < 0 ? `-${formatMinutes(Math.abs(balance))}` : "—"}</td><td>{bankUsage > 0 ? `−${formatMinutes(bankUsage)}` : "—"}</td><td>{observation}{bankNote ? ` · ${bankNote}` : ""}{calc?.intervalo.excedente ? ` · excedente intervalo: ${calc.intervalo.excedente}min` : ""}</td></tr>
    })}</tbody></table>
    <div className="monthly-report-summary"><div><b>Créditos do mês</b><span>{formatMinutes(credit)}</span></div><div><b>Débitos de jornada</b><span>{formatMinutes(debit)}</span></div><div><b>Uso do banco</b><span>{usedFromBank > 0 ? `−${formatMinutes(usedFromBank)}` : formatMinutes(0)}</span></div><div><b>Saldo líquido</b><span className={net < 0 ? "negative" : "positive"}>{formatMinutes(net, true)}</span></div></div>
    <div className="monthly-report-rules"><b>Critérios aplicados:</b> variações de entrada e saída permanecem como auditoria; a tolerância do Art. 58 não se aplica ao excedente do intervalo; aos sábados, a jornada normal considerada é de 09h às 13h (4h); folgas compensatórias e lançamentos identificados como uso de banco são descontados do saldo acumulado, não tratados como débito diário.</div>
    <footer className="monthly-report-signatures"><span>Assinatura do colaborador</span><span>Assinatura do responsável</span></footer>
  </section>
}

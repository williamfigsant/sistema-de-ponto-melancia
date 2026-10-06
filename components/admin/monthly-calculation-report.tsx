import type { Staff, TimeAdjustment, TimeEntry, TimeOffRequest } from "@/lib/db/schema"
import { calculateDay, formatDateBR, formatMinutes, formatTime } from "@/lib/time-utils"

export function MonthlyCalculationReport({ entries, adjustments, timeOffRequests, member, year, month, emittedAt }: { entries: TimeEntry[]; adjustments: TimeAdjustment[]; timeOffRequests: TimeOffRequest[]; member: Staff; year: number; month: number; emittedAt: string }) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDate = new Map(entries.map((entry) => [entry.workDate, entry]))
  const timeOffByDate = new Map(timeOffRequests.filter((request) => request.status === "approved").map((request) => [request.workDate, request]))
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  const label = `${monthNames[month - 1] ?? ""} de ${year}`
  const rows = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
    const entry = byDate.get(date)
    const dailyDebits = adjustments.filter((adjustment) => adjustment.workDate === date && adjustment.minutes < 0).reduce((sum, adjustment) => sum + Math.abs(adjustment.minutes), 0)
    return { date, entry, calc: entry ? calculateDay(entry, member) : null, dailyDebits, timeOff: timeOffByDate.get(date) }
  })
  const complete = rows.filter((row) => row.calc?.complete)
  const credit = complete.reduce((sum, row) => sum + Math.max(0, row.calc?.balanceMinutes ?? 0), 0)
  const debit = complete.reduce((sum, row) => sum + Math.max(0, Math.max(0, -(row.calc?.balanceMinutes ?? 0)) - row.dailyDebits), 0)
  const net = credit - debit

  return <section className="monthly-calculation-report" aria-label="Memória de cálculo mensal">
    <header className="monthly-report-header"><div><h1>MEMÓRIA DE CÁLCULO MENSAL</h1><p>Banco de horas e tratamento das marcações</p></div><div className="monthly-report-meta"><b>Competência</b><span>{label}</span><b>Emitido em</b><span>{emittedAt}</span></div></header>
    <div className="monthly-report-identity"><div><b>Empregador</b><span>{"Melancia Foto e Presentes"}</span></div><div><b>Colaborador</b><span>{member.name}</span></div><div><b>Jornada contratual</b><span>{member.entryTime ?? "--:--"} às {member.exitTime ?? "--:--"}</span></div></div>
    <table className="monthly-report-table"><thead><tr><th>Data</th><th>Marcações</th><th>Jornada prevista</th><th>Trabalhado</th><th>Crédito</th><th>Débito</th><th>Tratamento / observação</th></tr></thead><tbody>{rows.map(({ date, entry, calc, dailyDebits, timeOff }) => { const balance = calc?.balanceMinutes ?? 0; const treatmentLabels: Record<string, string> = { normal: "Registro normal", unjustified_absence: "FI", justified_absence: "FJ", medical_certificate: "AT", compensatory_leave: "FC", early_departure: "SA", compensatory_early_departure: "SAC", holiday: "FER", day_off: "FC" }; const timeOffLabel = timeOff ? (timeOff.requestType === "full_day" ? "FC — Folga" : "HC — Hora comp.") : ""
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
      const dayLabel = weekday === 0 ? "DOM" : ""
      const observation = timeOff ? `${dayLabel ? `${dayLabel} · ` : ""}${timeOffLabel}` : !entry ? `${dayLabel ? `${dayLabel} · ` : ""}Sem registro` : calc?.alertas.length ? calc.alertas.map((alerta) => alerta === "INTERVALO_SUPERIOR_AO_PREVISTO" ? "Intervalo superior ao previsto" : alerta === "ALERTA_DE_INTERVALO_IRREGULAR" ? "Intervalo irregular" : alerta === "SABADO_JORNADA_NORMAL_4H" ? "Sábado: jornada normal considerada 09h–13h (4h); excedente lançado no banco" : alerta === "ENTRADA_COMPENSADA" ? "Entrada compensada: sem débito diário" : alerta).join("; ") : `${dayLabel ? `${dayLabel} · ` : ""}${treatmentLabels[entry.occurrenceType] ?? "Registro normal"}${entry.occurrenceType === "compensatory_early_departure" ? " · saída para compensar HE" : ""}`; return <tr key={date}><td>{formatDateBR(date)}</td><td>{entry ? `${formatTime(entry.clockIn)} · ${formatTime(entry.lunchStart)}–${formatTime(entry.lunchEnd)} · ${formatTime(entry.clockOut)}` : "—"}</td><td>{calc ? formatMinutes(calc.scheduledMinutes) : "—"}</td><td>{calc?.complete ? formatMinutes(calc.workedMinutes) : "—"}</td><td>{balance > 0 ? formatMinutes(balance) : "—"}</td><td>{balance < 0 ? `-${formatMinutes(Math.max(0, Math.abs(balance) - dailyDebits))}` : "—"}</td><td>{observation}{dailyDebits ? ` · ${formatMinutes(dailyDebits)} utilizada do banco para compensar o débito do dia` : ""}{calc?.intervalo.excedente ? ` · excedente intervalo: ${calc.intervalo.excedente}min` : ""}</td></tr> })}</tbody></table>
    <div className="monthly-report-summary"><div><b>Créditos do mês</b><span>{formatMinutes(credit)}</span></div><div><b>Débitos do mês</b><span>{formatMinutes(debit)}</span></div><div><b>Saldo líquido</b><span className={net < 0 ? "negative" : "positive"}>{formatMinutes(net, true)}</span></div></div>
    <div className="monthly-report-rules"><b>Critérios aplicados:</b> variações de entrada e saída permanecem como auditoria; a tolerância do Art. 58 não se aplica ao excedente do intervalo; aos sábados, a jornada normal considerada é de 09h às 13h (4h), com o intervalo efetivamente descontado e o excedente lançado no banco; o saldo técnico considera a jornada líquida e os débitos efetivamente apurados.</div>
    <footer className="monthly-report-signatures"><span>Assinatura do colaborador</span><span>Assinatura do responsável</span></footer>
  </section>
}

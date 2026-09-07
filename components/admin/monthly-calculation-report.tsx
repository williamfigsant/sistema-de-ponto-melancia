import type { Staff, TimeEntry } from "@/lib/db/schema"
import { calculateDay, formatDateBR, formatMinutes, formatTime, nowBR } from "@/lib/time-utils"

export function MonthlyCalculationReport({ entries, member, year, month }: { entries: TimeEntry[]; member: Staff; year: number; month: number }) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDate = new Map(entries.map((entry) => [entry.workDate, entry]))
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(Date.UTC(year, month - 1, 1, 12)))
  const rows = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
    const entry = byDate.get(date)
    return { date, entry, calc: entry ? calculateDay(entry, member) : null }
  })
  const complete = rows.filter((row) => row.calc?.complete)
  const credit = complete.reduce((sum, row) => sum + Math.max(0, row.calc?.balanceMinutes ?? 0), 0)
  const debit = complete.reduce((sum, row) => sum + Math.max(0, -(row.calc?.balanceMinutes ?? 0)), 0)
  const net = credit - debit

  return <section className="monthly-calculation-report" aria-label="Memória de cálculo mensal">
    <header className="monthly-report-header"><div><h1>MEMÓRIA DE CÁLCULO MENSAL</h1><p>Banco de horas e tratamento das marcações</p></div><div className="monthly-report-meta"><b>Competência</b><span>{label}</span><b>Emitido em</b><span>{nowBR()}</span></div></header>
    <div className="monthly-report-identity"><div><b>Empregador</b><span>{"Melancia Foto e Presentes"}</span></div><div><b>Colaborador</b><span>{member.name}</span></div><div><b>Jornada contratual</b><span>{member.entryTime ?? "--:--"} às {member.exitTime ?? "--:--"}</span></div></div>
    <table className="monthly-report-table"><thead><tr><th>Data</th><th>Marcações</th><th>Jornada prevista</th><th>Trabalhado</th><th>Crédito</th><th>Débito</th><th>Tratamento / observação</th></tr></thead><tbody>{rows.map(({ date, entry, calc }) => { const balance = calc?.balanceMinutes ?? 0; const observation = !entry ? "Sem registro" : calc?.alertas.length ? calc.alertas.join(", ").replaceAll("_", " ") : entry.occurrenceType === "normal" ? "Registro normal" : entry.occurrenceType.replaceAll("_", " "); return <tr key={date}><td>{formatDateBR(date)}</td><td>{entry ? `${formatTime(entry.clockIn)} · ${formatTime(entry.lunchStart)}–${formatTime(entry.lunchEnd)} · ${formatTime(entry.clockOut)}` : "—"}</td><td>{calc ? formatMinutes(calc.scheduledMinutes) : "—"}</td><td>{calc?.complete ? formatMinutes(calc.workedMinutes) : "—"}</td><td>{balance > 0 ? formatMinutes(balance) : "—"}</td><td>{balance < 0 ? `-${formatMinutes(Math.abs(balance))}` : "—"}</td><td>{observation}{calc?.intervalo.excedente ? ` · excedente intervalo: ${calc.intervalo.excedente}min` : ""}</td></tr> })}</tbody></table>
    <div className="monthly-report-summary"><div><b>Créditos do mês</b><span>{formatMinutes(credit)}</span></div><div><b>Débitos do mês</b><span>{formatMinutes(debit)}</span></div><div><b>Saldo líquido</b><span className={net < 0 ? "negative" : "positive"}>{formatMinutes(net, true)}</span></div></div>
    <div className="monthly-report-rules"><b>Critérios aplicados:</b> variações de entrada e saída permanecem como auditoria; a tolerância do Art. 58 não se aplica ao excedente do intervalo; o saldo técnico considera a jornada líquida e os débitos efetivamente apurados.</div>
    <footer className="monthly-report-signatures"><span>Assinatura do colaborador</span><span>Assinatura do responsável</span></footer>
  </section>
}

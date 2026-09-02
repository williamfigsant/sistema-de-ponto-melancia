import { AddEntryDialog } from "@/components/admin/add-entry-dialog"
import { AdminHistoryTable } from "@/components/admin/admin-history-table"
import { MonthCalendar } from "@/components/admin/month-calendar"
import { PrintReportButton } from "@/components/admin/print-report-button"
import { AppHeader } from "@/components/app-header"
import { SummaryCards } from "@/components/summary-cards"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEntriesForUser, getStaffByUserId } from "@/lib/queries"
import { requireAdmin } from "@/lib/session"
import {
  aggregateDays,
  calculateDay,
  currentMonthStartISO,
  formatDateBR,
  formatMinutes,
  formatTime,
  nowBR,
  scheduledMinutesForStaff,
} from "@/lib/time-utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ColaboradorPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const admin = await requireAdmin()
  const { userId } = await params

  const member = await getStaffByUserId(userId)
  if (!member) notFound()

  // Registros do mês corrente.
  const sinceISO = currentMonthStartISO()

  const entries = await getEntriesForUser(member.userId, sinceISO)
  const totals = aggregateDays(entries, member)
  const scheduled = scheduledMinutesForStaff(member)
  // "2024-01-06" é um sábado — usado só para calcular a carga de sábado.
  const scheduledSaturday = scheduledMinutesForStaff(member, "2024-01-06")
  const [year, month] = sinceISO.split("-").map(Number)
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const entriesByDate = new Map(entries.map((entry) => [entry.workDate, entry]))
  const occurrenceCodes: Record<string, string> = { justified_absence: "FJ", unjustified_absence: "FI", medical_certificate: "AT", compensatory_day_off: "FC", early_departure: "SA", compensatory_early_departure: "SAC" }

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader userName={admin.name} roleLabel="Administrador" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="print-sheet" aria-label="Folha de ponto para impressão">
          <h1 className="print-sheet-title">FOLHA DE PONTO | MÊS/ANO: {monthLabel}</h1>
          <div className="print-sheet-section-title">DADOS DO EMPREGADOR</div>
          <div className="print-sheet-grid print-sheet-employer">
            <div><b>Nome:</b> Melancia Foto e Presentes</div>
            <div><b>CNPJ:</b> {member.companyCnpj || "______________________________"}</div>
            <div className="wide"><b>Endereço:</b> {member.companyAddress || "_______________________________________________________________"}</div>
            <div><b>Cidade:</b> {member.companyCity || "Maricá"}</div><div><b>Estado:</b> {member.companyState || "RJ"}</div><div><b>CEP:</b> {member.companyCep || "____________"}</div>
          </div>
          <div className="print-sheet-section-title">DADOS DO EMPREGADO</div>
          <div className="print-sheet-grid print-sheet-employee">
            <div className="wide"><b>Nome:</b> {member.name}</div>
            <div><b>Carteira de trabalho nº:</b> __________________</div><div><b>Série:</b> __________</div><div><b>Cargo:</b> {member.role === "admin" ? "Administrador" : "Colaborador"}</div>
            <div><b>Horário contratado:</b> Seg-sex {member.entryTime ?? "--:--"}–{member.exitTime ?? "--:--"}</div>
            <div><b>Entrada:</b> {member.entryTime ?? "--:--"}</div><div><b>Saída/almoço:</b> {member.lunchStart ?? "--:--"}</div><div><b>Retorno/almoço:</b> {member.lunchEnd ?? "--:--"}</div><div><b>Saída:</b> {member.exitTime ?? "--:--"}</div>
          </div>
          <table className="print-sheet-table">
            <thead><tr><th>DIA<br />MÊS</th><th>ENTRADA</th><th>INÍCIO DO<br />INTERVALO</th><th>FIM DO<br />INTERVALO</th><th>SAÍDA</th><th>RUBRICA</th><th>HORA EXTRA</th><th>VISTO</th></tr></thead>
            <tbody>{Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const date = `${sinceISO.slice(0, 7)}-${String(day).padStart(2, "0")}`
              const entry = entriesByDate.get(date)
              const calc = entry ? calculateDay(entry, member) : null
              return <tr key={date}><td>{String(day).padStart(2, "0")}</td><td>{formatTime(entry?.clockIn)}</td><td>{formatTime(entry?.lunchStart)}</td><td>{formatTime(entry?.lunchEnd)}</td><td>{formatTime(entry?.clockOut)}</td><td>{entry ? occurrenceCodes[entry.occurrenceType] ?? "" : ""}</td><td>{calc?.complete && (calc.balanceMinutes ?? 0) > 0 ? formatMinutes(calc.balanceMinutes ?? 0) : calc && (calc.balanceMinutes ?? 0) < 0 ? `-${formatMinutes(Math.abs(calc.balanceMinutes ?? 0))}` : ""}</td><td></td></tr>
            })}</tbody>
          </table>
          <div className="print-sheet-signature"><b>Assinatura do empregado:</b><span /></div>
          <div className="print-sheet-footer"><b>Legenda:</b> FJ = Falta justificada · FI = Falta injustificada · AT = Atestado · FC = Folga compensatória · SA = Saída antecipada · SAC = Saída antecipada compensatória<br />Documento emitido em {nowBR()} · Fuso horário: Maricá/RJ (America/Sao_Paulo)</div>
        </section>
        <div className="hidden print:flex print:items-center print:justify-between print:border-b print:border-foreground/20 print:pb-3">
          <div className="flex items-center gap-3">
            <img src="/melancia-logo.png" alt="Melancia Foto e Presentes" className="size-12 object-cover" />
            <div>
              <p className="text-lg font-bold">Melancia Foto e Presentes</p>
              <p className="text-xs text-muted-foreground">Relatório mensal de folha de ponto</p>
            </div>
          </div>
          <div className="text-right text-xs leading-5">
            <p><span className="font-semibold">Colaborador:</span> {member.name}</p>
            <p><span className="font-semibold">Referência:</span> {formatDateBR(sinceISO).slice(3)}</p>
            <p><span className="font-semibold">Emitido em:</span> {nowBR()}</p>
          </div>
        </div>

        <div className="print-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 print-hidden"
            nativeButton={false}
            render={<Link href="/admin" />}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {member.name}
                </h1>
                {member.active ? (
                  <Badge variant="secondary">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Seg a sex: {member.entryTime ?? "--:--"} às{" "}
                {member.exitTime ?? "--:--"}
                {scheduled > 0 && ` (${formatMinutes(scheduled)}/dia)`}
              </p>
              {member.satEntryTime && member.satExitTime && (
                <p className="text-sm text-muted-foreground">
                  Sábado: {member.satEntryTime} às {member.satExitTime}
                  {scheduledSaturday > 0 && ` (${formatMinutes(scheduledSaturday)}/dia)`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 print-hidden">
              <AddEntryDialog member={member} />
              <PrintReportButton />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Resumo do mês
          </h2>
          <SummaryCards
            totalWorked={totals.totalWorked}
            totalOvertime={totals.totalOvertime}
            totalDeficit={totals.totalDeficit}
            daysCompleted={totals.daysCompleted}
          />
        </div>

        <Card className="print-hidden">
          <CardHeader><CardTitle className="text-lg">Calendário de registros</CardTitle><CardDescription>Clique em um dia para lançar ou editar o registro.</CardDescription></CardHeader>
          <CardContent><MonthCalendar entries={entries} member={member} year={year} month={month} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros do mês</CardTitle>
            <CardDescription>
              Clique no lápis para corrigir entradas, saídas e horários de
              almoço. Ajustes recalculam automaticamente as horas extras e o
              débito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminHistoryTable entries={entries} member={member} />
          </CardContent>
        </Card>

        <div className="hidden print:grid print:grid-cols-2 print:gap-12 print:pt-16">
          <div className="border-t border-foreground pt-2 text-center text-sm">
            Assinatura do colaborador
          </div>
          <div className="border-t border-foreground pt-2 text-center text-sm">
            Assinatura do responsável
          </div>
        </div>
      </main>
    </div>
  )
}

import { AddEntryDialog } from "@/components/admin/add-entry-dialog"
import { AdminHistoryTable } from "@/components/admin/admin-history-table"
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
  currentMonthStartISO,
  formatDateBR,
  formatMinutes,
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

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader userName={admin.name} roleLabel="Administrador" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
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

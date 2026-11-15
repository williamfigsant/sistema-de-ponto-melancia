import { AppHeader } from "@/components/app-header"
import { TimeOffRequestForm } from "@/components/time-off-request-form"
import { TimeOffRequestList } from "@/components/time-off-request-list"
import { HistoryTable } from "@/components/history-table"
import { PunchClock } from "@/components/punch-clock"
import { SummaryCards } from "@/components/summary-cards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEntriesForUser, getEntryForDay, getTimeAdjustments, getTimeOffRequestsForUser } from "@/lib/queries"
import { getCurrentStaff } from "@/lib/session"
import { aggregateDays, currentMonthStartISO, formatMinutes, scheduledMinutesForStaff, todayISO } from "@/lib/time-utils"
import { redirect } from "next/navigation"

export default async function PainelPage() {
  const profile = await getCurrentStaff()
  if (!profile) redirect("/")
  if (profile.mustChangePassword) redirect("/alterar-senha")
  if (profile.role === "admin") redirect("/admin")

  const today = todayISO()

  const monthStartISO = currentMonthStartISO()

  const [todayEntry, entries, allAdjustments, timeOffRequests] = await Promise.all([
    getEntryForDay(profile.userId, today),
    getEntriesForUser(profile.userId, monthStartISO, today),
    getTimeAdjustments(profile.id),
    getTimeOffRequestsForUser(profile.userId),
  ])

  const adjustmentDate = (value: Date | string | null) => value ? (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10) : ""
  const adjustments = allAdjustments.filter((adjustment) => {
    const date = adjustmentDate(adjustment.workDate ?? adjustment.createdAt)
    return date >= monthStartISO && date <= today
  })
  const totals = aggregateDays(entries, profile, adjustments)
  const monthlyCredits = totals.totalOvertime + adjustments.reduce((sum, adjustment) => sum + Math.max(0, adjustment.minutes), 0)
  const scheduled = scheduledMinutesForStaff(profile)
  // "2024-01-06" é um sábado — usado só para calcular a carga de sábado.
  const scheduledSaturday = scheduledMinutesForStaff(profile, "2024-01-06")

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader userName={profile.name} roleLabel="Colaborador" />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Olá, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seg a sex: {profile.entryTime ?? "--:--"} às{" "}
            {profile.exitTime ?? "--:--"}
            {scheduled > 0 && ` (${formatMinutes(scheduled)}/dia)`}
          </p>
          {profile.satEntryTime && profile.satExitTime && (
            <p className="text-sm text-muted-foreground">
              Sábado: {profile.satEntryTime} às {profile.satExitTime}
              {scheduledSaturday > 0 && ` (${formatMinutes(scheduledSaturday)}/dia)`}
            </p>
          )}
        </div>

        <PunchClock entry={todayEntry} />
        <TimeOffRequestForm />
        <TimeOffRequestList requests={timeOffRequests} />

        <SummaryCards
          totalWorked={totals.totalWorked}
          totalOvertime={totals.totalOvertime}
          totalDeficit={totals.totalDeficit}
          totalUsedFromBank={totals.totalUsedFromBank}
          daysCompleted={totals.daysCompleted}
          previousBalance={profile.previousBalanceMinutes}
          totalBankBalance={totals.totalBalance}
          monthlyCredits={monthlyCredits}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">              Histórico do mês</CardTitle>
            <CardDescription>
              Você não pode editar os registros. Em caso de erro, fale com o
              administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryTable entries={entries} adjustments={adjustments} member={profile} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

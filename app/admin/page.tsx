import { AdminHistoryTable } from "@/components/admin/admin-history-table"
import { CreateEmployeeDialog } from "@/components/admin/create-employee-dialog"
import { EmployeeList } from "@/components/admin/employee-list"
import { AppHeader } from "@/components/app-header"
import { SummaryCards } from "@/components/summary-cards"
import { StoreSettingsCard } from "@/components/admin/store-settings-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEntriesForUser, listStaff } from "@/lib/queries"
import { requireAdmin } from "@/lib/session"
import { aggregateDays, currentMonthStartISO } from "@/lib/time-utils"

export default async function AdminPage() {
  const admin = await requireAdmin()
  const allStaff = await listStaff()
  const employees = allStaff.filter((s) => s.role === "employee")

  // Totais do mês corrente por colaborador para o resumo global.
  const sinceISO = currentMonthStartISO()

  let totalOvertime = 0
  let totalDeficit = 0
  let totalWorked = 0
  let daysCompleted = 0

  await Promise.all(
    employees.map(async (member) => {
      const entries = await getEntriesForUser(member.userId, sinceISO)
      const agg = aggregateDays(entries, member)
      totalOvertime += agg.totalOvertime
      totalDeficit += agg.totalDeficit
      totalWorked += agg.totalWorked
      daysCompleted += agg.daysCompleted
    }),
  )

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader userName={admin.name} roleLabel="Administrador" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Painel do administrador
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie colaboradores, jornadas e registros de ponto.
            </p>
          </div>
          <CreateEmployeeDialog />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Resumo do mês (todos os colaboradores)
          </h2>
          <SummaryCards
            totalWorked={totalWorked}
            totalOvertime={totalOvertime}
            totalDeficit={totalDeficit}
            daysCompleted={daysCompleted}
          />
        </div>

        <StoreSettingsCard values={allStaff[0]} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Colaboradores</CardTitle>
            <CardDescription>
              Clique em &quot;Ponto&quot; para ver e editar os registros de cada
              colaborador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeList members={employees} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

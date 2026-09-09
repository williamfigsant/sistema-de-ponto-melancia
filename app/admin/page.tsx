import { AdminHistoryTable } from "@/components/admin/admin-history-table"
import { CreateEmployeeDialog } from "@/components/admin/create-employee-dialog"
import { EmployeeList } from "@/components/admin/employee-list"
import { AppHeader } from "@/components/app-header"
import { EmployeeMonthlySummary } from "@/components/admin/employee-monthly-summary"
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
  const activeEmployees = employees.filter((member) => member.active)
  const storeValues = allStaff.find((member) =>
    member.companyCnpj ||
    member.companyCep ||
    member.companyAddress ||
    member.storeLatitude ||
    member.storeLongitude,
  ) ?? allStaff[0]

  const sinceISO = currentMonthStartISO()
  const employeeSummaries = await Promise.all(activeEmployees.map(async (member) => {
    const entries = await getEntriesForUser(member.userId, sinceISO)
    const agg = aggregateDays(entries, member)
    return { member, ...agg }
  }))

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

        <EmployeeMonthlySummary rows={employeeSummaries} />

        <StoreSettingsCard values={storeValues} />

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

import { Card, CardContent } from "@/components/ui/card"
import { formatMinutes } from "@/lib/time-utils"

export function SummaryCards({
  totalWorked,
  totalOvertime,
  totalDeficit,
  totalUsedFromBank,
  daysCompleted,
  previousBalance = 0,
  totalBankBalance = 0,
  monthlyCredits,
}: {
  totalWorked: number
  totalOvertime: number
  totalDeficit: number
  totalUsedFromBank: number
  daysCompleted: number
  previousBalance?: number
  totalBankBalance?: number
  monthlyCredits?: number
}) {
  const creditMinutes = monthlyCredits ?? totalOvertime

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Saldo inicial do mês</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-muted-foreground">
            {formatMinutes(previousBalance, true)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Créditos no mês</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-primary">
            {formatMinutes(creditMinutes)}
          </p>
          {monthlyCredits !== undefined && monthlyCredits !== totalOvertime && (
            <p className="mt-1 text-xs text-muted-foreground">Inclui horas extras e créditos lançados</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 py-4">
          <p className="text-xs text-muted-foreground">Abatimentos no mês</p>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Compensações</span>
            <strong className="tabular-nums text-amber-600">−{formatMinutes(totalUsedFromBank)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Débitos</span>
            <strong className="tabular-nums text-destructive">−{formatMinutes(totalDeficit)}</strong>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-xs font-medium text-muted-foreground">Saldo atual do banco</p>
          <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${totalBankBalance >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatMinutes(totalBankBalance, true)}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm sm:col-span-2 xl:col-span-4">
        <span className="font-medium">Atividade do mês</span>
        <span className="text-muted-foreground">Dias registrados: <strong className="font-medium text-foreground">{daysCompleted}</strong></span>
        <span className="text-muted-foreground">Horas trabalhadas: <strong className="font-medium text-foreground tabular-nums">{formatMinutes(totalWorked)}</strong></span>
      </div>
    </div>
  )
}

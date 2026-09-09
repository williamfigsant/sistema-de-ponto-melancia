import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Staff } from "@/lib/db/schema"
import { formatMinutes } from "@/lib/time-utils"
import { CalendarDays, Clock3, TrendingDown, TrendingUp } from "lucide-react"

export function EmployeeMonthlySummary({ rows }: { rows: Array<{ member: Staff; daysCompleted: number; totalWorked: number; totalOvertime: number; totalDeficit: number }> }) {
  if (rows.length === 0) return null

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Acompanhamento do mês</h2>
          <p className="text-xs text-muted-foreground">Totais individuais para identificar rapidamente quem precisa de atenção.</p>
        </div>
        <span className="text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? "colaborador" : "colaboradores"}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(({ member, daysCompleted, totalWorked, totalOvertime, totalDeficit }) => (
          <Card key={member.userId} className="border-border/70">
            <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between gap-3 text-base"><span className="truncate">{member.name}</span><span className="text-xs font-normal text-muted-foreground">{daysCompleted} {daysCompleted === 1 ? "dia" : "dias"}</span></CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 pt-0 text-xs">
              <div className="rounded-md bg-muted/50 p-2"><div className="mb-1 flex items-center gap-1 text-muted-foreground"><Clock3 className="size-3" />Trabalhado</div><strong className="tabular-nums">{formatMinutes(totalWorked)}</strong></div>
              <div className="rounded-md bg-primary/10 p-2"><div className="mb-1 flex items-center gap-1 text-primary"><TrendingUp className="size-3" />Extra</div><strong className="tabular-nums text-primary">{formatMinutes(totalOvertime)}</strong></div>
              <div className="rounded-md bg-destructive/10 p-2"><div className="mb-1 flex items-center gap-1 text-destructive"><TrendingDown className="size-3" />Débito</div><strong className="tabular-nums text-destructive">{formatMinutes(totalDeficit)}</strong></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

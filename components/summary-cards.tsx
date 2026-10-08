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
}: {
  totalWorked: number
  totalOvertime: number
  totalDeficit: number
  totalUsedFromBank: number
  daysCompleted: number
  previousBalance?: number
  totalBankBalance?: number
}) {
  const items = [
    { label: "Dias registrados", value: String(daysCompleted), tone: "" },
    { label: "Saldo mês anterior", value: formatMinutes(previousBalance, true), tone: "text-muted-foreground" },
    { label: "Total no banco", value: formatMinutes(totalBankBalance, true), tone: totalBankBalance >= 0 ? "text-primary" : "text-destructive" },
    { label: "Horas trabalhadas", value: formatMinutes(totalWorked), tone: "" },
    {
      label: "Horas extras",
      value: formatMinutes(totalOvertime),
      tone: "text-primary",
    },
    {
      label: "Horas utilizadas do banco",
      value: formatMinutes(totalUsedFromBank),
      tone: "text-amber-500",
    },
    {
      label: "Horas em débito",
      value: formatMinutes(totalDeficit),
      tone: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground text-pretty">{item.label}</p>
            <p
              className={`mt-1 font-display text-2xl font-semibold tabular-nums ${item.tone}`}
            >
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

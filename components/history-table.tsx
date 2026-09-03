import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Staff, TimeEntry } from "@/lib/db/schema"
import { calculateDay, formatDateBR, formatMinutes, formatTime } from "@/lib/time-utils"

export function HistoryTable({
  entries,
  member,
}: {
  entries: TimeEntry[]
  member: Staff
}) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum registro no período.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Almoço</TableHead>
            <TableHead>Saída</TableHead>
            <TableHead className="text-right">Trabalhado</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const calc = calculateDay(entry, member)
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {formatDateBR(entry.workDate)}
                    {entry.editedByAdmin && (
                      <Badge variant="outline" className="text-[10px]">
                        editado
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{formatTime(entry.clockIn)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatTime(entry.lunchStart)} - {formatTime(entry.lunchEnd)}
                </TableCell>
                <TableCell className="tabular-nums">{formatTime(entry.clockOut)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {calc.complete ? <div><div>{formatMinutes(calc.workedMinutes)}</div>{(calc.totalVariacoes > 0 || calc.alertas.length > 0) && <div className="text-[10px] text-muted-foreground">Auditoria de marcações: {calc.totalVariacoes}min · tolerados: {calc.minutosTolerados}min · excedente do intervalo: {calc.intervalo.excedente}min · status: {calc.intervalo.status.toLowerCase().replaceAll("_", " ")}{calc.alertas.length > 0 ? ` · ${calc.alertas.join(", ")}` : ""}</div>}</div> : "--"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {calc.complete ? (
                    <span
                      className={
                        calc.balanceMinutes > 0
                          ? "font-medium text-primary"
                          : calc.balanceMinutes < 0
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {formatMinutes(calc.balanceMinutes, true)}
                    </span>
                  ) : (
                    "--"
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

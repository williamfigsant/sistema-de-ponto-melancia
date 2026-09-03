"use client"

import { EditEntryDialog } from "@/components/admin/edit-entry-dialog"
import { deleteTimeEntry } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Pencil, Trash2 } from "lucide-react"
import { useTransition } from "react"
import { useState } from "react"

export function AdminHistoryTable({
  entries,
  member,
}: {
  entries: TimeEntry[]
  member: Staff
}) {
  const [editing, setEditing] = useState<{ workDate: string; entry: TimeEntry | null } | null>(null)
  const [isDeleting, startDeleting] = useTransition()

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum registro no período.
      </p>
    )
  }

  return (
    <>
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
              <TableHead className="text-right">Editar</TableHead>
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
                    {calc.complete ? <div><div>{formatMinutes(calc.workedMinutes)}</div>{calc.totalVariacoes > 0 && <div className="text-[10px] text-muted-foreground">Variações: {calc.totalVariacoes}min · tolerados: {calc.minutosTolerados}min · computáveis: {calc.minutosComputaveis}min</div>}</div> : "--"}
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ workDate: entry.workDate, entry })}>
                        <Pencil className="size-4" /><span className="sr-only">Editar registro</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isDeleting} onClick={() => {
                        if (!window.confirm(`Excluir o registro de ${formatDateBR(entry.workDate)}? Essa ação não pode ser desfeita.`)) return
                        const form = new FormData(); form.set("entryId", String(entry.id))
                        startDeleting(() => { void deleteTimeEntry(form) })
                      }}>
                        <Trash2 className="size-4" /><span className="sr-only">Excluir registro</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditEntryDialog
          employeeUserId={member.userId}
          workDate={editing.workDate}
          entry={editing.entry}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  )
}

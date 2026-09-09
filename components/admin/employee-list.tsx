"use client"

import { EditEmployeeDialog } from "@/components/admin/edit-employee-dialog"
import { deleteEmployee, toggleEmployeeStatus } from "@/app/actions/admin"
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
import type { Staff } from "@/lib/db/schema"
import { formatMinutes, scheduledMinutesForStaff } from "@/lib/time-utils"
import { ChevronRight, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function EmployeeList({ members }: { members: Staff[] }) {
  const [editing, setEditing] = useState<Staff | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(member: Staff) {
    startTransition(async () => {
      await toggleEmployeeStatus(member.userId, !member.active)
      router.refresh()
    })
  }

  function handleDelete(member: Staff) {
    if (!window.confirm(`Excluir ${member.name}? Essa ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteEmployee(member.userId)
      router.refresh()
    })
  }

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum colaborador cadastrado ainda. Crie o primeiro no botão acima.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Jornada</TableHead>
              <TableHead>Carga/dia</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {member.entryTime ?? "--:--"} - {member.exitTime ?? "--:--"}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatMinutes(scheduledMinutesForStaff(member))}
                </TableCell>
                <TableCell>
                  {member.active ? (
                    <Badge variant="secondary">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(member)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(member)}
                      disabled={isPending}
                    >
                      {member.active ? "Inativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(member)}
                      disabled={isPending}
                    >
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/colaborador/${member.userId}`} />
                      }
                    >
                      Ponto
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditEmployeeDialog
          member={editing}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  )
}

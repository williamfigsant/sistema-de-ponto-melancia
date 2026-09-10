"use client"

import type React from "react"

import { updateEmployee } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Staff } from "@/lib/db/schema"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export function EditEmployeeDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Staff & { email?: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [active, setActive] = useState(member.active)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set("staffId", String(member.id))
    form.set("active", active ? "true" : "false")
    startTransition(async () => {
      const result = await updateEmployee(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Colaborador atualizado.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar jornada</DialogTitle>
            <DialogDescription>
              {member.name} · {member.email ?? "E-mail não informado"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="previousBalanceHours">Saldo acumulado anterior</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1"><Label htmlFor="previousBalanceHours">Horas</Label><Input id="previousBalanceHours" name="previousBalanceHours" type="number" min="0" defaultValue={Math.floor(Math.abs(member.previousBalanceMinutes) / 60)} placeholder="0" /></div>
                <div className="grid gap-1"><Label htmlFor="previousBalanceMinutes">Minutos</Label><Input id="previousBalanceMinutes" name="previousBalanceMinutes" type="number" min="0" max="59" defaultValue={Math.abs(member.previousBalanceMinutes) % 60} placeholder="0" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="previousBalanceNegative" defaultChecked={member.previousBalanceMinutes < 0} className="size-4" /> Saldo anterior é débito</label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={member.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="col-span-2 text-xs font-medium text-muted-foreground">
                Jornada de segunda a sexta
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="entryTime" className="text-xs">
                  Entrada
                </Label>
                <Input
                  id="entryTime"
                  name="entryTime"
                  type="time"
                  defaultValue={member.entryTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exitTime" className="text-xs">
                  Saída
                </Label>
                <Input
                  id="exitTime"
                  name="exitTime"
                  type="time"
                  defaultValue={member.exitTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lunchStart" className="text-xs">
                  Início do almoço
                </Label>
                <Input
                  id="lunchStart"
                  name="lunchStart"
                  type="time"
                  defaultValue={member.lunchStart ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lunchEnd" className="text-xs">
                  Fim do almoço
                </Label>
                <Input
                  id="lunchEnd"
                  name="lunchEnd"
                  type="time"
                  defaultValue={member.lunchEnd ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="col-span-2 text-xs font-medium text-muted-foreground">
                Jornada de sábado
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="satEntryTime" className="text-xs">
                  Entrada
                </Label>
                <Input
                  id="satEntryTime"
                  name="satEntryTime"
                  type="time"
                  defaultValue={member.satEntryTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satExitTime" className="text-xs">
                  Saída
                </Label>
                <Input
                  id="satExitTime"
                  name="satExitTime"
                  type="time"
                  defaultValue={member.satExitTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satLunchStart" className="text-xs">
                  Início do almoço
                </Label>
                <Input
                  id="satLunchStart"
                  name="satLunchStart"
                  type="time"
                  defaultValue={member.satLunchStart ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satLunchEnd" className="text-xs">
                  Fim do almoço
                </Label>
                <Input
                  id="satLunchEnd"
                  name="satLunchEnd"
                  type="time"
                  defaultValue={member.satLunchEnd ?? ""}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Colaborador ativo (pode bater ponto)
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

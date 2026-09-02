"use client"

import type React from "react"

import { updateTimeEntry } from "@/app/actions/admin"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TimeEntry } from "@/lib/db/schema"
import { toTimeInputValue } from "@/lib/time-utils"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

export function EditEntryDialog({
  employeeUserId,
  workDate,
  entry,
  open,
  onOpenChange,
}: {
  employeeUserId: string
  workDate: string
  entry: TimeEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set("employeeUserId", employeeUserId)
    startTransition(async () => {
      const result = await updateTimeEntry(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Registro atualizado.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
            <DialogDescription>Corrija a data, horários e ocorrência deste lançamento.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5 py-4"><Label htmlFor="editWorkDate">Data</Label><Input id="editWorkDate" name="workDate" type="date" defaultValue={workDate} required /></div>
          <div className="grid grid-cols-2 gap-3 pb-4">
            <div className="grid gap-1.5">
              <Label htmlFor="clockIn" className="text-xs">
                Entrada
              </Label>
              <Input
                id="clockIn"
                name="clockIn"
                type="time"
                defaultValue={toTimeInputValue(entry?.clockIn ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clockOut" className="text-xs">
                Saída
              </Label>
              <Input
                id="clockOut"
                name="clockOut"
                type="time"
                defaultValue={toTimeInputValue(entry?.clockOut ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lunchStart" className="text-xs">
                Início almoço
              </Label>
              <Input
                id="lunchStart"
                name="lunchStart"
                type="time"
                defaultValue={toTimeInputValue(entry?.lunchStart ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lunchEnd" className="text-xs">
                Fim almoço
              </Label>
              <Input
                id="lunchEnd"
                name="lunchEnd"
                type="time"
                defaultValue={toTimeInputValue(entry?.lunchEnd ?? null)}
              />
            </div>
          </div>

          <div className="grid gap-1.5 pb-4">
            <Label htmlFor="occurrenceType">Ocorrência do dia</Label>
            <Select name="occurrenceType" defaultValue={entry?.occurrenceType ?? "normal"} itemToStringLabel={(value) => ({ normal: "Normal", justified_absence: "Falta justificada", unjustified_absence: "Falta injustificada", medical_certificate: "Atestado", compensatory_day_off: "Folga compensatória", early_departure: "Saída antecipada", compensatory_early_departure: "Saída antecipada compensatória" }[String(value)] ?? "Normal")}>
              <SelectTrigger id="occurrenceType"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="justified_absence">Falta justificada</SelectItem>
                <SelectItem value="unjustified_absence">Falta injustificada</SelectItem>
                <SelectItem value="medical_certificate">Atestado</SelectItem>
                <SelectItem value="compensatory_day_off">Folga compensatória</SelectItem>
                <SelectItem value="early_departure">Saída antecipada</SelectItem>
                <SelectItem value="compensatory_early_departure">Saída antecipada compensatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 pb-4"><Label htmlFor="editOccurrenceNote">Observação / horas abonadas</Label><Input id="editOccurrenceNote" name="occurrenceNote" defaultValue={entry?.occurrenceNote ?? ""} placeholder="Ex.: comparecimento médico — 2h abonadas" /></div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

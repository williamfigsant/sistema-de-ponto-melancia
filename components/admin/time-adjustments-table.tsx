"use client"

import { useState } from "react"
import { deleteTimeAdjustment, updateTimeAdjustment } from "@/app/actions/admin"
import type { TimeAdjustment } from "@/lib/db/schema"
import { formatMinutes } from "@/lib/time-utils"

export function TimeAdjustmentsTable({ adjustments, staffId }: { adjustments: TimeAdjustment[]; staffId: number }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!adjustments.length) return <p className="text-sm text-muted-foreground">Nenhum lançamento avulso cadastrado.</p>

  return <div className="grid gap-2">
    {adjustments.map((adjustment) => {
      const absolute = Math.abs(adjustment.minutes)
      const isEditing = editingId === adjustment.id

      if (!isEditing) return <div key={adjustment.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium"><span className={adjustment.minutes < 0 ? "text-destructive" : "text-emerald-700"}>{adjustment.minutes < 0 ? "Débito" : "Crédito"}</span>: {formatMinutes(absolute)}</p>
          <p className="truncate text-xs text-muted-foreground">{adjustment.description}</p>
        </div>
        <button type="button" className="shrink-0 rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => setEditingId(adjustment.id)}>Editar</button>
      </div>

      return <div key={adjustment.id} className="rounded-lg border bg-background p-3">
        <form action={updateTimeAdjustment} className="grid gap-3">
          <input type="hidden" name="adjustmentId" value={adjustment.id} /><input type="hidden" name="staffId" value={staffId} />
          <label className="grid gap-1 text-sm"><span>Tipo</span><select name="direction" defaultValue={adjustment.minutes < 0 ? "debit" : "credit"} className="h-9 rounded-md border bg-background px-3"><option value="credit">Crédito</option><option value="debit">Débito</option></select></label>
          <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-sm"><span>Horas</span><input name="hours" type="number" min="0" defaultValue={Math.floor(absolute / 60)} className="h-9 rounded-md border bg-background px-3" /></label><label className="grid gap-1 text-sm"><span>Minutos</span><input name="minutes" type="number" min="0" max="59" defaultValue={absolute % 60} className="h-9 rounded-md border bg-background px-3" /></label></div>
          <label className="grid gap-1 text-sm"><span>Descrição</span><input name="description" required defaultValue={adjustment.description} className="h-9 rounded-md border bg-background px-3" /></label>
          <div className="flex flex-wrap gap-2"><button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground" type="submit">Salvar</button><button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={() => setEditingId(null)}>Cancelar</button></div>
        </form>
        <form action={deleteTimeAdjustment} className="mt-2"><input type="hidden" name="adjustmentId" value={adjustment.id} /><input type="hidden" name="staffId" value={staffId} /><button className="text-sm text-destructive underline" type="submit">Excluir lançamento</button></form>
      </div>
    })}
  </div>
}

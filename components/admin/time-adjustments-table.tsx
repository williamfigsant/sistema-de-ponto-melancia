import { deleteTimeAdjustment, updateTimeAdjustment } from "@/app/actions/admin"
import type { TimeAdjustment } from "@/lib/db/schema"
import { formatMinutes } from "@/lib/time-utils"

export function TimeAdjustmentsTable({ adjustments, staffId }: { adjustments: TimeAdjustment[]; staffId: number }) {
  if (!adjustments.length) return <p className="text-sm text-muted-foreground">Nenhum lançamento avulso cadastrado.</p>
  return <div className="grid gap-3">
    {adjustments.map((adjustment) => {
      const absolute = Math.abs(adjustment.minutes)
      return <div key={adjustment.id} className="rounded-lg border p-3">
        <form action={updateTimeAdjustment} className="grid gap-3 md:grid-cols-[auto_1fr_1fr_1fr_auto] md:items-end">
          <input type="hidden" name="adjustmentId" value={adjustment.id} /><input type="hidden" name="staffId" value={staffId} />
          <label className="grid gap-1 text-sm"><span>Tipo</span><select name="direction" defaultValue={adjustment.minutes < 0 ? "debit" : "credit"} className="h-9 rounded-md border bg-background px-3"><option value="credit">Crédito</option><option value="debit">Débito</option></select></label>
          <label className="grid gap-1 text-sm"><span>Horas</span><input name="hours" type="number" min="0" defaultValue={Math.floor(absolute / 60)} className="h-9 rounded-md border bg-background px-3" /></label>
          <label className="grid gap-1 text-sm"><span>Minutos</span><input name="minutes" type="number" min="0" max="59" defaultValue={absolute % 60} className="h-9 rounded-md border bg-background px-3" /></label>
          <label className="grid gap-1 text-sm"><span>Descrição</span><input name="description" required defaultValue={adjustment.description} className="h-9 rounded-md border bg-background px-3" /></label>
          <button className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground" type="submit">Salvar</button>
        </form>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{adjustment.minutes < 0 ? "Débito" : "Crédito"}: {formatMinutes(absolute)}</span><form action={deleteTimeAdjustment}><input type="hidden" name="adjustmentId" value={adjustment.id} /><input type="hidden" name="staffId" value={staffId} /><button className="text-destructive underline" type="submit">Excluir</button></form></div>
      </div>
    })}
  </div>
}

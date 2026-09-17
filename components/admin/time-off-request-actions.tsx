"use client"

import { deleteTimeOffRequestWithState, reviewTimeOffRequestWithState, updateTimeOffRequestWithState } from "@/app/actions/time-off"
import { Button } from "@/components/ui/button"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

type Result = { success?: boolean; error?: string }
const initialState: Result = {}

function refreshAfterSuccess(state: Result, successMessage: string) {
  useEffect(() => {
    if (state.success) {
      toast.success(successMessage)
      window.location.reload()
    }
    if (state.error) toast.error(state.error)
  }, [state, successMessage])
}

export function ReviewTimeOffForm({ requestId, status }: { requestId: string; status: "approved" | "rejected" }) {
  const [state, action, pending] = useActionState<Result, FormData>(reviewTimeOffRequestWithState, initialState)
  refreshAfterSuccess(state, status === "approved" ? "Solicitação aprovada e banco de horas atualizado." : "Solicitação rejeitada.")
  return <form action={action}><input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="status" value={status} /><Button type="submit" size="sm" variant={status === "rejected" ? "outline" : "default"} disabled={pending}>{pending ? "Processando..." : status === "rejected" ? "Rejeitar" : "Aprovar"}</Button></form>
}

export function UpdateTimeOffForm({ request }: { request: { id: string; workDate: string; status: string; requestType: string; minutes: number; reason: string } }) {
  const [state, action, pending] = useActionState<Result, FormData>(updateTimeOffRequestWithState, initialState)
  refreshAfterSuccess(state, "Solicitação atualizada e banco de horas sincronizado.")
  return <form action={action} className="mt-3 grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2"><input type="hidden" name="requestId" value={request.id} /><label className="grid gap-1 text-sm"><span>Data</span><input required type="date" name="workDate" defaultValue={request.workDate} className="h-9 rounded-md border bg-background px-3" /></label><label className="grid gap-1 text-sm"><span>Status</span><select name="status" defaultValue={request.status} className="h-9 rounded-md border bg-background px-3"><option value="pending">Aguardando confirmação</option><option value="approved">Aprovada</option><option value="rejected">Rejeitada</option></select></label><label className="grid gap-1 text-sm"><span>Tipo</span><select name="requestType" defaultValue={request.requestType} className="h-9 rounded-md border bg-background px-3"><option value="full_day">Folga do dia inteiro</option><option value="partial">Horas compensatórias</option></select></label><label className="grid gap-1 text-sm"><span>Minutos (se parcial)</span><input type="number" min="0" name="minutes" defaultValue={request.minutes} className="h-9 rounded-md border bg-background px-3" /></label><label className="grid gap-1 sm:col-span-2 text-sm"><span>Motivo</span><input required name="reason" defaultValue={request.reason} className="h-9 rounded-md border bg-background px-3" /></label><div className="flex gap-2 sm:col-span-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</Button></div></form>
}

export function DeleteTimeOffForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<Result, FormData>(deleteTimeOffRequestWithState, initialState)
  refreshAfterSuccess(state, "Solicitação excluída dos painéis.")
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Excluir esta solicitação definitivamente?")) event.preventDefault() }}><input type="hidden" name="requestId" value={requestId} /><Button type="submit" size="sm" variant="destructive" disabled={pending}>{pending ? "Excluindo..." : "Excluir solicitação"}</Button></form>
}

export function DeletePendingTimeOffForm({ requestId }: { requestId: string }) {
  return <DeleteTimeOffForm requestId={requestId} />
}

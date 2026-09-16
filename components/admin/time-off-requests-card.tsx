import { reviewTimeOffRequest, updateTimeOffRequest } from "@/app/actions/time-off"
import type { TimeOffRequest } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

async function handleReview(formData: FormData) {
  "use server"
  await reviewTimeOffRequest(formData)
}

async function handleUpdate(formData: FormData) {
  "use server"
  await updateTimeOffRequest(formData)
}

export function TimeOffRequestsCard({ requests }: { requests: Array<{ request: TimeOffRequest; memberName: string; memberUserId: string }> }) {
  return <section className="grid gap-4 rounded-xl border bg-card p-4">
    <div><h2 className="font-semibold">Solicitações de folga e compensação</h2><p className="text-sm text-muted-foreground">Aprove, rejeite ou edite pedidos. O lançamento é atualizado imediatamente.</p></div>
    {requests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação cadastrada.</p> : requests.map(({ request, memberName }) => <div key={request.id} className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-medium">{memberName} · {new Date(`${request.workDate}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="text-sm">{request.requestType === "full_day" ? "Folga do dia inteiro" : `${Math.floor(request.minutes / 60)}h ${request.minutes % 60}min de compensação`}</p><p className="text-sm text-muted-foreground">{request.reason}</p></div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">{request.status === "approved" ? "Aprovada" : request.status === "rejected" ? "Rejeitada" : "Aguardando confirmação"}</span>
      </div>
      {request.status === "pending" && <div className="flex gap-2"><form action={handleReview}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="status" value="rejected" /><Button variant="outline" size="sm">Rejeitar</Button></form><form action={handleReview}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="status" value="approved" /><Button size="sm">Aprovar</Button></form></div>}
      <details><summary className="cursor-pointer text-sm font-medium">Editar solicitação</summary><form action={handleUpdate} className="mt-3 grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2"><input type="hidden" name="requestId" value={request.id} /><label className="grid gap-1 text-sm"><span>Data</span><input required type="date" name="workDate" defaultValue={request.workDate} className="h-9 rounded-md border bg-background px-3" /></label><label className="grid gap-1 text-sm"><span>Status</span><select name="status" defaultValue={request.status} className="h-9 rounded-md border bg-background px-3"><option value="pending">Aguardando confirmação</option><option value="approved">Aprovada</option><option value="rejected">Rejeitada</option></select></label><label className="grid gap-1 text-sm"><span>Tipo</span><select name="requestType" defaultValue={request.requestType} className="h-9 rounded-md border bg-background px-3"><option value="full_day">Folga do dia inteiro</option><option value="partial">Horas compensatórias</option></select></label><label className="grid gap-1 text-sm"><span>Minutos (se parcial)</span><input type="number" min="0" name="minutes" defaultValue={request.minutes} className="h-9 rounded-md border bg-background px-3" /></label><label className="grid gap-1 sm:col-span-2 text-sm"><span>Motivo</span><input required name="reason" defaultValue={request.reason} className="h-9 rounded-md border bg-background px-3" /></label><div className="sm:col-span-2"><Button type="submit" size="sm">Salvar alterações</Button></div></form></details>
    </div>)}
  </section>
}

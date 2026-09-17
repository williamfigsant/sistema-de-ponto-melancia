import type { TimeOffRequest } from "@/lib/db/schema"

function formatWorkDate(workDate: string) {
  const [year, month, day] = workDate.split("-")
  return `${day}/${month}/${year}`
}
import { DeletePendingTimeOffForm, ReviewTimeOffForm, UpdateTimeOffForm } from "@/components/admin/time-off-request-actions"

export function TimeOffRequestsCard({ requests }: { requests: Array<{ request: TimeOffRequest; memberName: string; memberUserId: string }> }) {
  return <section className="grid gap-4 rounded-xl border bg-card p-4">
    <div><h2 className="font-semibold">Solicitações de folga e compensação</h2><p className="text-sm text-muted-foreground">Aprove, rejeite ou edite pedidos. O lançamento é atualizado imediatamente.</p></div>
    {requests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação cadastrada.</p> : requests.map(({ request, memberName }) => <div key={request.id} className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-medium">{memberName} · {formatWorkDate(request.workDate)}</p><p className="text-sm">{request.requestType === "full_day" ? "Folga do dia inteiro" : `${Math.floor(request.minutes / 60)}h ${request.minutes % 60}min de compensação`}</p><p className="text-sm text-muted-foreground">{request.reason}</p></div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">{request.status === "approved" ? "Aprovada" : request.status === "rejected" ? "Rejeitada" : "Aguardando confirmação"}</span>
      </div>
      {request.status === "pending" && <div className="flex flex-wrap gap-2"><ReviewTimeOffForm requestId={request.id} status="rejected" /><ReviewTimeOffForm requestId={request.id} status="approved" /><DeletePendingTimeOffForm requestId={request.id} /></div>}
      {request.status !== "pending" && <><details><summary className="cursor-pointer text-sm font-medium">Editar solicitação</summary><UpdateTimeOffForm request={request} /></details><DeletePendingTimeOffForm requestId={request.id} /></>}
    </div>)}
  </section>
}

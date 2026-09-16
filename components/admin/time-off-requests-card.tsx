import { reviewTimeOffRequest } from "@/app/actions/time-off"
import type { TimeOffRequest } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"

async function handleReview(formData: FormData) {
  "use server"
  await reviewTimeOffRequest(formData)
}

export function TimeOffRequestsCard({ requests }: { requests: Array<{ request: TimeOffRequest; memberName: string; memberUserId: string }> }) { return <section className="grid gap-4 rounded-xl border bg-card p-4"><div><h2 className="font-semibold">Solicitações de folga e compensação</h2><p className="text-sm text-muted-foreground">Aprove ou rejeite pedidos. O abatimento só ocorre na aprovação.</p></div>{requests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p> : requests.map(({ request, memberName }) => <div key={request.id} className="grid gap-3 rounded-lg border p-3 sm:flex sm:items-center sm:justify-between"><div><p className="font-medium">{memberName} · {new Date(`${request.workDate}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="text-sm">{request.requestType === "full_day" ? "Folga do dia inteiro" : `${Math.floor(request.minutes / 60)}h ${request.minutes % 60}min de compensação`}</p><p className="text-sm text-muted-foreground">{request.reason}</p></div><div className="flex gap-2"><form action={handleReview}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="status" value="rejected" /><Button variant="outline" size="sm">Rejeitar</Button></form><form action={handleReview}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="status" value="approved" /><Button size="sm">Aprovar</Button></form></div></div>)}</section> }

import { Badge } from "@/components/ui/badge"
import type { TimeOffRequest } from "@/lib/db/schema"

const statusLabels: Record<string, string> = { pending: "Aguardando confirmação", approved: "Aprovada", rejected: "Rejeitada" }
const typeLabels: Record<string, string> = { full_day: "Folga do dia inteiro", partial: "Horas compensatórias" }

function formatWorkDate(workDate: string) {
  const [year, month, day] = workDate.split("-")
  return `${day}/${month}/${year}`
}

export function TimeOffRequestList({ requests }: { requests: TimeOffRequest[] }) {
  return <section className="flex w-full max-w-none flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="my-requests-title">
    <div><h2 id="my-requests-title" className="font-semibold">Minhas solicitações</h2><p className="text-sm text-muted-foreground">Acompanhe folgas e horas compensatórias enviadas.</p></div>
    {requests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p> : <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[540px] text-sm"><thead className="bg-muted/40"><tr className="border-b text-left"><th className="px-4 py-3 font-medium">Data</th><th className="px-4 py-3 font-medium">Tipo</th><th className="px-4 py-3 font-medium">Motivo</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id} className="border-b last:border-0"><td className="whitespace-nowrap px-4 py-3">{formatWorkDate(request.workDate)}</td><td className="px-4 py-3">{typeLabels[request.requestType] ?? "Solicitação"}{request.requestType === "partial" && <span className="block text-xs text-muted-foreground">{Math.floor(request.minutes / 60)}h {request.minutes % 60}min</span>}</td><td className="max-w-56 px-4 py-3 text-muted-foreground">{request.reason}</td><td className="px-4 py-3"><Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>{statusLabels[request.status] ?? "Pendente"}</Badge>{request.reviewNote && <span className="mt-1 block text-xs text-muted-foreground">{request.reviewNote}</span>}</td></tr>)}</tbody></table></div>}
  </section>
}

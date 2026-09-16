"use client"

import { createTimeOffRequest } from "@/app/actions/time-off"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const requestTypeLabels = { full_day: "Folga do dia inteiro", partial: "Horas compensatórias" } as const

export function TimeOffRequestForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [type, setType] = useState<keyof typeof requestTypeLabels>("full_day")
  const [message, setMessage] = useState("")
  async function submit(formData: FormData) { const result = await createTimeOffRequest(formData); setMessage(result.error ?? "Solicitação enviada para aprovação."); if (result.success) formRef.current?.reset() }
  return <form ref={formRef} action={submit} className="flex w-full max-w-none flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
    <div><h2 className="font-semibold">Solicitar folga ou compensação</h2><p className="text-sm text-muted-foreground">O saldo só será abatido depois da aprovação do administrador.</p></div>
    <div className="grid gap-2"><Label htmlFor="workDate">Data</Label><Input id="workDate" name="workDate" type="date" required /></div>
    <div className="grid gap-2"><Label>Tipo</Label><Select name="requestType" value={type} onValueChange={(value) => setType((value as keyof typeof requestTypeLabels) ?? "full_day")}><SelectTrigger className="w-full sm:w-72"><SelectValue>{requestTypeLabels[type]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="full_day">Folga do dia inteiro</SelectItem><SelectItem value="partial">Horas compensatórias</SelectItem></SelectContent></Select></div>
    {type === "partial" && <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="hours">Horas</Label><Input id="hours" name="hours" type="number" min="0" /></div><div className="grid gap-2"><Label htmlFor="minutes">Minutos</Label><Input id="minutes" name="minutes" type="number" min="0" max="59" /></div></div>}
    <div className="grid gap-2"><Label htmlFor="reason">Motivo</Label><Input id="reason" name="reason" placeholder="Ex.: consulta médica, compromisso pessoal" required /></div>
    <Button type="submit">Enviar para aprovação</Button>{message && <p className="text-sm text-muted-foreground">{message}</p>}
  </form>
}

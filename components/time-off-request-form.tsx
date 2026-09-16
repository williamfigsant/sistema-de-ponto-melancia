"use client"

import { createTimeOffRequest } from "@/app/actions/time-off"
import { ChevronDown, ChevronUp } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function submit(formData: FormData) {
    setMessage("")
    setIsSuccess(false)
    const result = await createTimeOffRequest(formData)
    if (result.success) {
      setMessage("Solicitação enviada com sucesso e aguardando confirmação do administrador.")
      setIsSuccess(true)
      formRef.current?.reset()
      setType("full_day")
      setIsOpen(false)
      return
    }
    setMessage(result.error ?? "Não foi possível enviar a solicitação.")
  }

  return (
    <section className="rounded-xl border bg-card" aria-labelledby="request-title">
      <button type="button" className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="time-off-request-form">
        <span>
          <span id="request-title" className="block font-semibold">Solicitar folga ou compensação</span>
          <span className="mt-1 block text-sm text-muted-foreground">O saldo só será abatido depois da aprovação do administrador.</span>
        </span>
        {isOpen ? <ChevronUp className="size-5 shrink-0" aria-hidden="true" /> : <ChevronDown className="size-5 shrink-0" aria-hidden="true" />}
      </button>
      {isOpen && (
        <form id="time-off-request-form" ref={formRef} onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)) }} className="flex flex-col gap-4 border-t px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="grid gap-2"><Label htmlFor="workDate">Data</Label><Input id="workDate" name="workDate" type="date" required /></div>
          <div className="grid gap-2"><Label>Tipo</Label><Select name="requestType" value={type} onValueChange={(value) => setType((value as keyof typeof requestTypeLabels) ?? "full_day")}><SelectTrigger className="w-full sm:w-72"><SelectValue>{requestTypeLabels[type]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="full_day">Folga do dia inteiro</SelectItem><SelectItem value="partial">Horas compensatórias</SelectItem></SelectContent></Select></div>
          {type === "partial" && <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="hours">Horas</Label><Input id="hours" name="hours" type="number" min="0" /></div><div className="grid gap-2"><Label htmlFor="minutes">Minutos</Label><Input id="minutes" name="minutes" type="number" min="0" max="59" /></div></div>}
          <div className="grid gap-2"><Label htmlFor="reason">Motivo</Label><Input id="reason" name="reason" placeholder="Ex.: consulta médica, compromisso pessoal" required /></div>
          <Button type="submit">Enviar para aprovação</Button>
          {message && <p role="status" className={isSuccess ? "text-sm text-primary" : "text-sm text-destructive"}>{message}</p>}
        </form>
      )}
      {!isOpen && message && <p role="status" className={isSuccess ? "px-5 pb-5 text-sm text-primary sm:px-6" : "px-5 pb-5 text-sm text-destructive sm:px-6"}>{message}</p>}
    </section>
  )
}

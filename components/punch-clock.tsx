"use client"

import { punch, type PunchType } from "@/app/actions/punch"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TimeEntry } from "@/lib/db/schema"
import { formatTime } from "@/lib/time-utils"
import { Check, Coffee, DoorOpen, LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

const STEPS: {
  type: PunchType
  label: string
  field: keyof TimeEntry
  icon: typeof LogIn
}[] = [
  { type: "clockIn", label: "Entrada", field: "clockIn", icon: LogIn },
  { type: "lunchStart", label: "Saída p/ almoço", field: "lunchStart", icon: Coffee },
  { type: "lunchEnd", label: "Retorno do almoço", field: "lunchEnd", icon: DoorOpen },
  { type: "clockOut", label: "Saída", field: "clockOut", icon: LogOut },
]

export function PunchClock({ entry }: { entry: TimeEntry | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [now, setNow] = useState<Date | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Índice do próximo passo pendente.
  const nextStepIndex = STEPS.findIndex((s) => !entry?.[s.field])

  function handlePunch(type: PunchType) {
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("ready")
        startTransition(async () => {
          const result = await punch(type, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy })
          if (result?.error) {
            toast.error(result.error)
            return
          }
          toast.success("Ponto registrado.")
          router.refresh()
        })
      },
      () => {
        setLocationStatus("error")
        toast.error("Não foi possível obter sua localização. Permita o acesso ao GPS e tente novamente.")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
    return
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-6 py-8">
        <div className="text-center">
          <p
            className="font-display text-5xl font-semibold tabular-nums tracking-tight"
            suppressHydrationWarning
          >
            {now
              ? now.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </p>
          <p className="mt-1 text-sm capitalize text-muted-foreground" suppressHydrationWarning>
            {now
              ? now.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : ""}
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">{locationStatus === "loading" ? "Verificando localização..." : locationStatus === "error" ? "Localização necessária para registrar o ponto." : "Check-in permitido somente dentro do raio da loja."}</p>

        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {STEPS.map((step, index) => {
            const done = Boolean(entry?.[step.field])
            const isNext = index === nextStepIndex
            const Icon = step.icon
            return (
              <Button
                key={step.type}
                type="button"
                disabled={done || !isNext || isPending || locationStatus === "loading"}
                onClick={() => handlePunch(step.type)}
                variant={isNext ? "default" : "outline"}
                className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
              >
                <span className="flex w-full items-center justify-between">
                  <Icon className="size-4" />
                  {done && <Check className="size-4" />}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
                <span className="text-xs opacity-80">
                  {done ? formatTime(entry?.[step.field] as string) : "Pendente"}
                </span>
              </Button>
            )
          })}
        </div>

        {nextStepIndex === -1 && (
          <p className="text-sm font-medium text-primary">
            Jornada de hoje concluída. Bom descanso!
          </p>
        )}
      </CardContent>
    </Card>
  )
}

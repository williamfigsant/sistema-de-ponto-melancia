"use client"

import type React from "react"

import { createEmployee } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export function CreateEmployeeDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEmployee(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Colaborador criado com sucesso.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" />
        Novo colaborador
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
            <DialogDescription>
              Crie o acesso e defina a jornada de trabalho. O colaborador usará o
              e-mail e a senha para entrar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" required placeholder="Maria Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail de acesso</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="maria@melancia.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input
                id="password"
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="col-span-2 text-xs font-medium text-muted-foreground">
                Jornada de segunda a sexta
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="entryTime" className="text-xs">
                  Entrada
                </Label>
                <Input id="entryTime" name="entryTime" type="time" defaultValue="09:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exitTime" className="text-xs">
                  Saída
                </Label>
                <Input id="exitTime" name="exitTime" type="time" defaultValue="18:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lunchStart" className="text-xs">
                  Início do almoço
                </Label>
                <Input id="lunchStart" name="lunchStart" type="time" defaultValue="12:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lunchEnd" className="text-xs">
                  Fim do almoço
                </Label>
                <Input id="lunchEnd" name="lunchEnd" type="time" defaultValue="13:00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="col-span-2 text-xs font-medium text-muted-foreground">
                Jornada de sábado
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="satEntryTime" className="text-xs">
                  Entrada
                </Label>
                <Input id="satEntryTime" name="satEntryTime" type="time" defaultValue="09:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satExitTime" className="text-xs">
                  Saída
                </Label>
                <Input id="satExitTime" name="satExitTime" type="time" defaultValue="16:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satLunchStart" className="text-xs">
                  Início do almoço
                </Label>
                <Input id="satLunchStart" name="satLunchStart" type="time" defaultValue="12:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="satLunchEnd" className="text-xs">
                  Fim do almoço
                </Label>
                <Input id="satLunchEnd" name="satLunchEnd" type="time" defaultValue="13:00" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Criando..." : "Criar colaborador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

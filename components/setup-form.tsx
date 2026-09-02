"use client"

import type React from "react"

import { createFirstAdmin } from "@/app/actions/setup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function SetupForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase()
    const password = String(form.get("password") ?? "")

    const result = await createFirstAdmin(form)
    if (result.error) {
      setLoading(false)
      toast.error(result.error)
      return
    }

    // Se não havia sessão, o admin acabou de ser criado: autentica.
    if (!hasSession) {
      const { error } = await signIn.email({ email, password })
      if (error) {
        setLoading(false)
        toast.error("Conta criada, mas o login falhou. Tente entrar manualmente.")
        router.push("/sign-in")
        return
      }
    }

    toast.success("Administrador configurado!")
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" required placeholder="Nome do administrador" />
      </div>
      {!hasSession && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@melancia.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </>
      )}
      <div className="grid gap-2 border-t pt-4">
        <p className="text-sm font-medium">Dados da loja</p>
        <Input name="companyCnpj" placeholder="CNPJ" />
        <Input name="companyCep" placeholder="CEP" />
        <Input name="companyAddress" placeholder="Endereço completo" />
        <div className="grid grid-cols-2 gap-2"><Input name="companyCity" defaultValue="Maricá" placeholder="Cidade" /><Input name="companyState" defaultValue="RJ" placeholder="UF" /></div>
      </div>
      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? "Configurando..." : "Criar administrador"}
      </Button>
    </form>
  )
}

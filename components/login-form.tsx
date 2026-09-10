"use client"

import type React from "react"

import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase()
    const password = String(form.get("password") ?? "")

    const { error } = await signIn.email({ email, password })
    setLoading(false)

    if (error) {
      toast.error("E-mail ou senha incorretos.")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@melancia.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}

"use client"

import { completeInitialPasswordChange } from "@/app/actions/admin"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ForcedPasswordChange() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get("newPassword") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")
    if (newPassword.length < 8) return toast.error("A nova senha deve ter ao menos 8 caracteres.")
    if (newPassword !== confirmPassword) return toast.error("As senhas não coincidem.")
    setLoading(true)
    const result = await changePassword({ newPassword, currentPassword: String(form.get("currentPassword") ?? "") })
    if (result.error) {
      setLoading(false)
      toast.error("Não foi possível alterar a senha. Confira a senha atual.")
      return
    }
    await completeInitialPasswordChange()
    toast.success("Senha alterada com sucesso.")
    router.push("/")
    router.refresh()
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form onSubmit={handleSubmit} className="w-full space-y-5 rounded-xl border bg-card p-6 shadow-sm"><div><h1 className="text-2xl font-semibold">Altere sua senha</h1><p className="mt-2 text-sm text-muted-foreground">Por segurança, a senha inicial precisa ser alterada antes de continuar.</p></div><div className="grid gap-2"><Label htmlFor="currentPassword">Senha inicial</Label><PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" /></div><div className="grid gap-2"><Label htmlFor="newPassword">Nova senha</Label><PasswordInput id="newPassword" name="newPassword" required minLength={8} autoComplete="new-password" /></div><div className="grid gap-2"><Label htmlFor="confirmPassword">Confirme a nova senha</Label><PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} autoComplete="new-password" /></div><Button className="w-full" disabled={loading}>{loading ? "Salvando..." : "Alterar senha"}</Button></form></main>
}

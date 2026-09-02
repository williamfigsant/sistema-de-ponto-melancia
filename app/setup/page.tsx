import { adminExists } from "@/app/actions/setup"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MelanciaLogo } from "@/components/melancia-logo"
import { SetupForm } from "@/components/setup-form"
import { getCurrentStaff, getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SetupPage() {
  // Se já existe admin, ninguém mais configura por aqui.
  if (await adminExists()) {
    const profile = await getCurrentStaff()
    if (profile) redirect("/")
    redirect("/sign-in")
  }

  const session = await getSession()

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <MelanciaLogo className="scale-125" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
              Configuração inicial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Crie a conta do administrador da Melancia. É a partir dela que você
              cadastra os colaboradores.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2" />
          <CardContent>
            <SetupForm hasSession={Boolean(session?.user)} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

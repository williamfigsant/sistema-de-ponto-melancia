import { MelanciaLogo } from "@/components/melancia-logo"
import { SignOutButton } from "@/components/sign-out-button"
import { Badge } from "@/components/ui/badge"

export function AppHeader({
  userName,
  roleLabel,
}: {
  userName: string
  roleLabel: string
}) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <MelanciaLogo />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{userName}</p>
            <Badge variant="secondary" className="mt-0.5 text-[10px]">
              {roleLabel}
            </Badge>
          </div>
          <span className="print-hidden"><SignOutButton /></span>
        </div>
      </div>
    </header>
  )
}

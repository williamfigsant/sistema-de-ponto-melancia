import { ForcedPasswordChange } from "@/components/forced-password-change"
import { getCurrentStaff, getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ChangePasswordPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  const profile = await getCurrentStaff()
  if (!profile?.mustChangePassword) redirect("/")
  return <ForcedPasswordChange />
}

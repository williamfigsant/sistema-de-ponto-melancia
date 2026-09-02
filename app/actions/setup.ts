"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { staff } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

/** Verifica se já existe algum administrador cadastrado. */
export async function adminExists() {
  const rows = await db.select().from(staff).where(eq(staff.role, "admin")).limit(1)
  return rows.length > 0
}

/**
 * Cria o PRIMEIRO administrador da loja Melancia.
 * Só funciona enquanto não houver nenhum admin. Se um usuário já está
 * autenticado sem perfil, transforma-o em admin.
 */
export async function createFirstAdmin(formData: FormData) {
  if (await adminExists()) {
    return { error: "Já existe um administrador. Faça login normalmente." }
  }

  const session = await auth.api.getSession({ headers: await headers() })

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const companyCnpj = String(formData.get("companyCnpj") ?? "").trim() || null
  const companyCep = String(formData.get("companyCep") ?? "").trim() || null
  const companyAddress = String(formData.get("companyAddress") ?? "").trim() || null
  const companyCity = String(formData.get("companyCity") ?? "Maricá").trim() || "Maricá"
  const companyState = String(formData.get("companyState") ?? "RJ").trim() || "RJ"

  // Caso um usuário já esteja logado sem perfil, apenas cria o perfil admin.
  if (session?.user) {
    await db.insert(staff).values({
      userId: session.user.id,
      name: name || session.user.name || "Administrador",
      role: "admin",
      companyCnpj, companyCep, companyAddress, companyCity, companyState,
    })
    return { success: true }
  }

  if (!name || !email || password.length < 8) {
    return { error: "Preencha nome, e-mail e uma senha de ao menos 8 caracteres." }
  }

  let userId: string
  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } })
    userId = result.user.id
  } catch (err) {
    console.log("[v0] createFirstAdmin error:", err)
    return { error: "Não foi possível criar a conta. O e-mail já pode estar em uso." }
  }

  await db.insert(staff).values({ userId, name, role: "admin", companyCnpj, companyCep, companyAddress, companyCity, companyState })
  return { success: true }
}

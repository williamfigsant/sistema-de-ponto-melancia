import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"

function resolveBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL
}

function resolveTrustedOrigins() {
  const origins = new Set<string>()
  const addOrigin = (value?: string) => {
    if (!value) return
    const normalized = value.startsWith("http") ? value : `https://${value}`
    origins.add(normalized.replace(/\/$/, ""))
  }

  if (process.env.NODE_ENV === "development") {
    addOrigin("http://localhost:3000")
    for (const key of [
      "V0_RUNTIME_URL",
      "V0_DEV_APP_URL",
      "V0_BUILD_URL",
      "V0_SANDBOX_URL",
      "BETTER_AUTH_URL",
    ]) {
      addOrigin(process.env[key])
    }
  } else {
    for (const key of [
      "VERCEL_URL",
      "VERCEL_PROJECT_PRODUCTION_URL",
      "BETTER_AUTH_URL",
    ]) {
      addOrigin(process.env[key])
    }
    // Domínio de produção usado pelo sistema após a troca da URL na Vercel.
    addOrigin("v0-app-pontomelancia.vercel.app")
  }

  return Array.from(origins)
}

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})

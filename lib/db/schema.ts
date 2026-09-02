import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  date,
  integer,
  unique,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables (do not rename columns — camelCase matches BA defaults)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  // Exigido pelo Better Auth 1.7 (identidade da conta escopada por issuer).
  issuer: text("issuer").notNull().default(""),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

// Perfil do colaborador + jornada de trabalho cadastrada pelo admin.
// "userId" referencia user.id do Better Auth (sem FK por escolha da skill).
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"), // 'employee' | 'admin'
  entryTime: text("entryTime"), // "09:00" (seg-sex)
  lunchStart: text("lunchStart"), // "12:00" (seg-sex)
  lunchEnd: text("lunchEnd"), // "13:00" (seg-sex)
  exitTime: text("exitTime"), // "18:00" (seg-sex)
  // Jornada de sábado (horário diferenciado). Se vazio, usa a jornada padrão.
  satEntryTime: text("satEntryTime"), // "09:00" (sáb)
  satLunchStart: text("satLunchStart"), // "12:00" (sáb)
  satLunchEnd: text("satLunchEnd"), // "13:00" (sáb)
  satExitTime: text("satExitTime"), // "16:00" (sáb)
  companyCnpj: text("companyCnpj"),
  companyCep: text("companyCep"),
  companyAddress: text("companyAddress"),
  companyCity: text("companyCity").default("Maricá"),
  companyState: text("companyState").default("RJ"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Registro de ponto diário (um por colaborador por dia).
export const timeEntries = pgTable(
  "time_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    workDate: date("workDate").notNull(),
    clockIn: timestamp("clockIn"),
    lunchStart: timestamp("lunchStart"),
    lunchEnd: timestamp("lunchEnd"),
    clockOut: timestamp("clockOut"),
    editedByAdmin: boolean("editedByAdmin").notNull().default(false),
    occurrenceType: text("occurrenceType").notNull().default("normal"),
    occurrenceNote: text("occurrenceNote"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => ({
    uniqueUserDate: unique().on(t.userId, t.workDate),
  }),
)

export type Staff = typeof staff.$inferSelect
export type TimeEntry = typeof timeEntries.$inferSelect

"use client"

import { updateStoreSettings } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTransition } from "react"
import { toast } from "sonner"

export function StoreSettingsCard({ values }: { values?: { companyCnpj?: string | null; companyCep?: string | null; companyAddress?: string | null; companyCity?: string | null; companyState?: string | null } }) {
  const [pending, startTransition] = useTransition()
  return <Card><CardHeader><CardTitle>Dados da loja</CardTitle><CardDescription>Essas informações aparecem automaticamente nas folhas de ponto impressas.</CardDescription></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" action={(formData) => startTransition(async () => { await updateStoreSettings(formData); toast.success("Dados da loja salvos.") })}><div className="grid gap-2"><Label htmlFor="companyCnpj">CNPJ</Label><Input id="companyCnpj" name="companyCnpj" defaultValue={values?.companyCnpj ?? ""} /></div><div className="grid gap-2"><Label htmlFor="companyCep">CEP</Label><Input id="companyCep" name="companyCep" defaultValue={values?.companyCep ?? ""} /></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="companyAddress">Endereço</Label><Input id="companyAddress" name="companyAddress" defaultValue={values?.companyAddress ?? ""} /></div><div className="grid gap-2"><Label htmlFor="companyCity">Cidade</Label><Input id="companyCity" name="companyCity" defaultValue={values?.companyCity ?? "Maricá"} /></div><div className="grid gap-2"><Label htmlFor="companyState">Estado</Label><Input id="companyState" name="companyState" defaultValue={values?.companyState ?? "RJ"} /></div><Button type="submit" disabled={pending} className="md:col-span-2">{pending ? "Salvando..." : "Salvar dados da loja"}</Button></form></CardContent></Card>
}

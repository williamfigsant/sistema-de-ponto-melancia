"use client"

import { updateStoreSettings } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, X } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type StoreValues = { companyCnpj?: string | null; companyCep?: string | null; companyAddress?: string | null; companyCity?: string | null; companyState?: string | null; storeLatitude?: string | number | null; storeLongitude?: string | number | null; storeRadiusMeters?: number | null; requireLocation?: boolean }

export function StoreSettingsCard({ values }: { values?: StoreValues }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function closeEditor() {
    if (!pending) setEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div><CardTitle>Dados da loja</CardTitle><CardDescription>Informações usadas nas folhas de ponto e na validação de localização.</CardDescription></div>
        {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-2 size-4" />Editar</Button>}
      </CardHeader>
      {editing ? <CardContent><form className="grid gap-4 md:grid-cols-2" action={(formData) => startTransition(async () => { await updateStoreSettings(formData); toast.success("Dados da loja salvos."); setEditing(false) })}><div className="grid gap-2"><Label htmlFor="companyCnpj">CNPJ</Label><Input id="companyCnpj" name="companyCnpj" defaultValue={values?.companyCnpj ?? ""} /></div><div className="grid gap-2"><Label htmlFor="companyCep">CEP</Label><Input id="companyCep" name="companyCep" defaultValue={values?.companyCep ?? ""} /></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="companyAddress">Endereço</Label><Input id="companyAddress" name="companyAddress" defaultValue={values?.companyAddress ?? ""} /></div><div className="grid gap-2"><Label htmlFor="companyCity">Cidade</Label><Input id="companyCity" name="companyCity" defaultValue={values?.companyCity ?? "Maricá"} /></div><div className="grid gap-2"><Label htmlFor="companyState">Estado</Label><Input id="companyState" name="companyState" defaultValue={values?.companyState ?? "RJ"} /></div><div className="grid gap-2"><Label htmlFor="storeLatitude">Latitude da loja</Label><Input id="storeLatitude" name="storeLatitude" type="number" step="0.0000001" defaultValue={values?.storeLatitude ?? ""} placeholder="-22.919438" /></div><div className="grid gap-2"><Label htmlFor="storeLongitude">Longitude da loja</Label><Input id="storeLongitude" name="storeLongitude" type="number" step="0.0000001" defaultValue={values?.storeLongitude ?? ""} placeholder="-42.616556" /></div><div className="grid gap-2"><Label htmlFor="storeRadiusMeters">Raio permitido (metros)</Label><Input id="storeRadiusMeters" name="storeRadiusMeters" type="number" min="10" max="1000" defaultValue={values?.storeRadiusMeters ?? 100} /></div><label className="flex items-start gap-3 md:col-span-2"><input type="checkbox" name="requireLocation" defaultChecked={values?.requireLocation ?? true} className="mt-1 size-4" /><span><span className="font-medium">Exigir localização para registrar ponto</span><span className="block text-sm text-muted-foreground">Desative para permitir registros sem validação de GPS e raio da loja.</span></span></label><div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar dados da loja"}</Button><Button type="button" variant="ghost" onClick={closeEditor} disabled={pending}><X className="mr-2 size-4" />Cancelar</Button></div></form></CardContent> : <CardContent className="pt-0"><div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground"><span>{values?.companyCity ?? "Maricá"}/{values?.companyState ?? "RJ"}</span><span>Raio de ponto: {values?.storeRadiusMeters ?? 100} m</span><span>{values?.companyAddress || "Endereço não informado"}</span></div></CardContent>}
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useState } from "react"

export function PrintReportButton() {
  const [mode, setMode] = useState<"folha" | "memoria">("folha")
  function print(nextMode: "folha" | "memoria") {
    setMode(nextMode)
    document.documentElement.dataset.printReport = nextMode
    window.setTimeout(() => window.print(), 50)
  }
  return <div className="flex flex-wrap gap-2 print-hidden" aria-label="Opções de impressão">
    <Button variant="outline" onClick={() => print("folha")}><Printer data-icon="inline-start" />Imprimir folha de ponto</Button>
    <Button variant="outline" onClick={() => print("memoria")}><Printer data-icon="inline-start" />Imprimir memória de cálculo</Button>
    <span className="sr-only">Relatório selecionado: {mode}</span>
  </div>
}

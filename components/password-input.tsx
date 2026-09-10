"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-10" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible((value) => !value)}>
        {visible ? <EyeOff data-icon /> : <Eye data-icon />}
      </Button>
    </div>
  )
}

"use client"

import type { Staff, TimeEntry } from "@/lib/db/schema"
import { EditEntryDialog } from "@/components/admin/edit-entry-dialog"
import { useState } from "react"
import { occurrenceLabels } from "@/lib/time-utils"

export function MonthCalendar({ entries, member, year, month }: { entries: TimeEntry[]; member: Staff; year: number; month: number }) {
  const [selected, setSelected] = useState<{ date: string; entry: TimeEntry | null } | null>(null)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDate = new Map(entries.map((entry) => [entry.workDate, entry]))
  const holidays: Record<string, string> = { [`${year}-01-01`]: "Confraternização Universal", [`${year}-04-21`]: "Tiradentes", [`${year}-05-01`]: "Dia do Trabalho", [`${year}-09-07`]: "Independência do Brasil", [`${year}-10-12`]: "Nossa Senhora Aparecida", [`${year}-11-02`]: "Finados", [`${year}-11-15`]: "Proclamação da República", [`${year}-11-20`]: "Consciência Negra", [`${year}-12-25`]: "Natal" }
  return <>
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="py-2 font-medium text-muted-foreground">{day}</div>)}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const entry = byDate.get(date) ?? null
        return <button type="button" key={date} onClick={() => setSelected({ date, entry })} className={`min-h-14 rounded-md border p-2 text-left transition hover:border-primary ${entry ? 'border-primary/50 bg-primary/10' : holidays[date] ? 'border-accent/60 bg-accent/10' : 'border-border'}`}><span className="font-semibold">{day}</span>{holidays[date] && <span className="mt-1 block truncate text-[10px] text-accent" title={holidays[date]}>Feriado</span>}{entry && <span className="mt-1 block truncate text-[10px] text-primary">{entry.occurrenceType === 'normal' ? 'Ponto' : occurrenceLabels[entry.occurrenceType as keyof typeof occurrenceLabels] ?? 'Ocorrência'}</span>}</button>
      })}
    </div>
    {selected && <EditEntryDialog employeeUserId={member.userId} workDate={selected.date} entry={selected.entry} open onOpenChange={(open) => !open && setSelected(null)} />}
  </>
}

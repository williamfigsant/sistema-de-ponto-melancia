"use client"

import type { Staff, TimeEntry } from "@/lib/db/schema"
import { EditEntryDialog } from "@/components/admin/edit-entry-dialog"
import { useState } from "react"

export function MonthCalendar({ entries, member, year, month }: { entries: TimeEntry[]; member: Staff; year: number; month: number }) {
  const [selected, setSelected] = useState<{ date: string; entry: TimeEntry | null } | null>(null)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const byDate = new Map(entries.map((entry) => [entry.workDate, entry]))
  return <>
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="py-2 font-medium text-muted-foreground">{day}</div>)}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const entry = byDate.get(date) ?? null
        return <button type="button" key={date} onClick={() => setSelected({ date, entry })} className={`min-h-14 rounded-md border p-2 text-left transition hover:border-primary ${entry ? 'border-primary/50 bg-primary/10' : 'border-border'}`}><span className="font-semibold">{day}</span>{entry && <span className="mt-1 block truncate text-[10px] text-primary">{entry.occurrenceType === 'normal' ? 'Ponto' : 'Ocorrência'}</span>}</button>
      })}
    </div>
    {selected && <EditEntryDialog employeeUserId={member.userId} workDate={selected.date} entry={selected.entry} open onOpenChange={(open) => !open && setSelected(null)} />}
  </>
}

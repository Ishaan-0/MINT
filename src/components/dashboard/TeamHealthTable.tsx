import type { EngineerHealthRow } from '@/types'
import { EngineerRow } from './EngineerRow'

type Props = { rows: EngineerHealthRow[] }

export function TeamHealthTable({ rows }: Props) {
  const healthy = rows.filter(r => r.machine?.health_score === 100).length
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl font-bold">{healthy}/{rows.length}</span>
        <span className="text-muted-foreground">engineers fully compliant</span>
      </div>
      <table className="w-full border rounded-lg overflow-hidden">
        <thead className="bg-muted text-sm">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Engineer</th>
            <th className="px-4 py-2 text-left font-medium">Health</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Last Sync</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => <EngineerRow key={row.user.id} row={row} />)}
        </tbody>
      </table>
    </div>
  )
}

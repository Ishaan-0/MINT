'use client'
import { useState } from 'react'
import type { EngineerHealthRow, MachineSnapshot } from '@/types'
import { getFixCommand } from '@/lib/fix-commands'

type Props = { row: EngineerHealthRow }

export function EngineerRow({ row }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { user, machine, snapshot, compliance } = row
  const score = machine?.health_score

  const scoreColor = score == null ? 'text-muted-foreground' :
    score === 100 ? 'text-green-600' :
    score >= 70 ? 'text-yellow-600' : 'text-red-600'

  return (
    <>
      <tr
        className="border-b cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-medium">{user.email}</td>
        <td className={`px-4 py-3 font-bold ${scoreColor}`}>
          {score != null ? `${score}%` : '—'}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {compliance?.failing.length
            ? `${compliance.failing.length} issue${compliance.failing.length > 1 ? 's' : ''}`
            : score != null ? '✓ Compliant' : 'No data'}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {machine?.last_synced_at
            ? new Date(machine.last_synced_at).toLocaleDateString()
            : 'Never synced'}
        </td>
      </tr>
      {expanded && compliance && (
        <tr className="border-b bg-muted/20">
          <td colSpan={4} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-700 mb-1">Passing ({compliance.passing.length})</p>
                {compliance.passing.map((r: any) => (
                  <p key={r.tool} className="font-mono text-muted-foreground">{r.tool} {r.required_version ?? ''}</p>
                ))}
              </div>
              <div>
                <p className="font-medium text-red-700 mb-1">Failing ({compliance.failing.length})</p>
                {compliance.failing.map((r: any) => (
                  <div key={r.tool} className="mb-2">
                    <p className="font-mono text-muted-foreground">{r.tool} {r.required_version ?? ''}</p>
                    {snapshot && (
                      <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
                        {getFixCommand(r, snapshot)}
                      </code>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-yellow-700 mb-1">Warnings ({compliance.warnings.length})</p>
                {compliance.warnings.map((r: any) => (
                  <p key={r.tool} className="font-mono text-muted-foreground">{r.tool}</p>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

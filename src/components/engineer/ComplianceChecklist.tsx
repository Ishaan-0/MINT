import type { ComplianceResult, GoldenConfig, MachineSnapshot } from '@/types'
import { getFixCommand } from '@/lib/fix-commands'
import { FixCommand } from './FixCommand'

type Props = {
  result: ComplianceResult
  config: GoldenConfig
  snapshot: MachineSnapshot
}

export function ComplianceChecklist({ result, config, snapshot }: Props) {
  return (
    <div className="space-y-6">
      {result.failing.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-3">
            Required — fix these
          </h2>
          <div className="space-y-4">
            {result.failing.map(rule => (
              <div key={rule.tool} className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2">
                  <span className="text-destructive">✗</span>
                  <span className="font-medium font-mono">{rule.tool}</span>
                  {rule.required_version && (
                    <span className="text-sm text-muted-foreground">
                      requires {rule.required_version}
                    </span>
                  )}
                </div>
                <FixCommand command={getFixCommand(rule, snapshot)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {result.warnings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3">
            Recommended
          </h2>
          <div className="space-y-4">
            {result.warnings.map(rule => (
              <div key={rule.tool} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⚠</span>
                  <span className="font-medium font-mono">{rule.tool}</span>
                </div>
                <FixCommand command={getFixCommand(rule, snapshot)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {result.passing.length > 0 && (
        <details>
          <summary className="text-sm text-muted-foreground cursor-pointer">
            {result.passing.length} passing ✓
          </summary>
          <div className="mt-2 space-y-1">
            {result.passing.map(rule => (
              <div key={rule.tool} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-600">✓</span>
                <span className="font-mono">{rule.tool}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

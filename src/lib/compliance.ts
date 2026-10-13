import type { MachineSnapshot, GoldenConfig, GoldenRule, ComplianceResult } from '@/types'

function resolveToolVersion(snapshot: MachineSnapshot, tool: string): string | null {
  const runtime = snapshot.runtimes.find(r => r.name === tool)
  if (runtime) return runtime.version
  const pkg = snapshot.global_packages.find(p => p.name === tool)
  if (pkg) return pkg.version
  return null
}

function versionSatisfies(actual: string, required: string): boolean {
  return actual.startsWith(required)
}

export function computeCompliance(
  snapshot: MachineSnapshot,
  config: GoldenConfig
): ComplianceResult {
  const passing: GoldenRule[] = []
  const failing: GoldenRule[] = []
  const warnings: GoldenRule[] = []

  for (const rule of config.rules) {
    const actual = resolveToolVersion(snapshot, rule.tool)

    if (actual === null) {
      rule.required ? failing.push(rule) : warnings.push(rule)
      continue
    }

    if (rule.required_version && !versionSatisfies(actual, rule.required_version)) {
      rule.required ? failing.push(rule) : warnings.push(rule)
      continue
    }

    passing.push(rule)
  }

  return { passing, failing, warnings }
}

export function computeHealthScore(
  result: ComplianceResult,
  config: GoldenConfig
): number {
  const requiredRules = config.rules.filter(r => r.required)
  if (requiredRules.length === 0) return 100
  const passingRequired = result.passing.filter(r => r.required).length
  return Math.round((passingRequired / requiredRules.length) * 100)
}

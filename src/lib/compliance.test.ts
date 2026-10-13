import { computeCompliance, computeHealthScore } from './compliance'
import type { MachineSnapshot, GoldenConfig } from '@/types'

const baseSnapshot: MachineSnapshot = {
  runtimes: [
    { name: 'python', version: '3.11.4', manager: 'pyenv', path: '/home/.pyenv/shims/python' },
    { name: 'node', version: '20.5.0', manager: 'nvm', path: '/home/.nvm/versions/node/v20.5.0/bin/node' },
  ],
  venvs: [],
  global_packages: [
    { manager: 'homebrew', name: 'awscli', version: '2.13.0' },
  ],
  path_entries: [],
  heavy_folders: [],
  scanned_at: '2026-10-13T00:00:00Z',
}

const baseConfig: GoldenConfig = {
  id: 'cfg1',
  org_id: 'org1',
  rules: [
    { tool: 'python', required_version: '3.11', required: true },
    { tool: 'node', required_version: '20', required: true },
    { tool: 'awscli', required_version: null, required: true },
    { tool: 'terraform', required_version: null, required: false },
  ],
  updated_at: '2026-10-13T00:00:00Z',
}

describe('computeCompliance', () => {
  it('passes rules where tool version matches required prefix', () => {
    const result = computeCompliance(baseSnapshot, baseConfig)
    expect(result.passing).toHaveLength(3) // python, node, awscli
    expect(result.passing.map(r => r.tool)).toEqual(
      expect.arrayContaining(['python', 'node', 'awscli'])
    )
  })

  it('puts missing recommended tools in warnings, not failing', () => {
    const result = computeCompliance(baseSnapshot, baseConfig)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].tool).toBe('terraform')
    expect(result.failing).toHaveLength(0)
  })

  it('fails required tool with wrong version', () => {
    const snapshot = {
      ...baseSnapshot,
      runtimes: [
        { name: 'python' as const, version: '3.9.7', manager: 'pyenv' as const, path: '' },
        { name: 'node' as const, version: '20.5.0', manager: 'nvm' as const, path: '' },
      ],
    }
    const result = computeCompliance(snapshot, baseConfig)
    expect(result.failing.map(r => r.tool)).toContain('python')
    expect(result.passing.map(r => r.tool)).not.toContain('python')
  })

  it('fails required tool that is completely missing', () => {
    const snapshot = { ...baseSnapshot, runtimes: [], global_packages: [] }
    const result = computeCompliance(snapshot, baseConfig)
    expect(result.failing).toHaveLength(3) // python, node, awscli all required
    expect(result.warnings).toHaveLength(1) // terraform recommended
  })

  it('passes required tool with no version constraint when any version is installed', () => {
    const result = computeCompliance(baseSnapshot, {
      ...baseConfig,
      rules: [{ tool: 'awscli', required_version: null, required: true }],
    })
    expect(result.passing).toHaveLength(1)
    expect(result.failing).toHaveLength(0)
  })
})

describe('computeHealthScore', () => {
  it('returns 100 when all required rules pass', () => {
    const result = computeCompliance(baseSnapshot, baseConfig)
    expect(computeHealthScore(result, baseConfig)).toBe(100)
  })

  it('returns 67 when 2 of 3 required rules pass', () => {
    const snapshot = {
      ...baseSnapshot,
      runtimes: [{ name: 'node' as const, version: '20.5.0', manager: 'nvm' as const, path: '' }],
      global_packages: [{ manager: 'homebrew' as const, name: 'awscli', version: '2.13.0' }],
    }
    const result = computeCompliance(snapshot, baseConfig)
    expect(computeHealthScore(result, baseConfig)).toBe(67)
  })

  it('returns 100 when config has no required rules', () => {
    const config: GoldenConfig = {
      ...baseConfig,
      rules: [{ tool: 'terraform', required_version: null, required: false }],
    }
    const result = computeCompliance(baseSnapshot, config)
    expect(computeHealthScore(result, config)).toBe(100)
  })
})

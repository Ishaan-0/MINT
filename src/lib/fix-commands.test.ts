import { getFixCommand } from './fix-commands'
import type { GoldenRule, MachineSnapshot } from '@/types'

const emptySnapshot: MachineSnapshot = {
  runtimes: [], venvs: [], global_packages: [],
  path_entries: [], heavy_folders: [], scanned_at: '',
}

describe('getFixCommand', () => {
  it('generates pyenv install command when pyenv is the detected manager', () => {
    const snapshot: MachineSnapshot = {
      ...emptySnapshot,
      runtimes: [{ name: 'python', version: '3.9.7', manager: 'pyenv', path: '' }],
    }
    const rule: GoldenRule = { tool: 'python', required_version: '3.11', required: true }
    const cmd = getFixCommand(rule, snapshot)
    expect(cmd).toBe('pyenv install 3.11 && pyenv global 3.11')
  })

  it('generates brew+pyenv command when python is not installed at all', () => {
    const rule: GoldenRule = { tool: 'python', required_version: '3.11', required: true }
    const cmd = getFixCommand(rule, emptySnapshot)
    expect(cmd).toBe('brew install pyenv && pyenv install 3.11 && pyenv global 3.11')
  })

  it('generates nvm install command when nvm is the detected manager', () => {
    const snapshot: MachineSnapshot = {
      ...emptySnapshot,
      runtimes: [{ name: 'node', version: '18.0.0', manager: 'nvm', path: '' }],
    }
    const rule: GoldenRule = { tool: 'node', required_version: '20', required: true }
    const cmd = getFixCommand(rule, snapshot)
    expect(cmd).toBe('nvm install 20 && nvm use 20 && nvm alias default 20')
  })

  it('falls back to brew install for unknown packages', () => {
    const rule: GoldenRule = { tool: 'terraform', required_version: null, required: false }
    const cmd = getFixCommand(rule, emptySnapshot)
    expect(cmd).toBe('brew install terraform')
  })

  it('generates rustup command for rust regardless of version manager', () => {
    const rule: GoldenRule = { tool: 'rust', required_version: null, required: true }
    const cmd = getFixCommand(rule, emptySnapshot)
    expect(cmd).toBe('rustup update stable')
  })
})

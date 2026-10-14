import type { GoldenRule, MachineSnapshot, Runtime } from '@/types'

function detectManager(snapshot: MachineSnapshot, tool: string): Runtime['manager'] | null {
  const runtime = snapshot.runtimes.find(r => r.name === tool)
  return runtime?.manager ?? null
}

type CommandGenerator = (version: string | null, manager: Runtime['manager'] | null) => string

const GENERATORS: Record<string, CommandGenerator> = {
  python: (version, manager) => {
    const v = version ?? '3.11'
    if (manager === 'pyenv') return `pyenv install ${v} && pyenv global ${v}`
    if (manager === 'conda') return `conda install python=${v}`
    return `brew install pyenv && pyenv install ${v} && pyenv global ${v}`
  },
  node: (version, manager) => {
    const v = version ?? '20'
    if (manager === 'nvm') return `nvm install ${v} && nvm use ${v} && nvm alias default ${v}`
    return `brew install nvm && nvm install ${v} && nvm use ${v}`
  },
  go: (version) => version ? `brew install go@${version}` : 'brew install go',
  rust: () => 'rustup update stable',
  ruby: (version, manager) => {
    const v = version ?? '3.3'
    if (manager === 'rbenv') return `rbenv install ${v} && rbenv global ${v}`
    return `brew install rbenv && rbenv install ${v} && rbenv global ${v}`
  },
}

export function getFixCommand(rule: GoldenRule, snapshot: MachineSnapshot): string {
  const generator = GENERATORS[rule.tool]
  if (generator) {
    const manager = detectManager(snapshot, rule.tool)
    return generator(rule.required_version, manager)
  }
  return `brew install ${rule.tool}`
}

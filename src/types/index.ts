export type Runtime = {
  name: 'python' | 'node' | 'go' | 'rust' | 'ruby'
  version: string
  manager: 'pyenv' | 'conda' | 'system' | 'nvm' | 'homebrew' | 'rustup' | 'goenv' | 'rbenv' | 'rvm' | 'unknown'
  path: string
}

export type Venv = {
  path: string
  python_version: string
  size_mb: number
  last_used_at: string | null
}

export type GlobalPackage = {
  manager: 'homebrew' | 'npm' | 'pip' | 'cargo'
  name: string
  version: string
}

export type PathEntry = {
  path: string
  exists: boolean
  duplicate: boolean
}

export type HeavyFolder = {
  path: string
  size_mb: number
}

export type MachineSnapshot = {
  runtimes: Runtime[]
  venvs: Venv[]
  global_packages: GlobalPackage[]
  path_entries: PathEntry[]
  heavy_folders: HeavyFolder[]
  scanned_at: string
}

export type GoldenRule = {
  tool: string
  required_version: string | null  // null = any version accepted
  required: boolean                 // false = recommended/warning only
}

export type GoldenConfig = {
  id: string
  org_id: string
  rules: GoldenRule[]
  updated_at: string
}

export type ComplianceResult = {
  passing: GoldenRule[]
  failing: GoldenRule[]
  warnings: GoldenRule[]
}

export type Machine = {
  id: string
  user_id: string
  org_id: string
  hostname: string
  os_version: string | null
  last_synced_at: string | null
  health_score: number | null
}

export type UserProfile = {
  id: string
  email: string
  role: 'manager' | 'engineer'
  org_id: string | null
}

export type Organization = {
  id: string
  name: string
  slug: string
  seat_count: number
  stripe_subscription_id: string | null
}

export type Invite = {
  id: string
  token: string
  org_id: string
  used_by: string | null
  expires_at: string
}

// Joined type for manager dashboard rows
export type EngineerHealthRow = {
  user: UserProfile
  machine: Machine | null
  snapshot: MachineSnapshot | null
  compliance: ComplianceResult | null
}

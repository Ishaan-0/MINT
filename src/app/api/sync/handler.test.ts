import { buildSnapshotRecord } from './handler'
import type { MachineSnapshot } from '@/types'

const snapshot: MachineSnapshot = {
  runtimes: [{ name: 'python', version: '3.11.4', manager: 'pyenv', path: '' }],
  venvs: [],
  global_packages: [],
  path_entries: [],
  heavy_folders: [],
  scanned_at: '2026-10-13T10:00:00Z',
}

describe('buildSnapshotRecord', () => {
  it('maps MachineSnapshot fields to DB columns', () => {
    const record = buildSnapshotRecord('machine-123', snapshot)
    expect(record.machine_id).toBe('machine-123')
    expect(record.scanned_at).toBe('2026-10-13T10:00:00Z')
    expect(record.runtimes).toEqual(snapshot.runtimes)
    expect(record.venvs).toEqual([])
  })
})

import type { MachineSnapshot } from '@/types'

export function buildSnapshotRecord(machineId: string, snapshot: MachineSnapshot) {
  return {
    machine_id: machineId,
    scanned_at: snapshot.scanned_at,
    runtimes: snapshot.runtimes,
    venvs: snapshot.venvs,
    global_packages: snapshot.global_packages,
    path_entries: snapshot.path_entries,
    heavy_folders: snapshot.heavy_folders,
  }
}

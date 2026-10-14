export function isInviteValid(invite: { used_by: string | null; expires_at: string }): boolean {
  if (invite.used_by !== null) return false
  if (new Date(invite.expires_at) < new Date()) return false
  return true
}

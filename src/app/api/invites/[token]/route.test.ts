// Unit test for invite validity logic only (not the full route)
import { isInviteValid } from './helpers'

describe('isInviteValid', () => {
  it('returns true for unused, non-expired invite', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    expect(isInviteValid({ used_by: null, expires_at: future })).toBe(true)
  })

  it('returns false for already-used invite', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    expect(isInviteValid({ used_by: 'some-user-id', expires_at: future })).toBe(false)
  })

  it('returns false for expired invite', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(isInviteValid({ used_by: null, expires_at: past })).toBe(false)
  })
})

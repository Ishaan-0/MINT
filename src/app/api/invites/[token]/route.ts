import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isInviteValid } from './helpers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('invites')
    .select('*, organizations(name)')
    .eq('token', token)
    .single()

  if (!invite) return NextResponse.json({ valid: false, error: 'Invite not found' }, { status: 404 })

  const valid = isInviteValid(invite)
  return NextResponse.json({
    valid,
    org_name: valid ? (invite.organizations as any).name : null,
    expires_at: invite.expires_at,
  })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invite } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite || !isInviteValid(invite)) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  // Mark invite used
  await supabase
    .from('invites')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Set user as engineer in org
  await supabase
    .from('user_profiles')
    .update({ org_id: invite.org_id, role: 'engineer' })
    .eq('id', user.id)

  // Increment seat count
  await supabase.rpc('increment_seat_count', { org_id: invite.org_id })

  return NextResponse.json({ success: true })
}

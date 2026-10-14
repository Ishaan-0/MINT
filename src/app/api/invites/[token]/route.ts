import { createClient } from '@/lib/supabase/server'
import { updateSeatCount } from '@/lib/stripe'
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

  // Atomic conditional UPDATE — prevents TOCTOU race on concurrent accepts
  const { data: updated, error: updateError } = await supabase
    .from('invites')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .select()

  if (updateError || !updated || updated.length === 0) {
    return NextResponse.json({ error: 'Invite already used or expired' }, { status: 409 })
  }

  const invite = updated[0]

  // Set user as engineer in org
  await supabase
    .from('user_profiles')
    .update({ org_id: invite.org_id, role: 'engineer' })
    .eq('id', user.id)

  // Increment seat count
  const { error: rpcError } = await supabase.rpc('increment_seat_count', { org_id: invite.org_id })
  if (rpcError) return NextResponse.json({ error: 'Failed to increment seat count' }, { status: 500 })

  // Update Stripe subscription seat count
  const { data: orgForSeat } = await supabase
    .from('organizations')
    .select('seat_count, stripe_subscription_id')
    .eq('id', invite.org_id)
    .single()

  if (orgForSeat?.stripe_subscription_id) {
    await updateSeatCount(orgForSeat.stripe_subscription_id, orgForSeat.seat_count)
  }

  return NextResponse.json({ success: true })
}

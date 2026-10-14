import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id || profile.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can create invites' }, { status: 403 })
  }

  // Check active subscription
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', profile.org_id)
    .single()

  if (!org?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Active subscription required to invite engineers' },
      { status: 402 }
    )
  }

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({ org_id: profile.org_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const invite_url = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`
  return NextResponse.json({ invite_url })
}

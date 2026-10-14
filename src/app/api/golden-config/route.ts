import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { GoldenRule } from '@/types'

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single()
  return data?.org_id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 })

  const { data: config } = await supabase
    .from('golden_configs')
    .select('*')
    .eq('org_id', orgId)
    .single()

  return NextResponse.json({ config })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id || profile.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can edit golden config' }, { status: 403 })
  }

  const { rules }: { rules: GoldenRule[] } = await request.json()

  // TODO: trigger recomputation for all org machines on config save
  const { data: config, error } = await supabase
    .from('golden_configs')
    .update({ rules, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('org_id', profile.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ config })
}

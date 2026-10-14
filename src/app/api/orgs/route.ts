import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name: name.trim(), slug, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update user profile to manager of this org
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ org_id: org.id, role: 'manager' })
    .eq('id', user.id)

  if (profileError) return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })

  // Create empty golden config for org
  await supabase
    .from('golden_configs')
    .insert({ org_id: org.id, updated_by: user.id, rules: [] })

  return NextResponse.json({ org })
}

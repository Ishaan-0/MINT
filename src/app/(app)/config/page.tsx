import { createClient } from '@/lib/supabase/server'
import { GoldenConfigForm } from '@/components/config/GoldenConfigForm'
import { redirect } from 'next/navigation'

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'manager') redirect('/me')

  const { data: config } = await supabase
    .from('golden_configs')
    .select('*')
    .eq('org_id', profile.org_id)
    .single()

  async function saveConfig(rules: Parameters<typeof GoldenConfigForm>[0]['initialRules']) {
    'use server'
    // Re-fetch supabase in server action
    const { createClient } = await import('@/lib/supabase/server')
    const sb = await createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    if (!u) return
    // TODO: trigger recomputation for all org machines on config save
    await sb.from('golden_configs')
      .upsert(
        { org_id: profile!.org_id, rules, updated_by: u.id, updated_at: new Date().toISOString() },
        { onConflict: 'org_id' }
      )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Golden Config</h1>
      <p className="text-muted-foreground mb-8">
        Define the tools and versions every engineer on your team should have.
      </p>
      <GoldenConfigForm initialRules={config?.rules ?? []} onSave={saveConfig} />
    </div>
  )
}

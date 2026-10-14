import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ComplianceChecklist } from '@/components/engineer/ComplianceChecklist'
import { computeCompliance } from '@/lib/compliance'

export default async function MePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: machine } = await supabase
    .from('machines')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!machine) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Your Environment</h1>
        <p className="text-muted-foreground">
          Install the DevEnv agent to start scanning your machine.
        </p>
        <a href="/downloads/devenv-agent.dmg" className="mt-4 inline-block underline">
          Download agent (.dmg)
        </a>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const [{ data: config }, { data: snapshot }] = await Promise.all([
    supabase.from('golden_configs').select('*').eq('org_id', profile?.org_id).single(),
    supabase.from('machine_snapshots').select('*')
      .eq('machine_id', machine.id)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const compliance = config && snapshot ? computeCompliance(snapshot as any, config as any) : null

  const lastSynced = machine.last_synced_at
    ? new Date(machine.last_synced_at).toLocaleString()
    : 'Never'

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{machine.hostname}</h1>
          <p className="text-sm text-muted-foreground">Last synced: {lastSynced}</p>
        </div>
        {machine.health_score !== null && (
          <div className={`text-3xl font-bold ${machine.health_score >= 80 ? 'text-green-600' : machine.health_score >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
            {machine.health_score}%
          </div>
        )}
      </div>

      {compliance && config && snapshot ? (
        <ComplianceChecklist
          result={compliance as any}
          config={config as any}
          snapshot={snapshot as any}
        />
      ) : (
        <p className="text-muted-foreground">No golden config set yet. Ask your manager to set one.</p>
      )}
    </div>
  )
}

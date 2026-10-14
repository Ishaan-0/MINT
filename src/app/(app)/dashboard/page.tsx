import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamHealthTable } from '@/components/dashboard/TeamHealthTable'
import type { EngineerHealthRow } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'manager') redirect('/me')

  // Fetch all engineers in org
  const { data: engineers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('role', 'engineer')

  if (!engineers || engineers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Team Dashboard</h1>
        <p className="text-muted-foreground mb-6">No engineers yet. Invite your team.</p>
        <InviteButton />
      </div>
    )
  }

  // Fetch machines and compliance for each engineer
  const engineerIds = engineers.map(e => e.id)
  const [{ data: machines }, { data: compliances }] = await Promise.all([
    supabase.from('machines').select('*').in('user_id', engineerIds),
    supabase.from('compliance_results').select('*, machines!inner(user_id)')
      .in('machines.user_id', engineerIds),
  ])

  const rows: EngineerHealthRow[] = engineers.map(eng => {
    const machine = machines?.find(m => m.user_id === eng.id) ?? null
    const compliance = machine
      ? compliances?.find((c: any) => c.machines.user_id === eng.id) ?? null
      : null
    return { user: eng as any, machine: machine as any, compliance: compliance as any }
  })

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <InviteButton />
      </div>
      <TeamHealthTable rows={rows} />
    </div>
  )
}

function InviteButton() {
  return (
    <form action={async () => {
      'use server'
      // Invite creation handled client-side via /api/invites
    }}>
      <Link href="/dashboard/invite">
        <Button>Invite engineer</Button>
      </Link>
    </form>
  )
}

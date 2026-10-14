import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamHealthTable } from '@/components/dashboard/TeamHealthTable'
import type { EngineerHealthRow, MachineSnapshot } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { computeCompliance } from '@/lib/compliance'

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Dashboard</h1>
          <Link href="/config" className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80">
            Edit Golden Config
          </Link>
        </div>
        <p className="text-muted-foreground mb-6">No engineers yet. Invite your team.</p>
        <InviteButton />
      </div>
    )
  }

  // Fetch machines and golden config
  const engineerIds = engineers.map(e => e.id)
  const [{ data: machines }, { data: goldenConfig }] = await Promise.all([
    supabase.from('machines').select('*').in('user_id', engineerIds),
    supabase.from('golden_configs').select('*').eq('org_id', profile.org_id).single(),
  ])

  const rows: EngineerHealthRow[] = engineers.map(eng => {
    const machine = machines?.find(m => m.user_id === eng.id) ?? null
    let compliance = null
    if (machine && machine.snapshot && goldenConfig) {
      compliance = computeCompliance(machine.snapshot as MachineSnapshot, goldenConfig)
    }
    return { user: eng as any, machine: machine as any, compliance }
  })

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <Link href="/config" className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80">
          Edit Golden Config
        </Link>
      </div>
      <div className="flex justify-end mb-4">
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

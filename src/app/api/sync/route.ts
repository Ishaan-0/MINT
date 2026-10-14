import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { computeCompliance, computeHealthScore } from '@/lib/compliance'
import { buildSnapshotRecord } from './handler'
import type { MachineSnapshot } from '@/types'

// Uses service role to bypass RLS for agent writes
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jwt = authHeader.slice(7)

  // Verify JWT and get user
  const { data: { user }, error: authError } = await adminSupabase.auth.getUser(jwt)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body: MachineSnapshot & { hostname: string; os_version: string } = await request.json()

  // Upsert machine record
  const { data: machine, error: machineError } = await adminSupabase
    .from('machines')
    .upsert(
      { user_id: user.id, hostname: body.hostname, os_version: body.os_version,
        org_id: await getOrgId(user.id), last_synced_at: body.scanned_at },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (machineError || !machine) {
    return NextResponse.json({ error: 'Machine upsert failed' }, { status: 500 })
  }

  // Store snapshot
  await adminSupabase
    .from('machine_snapshots')
    .insert(buildSnapshotRecord(machine.id, body))

  // Compute and store compliance
  const { data: config } = await adminSupabase
    .from('golden_configs')
    .select('*')
    .eq('org_id', machine.org_id)
    .single()

  let healthScore = null

  if (config && config.rules.length > 0) {
    const result = computeCompliance(body, config)
    healthScore = computeHealthScore(result, config)

    await adminSupabase
      .from('compliance_results')
      .upsert({
        machine_id: machine.id,
        golden_config_id: config.id,
        computed_at: new Date().toISOString(),
        passing: result.passing,
        failing: result.failing,
        warnings: result.warnings,
      }, { onConflict: 'machine_id' })

    await adminSupabase
      .from('machines')
      .update({ health_score: healthScore })
      .eq('id', machine.id)
  }

  return NextResponse.json({ machine_id: machine.id, health_score: healthScore })
}

async function getOrgId(userId: string): Promise<string> {
  const { data } = await adminSupabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single()
  return data?.org_id
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Create user_profile if first login
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        email: data.user.email!,
        role: 'manager', // default; changed to 'engineer' when accepting an invite
        org_id: null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      // Redirect new users (no org) to onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', data.user.id)
        .single()

      if (!profile?.org_id) {
        return NextResponse.redirect(new URL('/onboarding', origin).toString())
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

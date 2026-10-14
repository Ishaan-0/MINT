import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">DevEnv</span>
          {profile?.role === 'manager' && (
            <>
              <Link href="/dashboard" className="text-sm hover:underline">Team</Link>
              <Link href="/config" className="text-sm hover:underline">Golden Config</Link>
            </>
          )}
          <Link href="/me" className="text-sm hover:underline">My Machine</Link>
        </div>
        <span className="text-sm text-muted-foreground">{profile?.email}</span>
      </nav>
      <main>{children}</main>
    </div>
  )
}

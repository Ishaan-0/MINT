'use client'
export const dynamic = 'force-dynamic'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [invite, setInvite] = useState<{ valid: boolean; org_name?: string } | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/invites/${token}`).then(r => r.json()).then(setInvite)
  }, [token])

  async function accept() {
    setAccepting(true)
    setError(null)
    const res = await fetch(`/api/invites/${token}`, { method: 'POST' })
    if (res.ok) {
      router.push('/me')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to accept invite')
      setAccepting(false)
    }
  }

  if (!invite) return <div className="min-h-screen flex items-center justify-center">Loading…</div>

  if (!invite.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
            <CardDescription>This link has expired or already been used.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Join {invite.org_name}</CardTitle>
          <CardDescription>You've been invited to your team's DevEnv workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={accept} disabled={accepting}>
            {accepting ? 'Joining…' : 'Accept invite'}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

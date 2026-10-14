'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // 1. Create org
    const orgRes = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const { org } = await orgRes.json()

    // 2. Redirect to Stripe checkout
    const checkoutRes = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: org.id }),
    })
    const { url } = await checkoutRes.json()
    window.location.href = url
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Create your team</h1>
      <p className="text-muted-foreground mb-8">$15/seat/month, minimum 3 seats. Cancel anytime.</p>
      <form onSubmit={createOrg} className="space-y-4">
        <div className="space-y-2">
          <Label>Team name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Engineering" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Setting up…' : 'Continue to payment →'}
        </Button>
      </form>
    </div>
  )
}

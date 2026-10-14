'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const orgRes = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!orgRes.ok) { setLoading(false); return }
    router.push('/dashboard?setup=complete')
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Create your team</h1>
      <p className="text-muted-foreground mb-8">Free during alpha — no payment required.</p>
      <form onSubmit={createOrg} className="space-y-4">
        <div className="space-y-2">
          <Label>Team name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Engineering" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Setting up…' : 'Create team →'}
        </Button>
      </form>
    </div>
  )
}

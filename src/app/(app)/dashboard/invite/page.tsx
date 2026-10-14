'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function InvitePage() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch('/api/invites', { method: 'POST' })
    const { invite_url } = await res.json()
    setUrl(invite_url)
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Invite an engineer</h1>
      <p className="text-muted-foreground">
        Generate a link and send it to your new hire. It expires in 7 days.
      </p>
      <Button onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate invite link'}
      </Button>
      {url && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-mono break-all">{url}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => navigator.clipboard.writeText(url)}
          >
            Copy link
          </Button>
        </div>
      )}
    </div>
  )
}

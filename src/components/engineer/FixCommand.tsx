'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = { command: string }

export function FixCommand({ command }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">{command}</code>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

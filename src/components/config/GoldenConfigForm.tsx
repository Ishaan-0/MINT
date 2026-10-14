'use client'
import { useState } from 'react'
import type { GoldenRule } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const KNOWN_TOOLS = ['python', 'node', 'go', 'rust', 'ruby', 'awscli', 'terraform', 'kubectl', 'docker']

type Props = {
  initialRules: GoldenRule[]
  onSave: (rules: GoldenRule[]) => Promise<void>
}

export function GoldenConfigForm({ initialRules, onSave }: Props) {
  const [rules, setRules] = useState<GoldenRule[]>(initialRules)
  const [saving, setSaving] = useState(false)
  const [newTool, setNewTool] = useState('')
  const [newVersion, setNewVersion] = useState('')

  function addRule() {
    if (!newTool.trim()) return
    const tool = newTool.trim().toLowerCase()
    if (rules.find(r => r.tool === tool)) return
    setRules(prev => [...prev, { tool, required_version: newVersion.trim() || null, required: true }])
    setNewTool('')
    setNewVersion('')
  }

  function removeRule(tool: string) {
    setRules(prev => prev.filter(r => r.tool !== tool))
  }

  function toggleRequired(tool: string) {
    setRules(prev => prev.map(r => r.tool === tool ? { ...r, required: !r.required } : r))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(rules)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.tool} className="flex items-center gap-3 p-3 border rounded-lg">
            <span className="font-mono font-medium w-28">{rule.tool}</span>
            <span className="text-sm text-muted-foreground flex-1">
              {rule.required_version ?? 'any version'}
            </span>
            <button
              onClick={() => toggleRequired(rule.tool)}
              className={`text-xs px-2 py-1 rounded ${rule.required ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
            >
              {rule.required ? 'Required' : 'Recommended'}
            </button>
            <button onClick={() => removeRule(rule.tool)} className="text-muted-foreground hover:text-destructive">×</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          list="known-tools"
          placeholder="Tool (e.g. python)"
          value={newTool}
          onChange={e => setNewTool(e.target.value)}
          className="w-40"
        />
        <datalist id="known-tools">
          {KNOWN_TOOLS.map(t => <option key={t} value={t} />)}
        </datalist>
        <Input
          placeholder="Version (e.g. 3.11)"
          value={newVersion}
          onChange={e => setNewVersion(e.target.value)}
          className="w-32"
        />
        <Button variant="outline" onClick={addRule} type="button">Add rule</Button>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save golden config'}
      </Button>
    </div>
  )
}

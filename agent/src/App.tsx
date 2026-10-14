import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

export default function App() {
  const [jwt, setJwt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await invoke('save_jwt', {
        jwt,
        apiUrl: 'https://your-app.vercel.app', // Replace with production URL
      })
      setSaved(true)
    } catch (err) {
      console.error('Failed to save JWT:', err)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="p-6 text-center">
        <p className="text-green-600 font-medium">Connected! Syncing your machine\u2026</p>
        <p className="text-sm text-gray-500 mt-2">This window will close. Check your system tray.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-sm">
      <h1 className="text-xl font-bold mb-4">Set up DevEnv agent</h1>
      <p className="text-sm text-gray-600 mb-4">
        Paste your session token from the DevEnv web app.
      </p>
      <form onSubmit={handleSetup} className="space-y-4">
        <textarea
          className="w-full border rounded p-2 text-xs font-mono h-24"
          placeholder="Paste your token here"
          value={jwt}
          onChange={e => setJwt(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-black text-white rounded py-2"
        >
          {saving ? 'Connecting\u2026' : 'Connect'}
        </button>
      </form>
    </div>
  )
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function generateStoryboard(payload) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'API error')
  }
  return res.json()
}
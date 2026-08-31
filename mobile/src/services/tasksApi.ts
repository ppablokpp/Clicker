const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface TasksMeResponse {
  claimed: string[]
  anomaliesNeutralized?: number
}

export interface ClaimTaskResponse {
  totalClicks?: number
  error?: string
}

export async function fetchTasksMe(token: string | null): Promise<TasksMeResponse | null> {
  const res = await fetch(`${API_URL}/api/tasks/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function claimTask(
  token: string | null,
  taskId: string,
): Promise<{ ok: boolean; data: ClaimTaskResponse }> {
  const res = await fetch(`${API_URL}/api/tasks/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ taskId }),
  })
  const data = await res.json()
  return { ok: res.ok, data }
}

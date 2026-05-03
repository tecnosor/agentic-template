import type { Response } from 'express'

const clients = new Map<string, Response>()
let keepAliveTimer: ReturnType<typeof setInterval> | null = null

function ensureKeepAlive(): void {
  if (keepAliveTimer) return
  keepAliveTimer = setInterval(() => {
    broadcast('ping', { ts: Date.now() })
  }, 25_000)
}

export function addClient(id: string, res: Response): void {
  clients.set(id, res)
  ensureKeepAlive()
}

export function removeClient(id: string): void {
  clients.delete(id)
  if (clients.size === 0 && keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}

export function broadcast(event: string, data: unknown): void {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const [id, res] of clients) {
    try {
      res.write(chunk)
    } catch {
      clients.delete(id)
    }
  }
}

export function clientCount(): number {
  return clients.size
}

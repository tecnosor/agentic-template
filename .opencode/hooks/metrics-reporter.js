#!/usr/bin/env node
/**
 * OpenCode Metrics Reporter
 *
 * Helper script that reports events to Mission Control metrics API.
 * Called by OpenCode agents via bash tool to record activity.
 *
 * Usage:
 *   node .opencode/hooks/metrics-reporter.js <event-type> [options-json]
 *
 * Examples:
 *   node .opencode/hooks/metrics-reporter.js skill_invoked '{"skill_name":"code-review","tokens_input":1200}'
 *   node .opencode/hooks/metrics-reporter.js agent_invoked '{"agent_name":"builder","tokens_input":800}'
 *   node .opencode/hooks/metrics-reporter.js session_start '{"model":"claude-sonnet-4-5","workspace":"my-service"}'
 *   node .opencode/hooks/metrics-reporter.js task_update   '{"task_id":"FEAT-001","status":"done"}'
 *
 * Environment variables:
 *   METRICS_HOST     — default: localhost
 *   METRICS_PORT     — default: 3099
 *   OPENCODE_SESSION_ID — session ID to group events (set by your agent or generated)
 */

import http from 'http'
import { randomUUID } from 'crypto'

const API_HOST = process.env.METRICS_HOST ?? 'localhost'
const API_PORT = parseInt(process.env.METRICS_PORT ?? '3099', 10)
const SESSION_ID = process.env.OPENCODE_SESSION_ID ?? `cli-${randomUUID().slice(0, 8)}`

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data)
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 2000,
      },
      res => {
        let response = ''
        res.on('data', chunk => (response += chunk))
        res.on('end', () => resolve(response))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body)
    req.end()
  })
}

async function main() {
  const [, , eventType, optionsRaw] = process.argv

  if (!eventType) {
    console.error('Usage: metrics-reporter.js <event-type> [options-json]')
    process.exit(1)
  }

  let options = {}
  try {
    if (optionsRaw) options = JSON.parse(optionsRaw)
  } catch {
    console.error('Invalid JSON in options argument')
    process.exit(1)
  }

  try {
    await post('/api/metrics/events', {
      session_id: options.session_id ?? SESSION_ID,
      timestamp: new Date().toISOString(),
      event_type: eventType,
      workspace: options.workspace ?? process.cwd().split('/').pop(),
      ...options,
    })
    console.log(`✓ metrics: ${eventType} reported`)
  } catch {
    // Silent fail — metrics are supplemental, never block actual work
    process.exit(0)
  }
}

main()

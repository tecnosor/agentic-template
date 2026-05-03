import type { KanbanTask, KanbanColumn, Priority, Origin } from '../types/kanban'

const COLUMN_FROM_FILENAME: Record<string, KanbanColumn> = {
  'BACKLOG.md': 'BACKLOG',
  'TODO.md': 'TODO',
  'READY.md': 'READY',
  'DOING.md': 'DOING',
  'TESTING.md': 'TESTING',
  'HUMAN_VALIDATION.md': 'HUMAN_VALIDATION',
  'DONE.md': 'DONE',
}

function normalizeOrigin(raw = ''): Origin {
  if (raw.includes('Agent') || raw.includes('🤖')) return '🤖 Agent'
  return '👤 Human'
}

function normalizePriority(raw = ''): Priority {
  const u = raw.toUpperCase().trim()
  if (u === 'CRITICAL') return 'CRITICAL'
  if (u === 'HIGH') return 'HIGH'
  if (u === 'LOW') return 'LOW'
  return 'MEDIUM'
}

function isEmptyCell(cell: string): boolean {
  return cell === '—' || cell === '-' || cell === '' || cell.startsWith('(')
}

function isEmptyRow(cells: string[]): boolean {
  return cells.length === 0 || cells.every(isEmptyCell)
}

/**
 * Strip fenced code blocks (``` ... ```) from markdown content so their
 * example tables are never mistaken for real task rows.
 */
function stripCodeFences(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '')
}

/**
 * Parse a horizontal markdown table (most common format in kanban files).
 *
 * Returns:
 *   - `null`  — no table header found (caller should try vertical fallback)
 *   - `[]`    — header found but all data rows are empty/placeholder
 *   - tasks[] — header found with real task rows
 *
 * Format:
 *   | ID | Origin | Priority | Repo | Description | Created |
 *   |----|--------|----------|------|-------------|---------|
 *   | FEAT-001 | 👤 Human | HIGH | repo | desc | date |
 */
function parseHorizontalTable(content: string, column: KanbanColumn): KanbanTask[] | null {
  const lines = content.split('\n')

  const headerIdx = lines.findIndex((l) => {
    const lower = l.toLowerCase()
    return lower.includes('| id |') || lower.includes('| id|') || lower.includes('|id |')
  })

  if (headerIdx === -1) return null

  const headerLine = lines[headerIdx]
  const headers = headerLine
    .split('|')
    .map((h) => h.trim().replace(/\*\*/g, '').toLowerCase())
    .filter(Boolean)

  const tasks: KanbanTask[] = []

  // Skip separator line (headerIdx + 1)
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break

    const rawCells = line.split('|')
    // Remove first empty element (before leading |) and last empty element (after trailing |)
    const cells = rawCells.slice(1, rawCells.length - 1).map((c) => c.trim())

    if (isEmptyRow(cells)) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })

    const id = row['id']
    if (!id || isEmptyCell(id)) continue

    tasks.push({
      id,
      origin: normalizeOrigin(row['origin']),
      status: column,
      priority: normalizePriority(row['priority'] ?? row['prio'] ?? ''),
      repo: row['repo'] || 'all',
      description: row['description'] || row['desc'] || '',
      created: row['created'] || row['completed'] || '',
      updated: row['updated'] || row['completed'] || row['created'] || '',
      leadTime: row['lead time'] || row['leadtime'] || '—',
      completed: column === 'DONE' ? (row['completed'] || '') : undefined,
    })
  }

  return tasks
}

/**
 * Parse a vertical task block (detailed format used in DOING column when tasks are active).
 *
 * Format:
 *   | Field | Value |
 *   |-------|-------|
 *   | **ID** | FEAT-001 |
 *   | **Origin** | 👤 Human |
 *   ...
 */
function parseVerticalTaskBlock(block: string, column: KanbanColumn): KanbanTask | null {
  const rows = block.split('\n').filter((l) => l.trim().startsWith('|'))
  const fields: Record<string, string> = {}

  for (const row of rows) {
    const rawCells = row.split('|')
    const cells = rawCells.slice(1, rawCells.length - 1).map((c) => c.trim())
    if (cells.length >= 2) {
      const key = cells[0].replace(/\*\*/g, '').toLowerCase().trim()
      const value = cells.slice(1).join(' | ').trim()
      if (key && key !== 'field' && key !== '-' && key !== '—') {
        fields[key] = value
      }
    }
  }

  const id = fields['id']
  if (!id || isEmptyCell(id)) return null

  return {
    id,
    origin: normalizeOrigin(fields['origin']),
    status: column,
    priority: normalizePriority(fields['priority'] ?? ''),
    repo: fields['repo'] || 'all',
    description: fields['description'] || '',
    acceptanceCriteria: fields['acceptance criteria'],
    created: fields['created'] || '',
    updated: fields['updated'] || '',
    leadTime: fields['lead time'] || '—',
  }
}

/**
 * Parse all kanban markdown files into a flat list of KanbanTask objects.
 * Handles both horizontal table format (most columns) and vertical block format (DOING).
 */
export function parseKanbanFiles(files: Record<string, string>): KanbanTask[] {
  const tasks: KanbanTask[] = []

  for (const [filename, content] of Object.entries(files)) {
    const column = COLUMN_FROM_FILENAME[filename]
    if (!column) continue

    // Strip fenced code blocks so example tables are never parsed as real tasks
    const stripped = stripCodeFences(content)

    // Try horizontal table first (most common format).
    // null  → no header found → fall through to vertical
    // []    → header found but all rows are placeholder/empty → stop (don't fall through)
    // [...] → real tasks found → stop
    const horizontal = parseHorizontalTable(stripped, column)
    if (horizontal !== null) {
      tasks.push(...horizontal)
      continue
    }

    // Fallback: try vertical task blocks (detailed DOING format).
    // Only reached when the file has no horizontal table header at all.
    const paragraphs = stripped.split(/\n{2,}/)
    for (const para of paragraphs) {
      const hasIdField =
        para.toLowerCase().includes('| **id**') || para.toLowerCase().includes('| id |')
      if (!hasIdField) continue
      const task = parseVerticalTaskBlock(para, column)
      if (task) tasks.push(task)
    }
  }

  return tasks
}

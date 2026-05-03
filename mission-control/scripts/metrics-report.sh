#!/usr/bin/env bash
# mission-control/scripts/metrics-report.sh
# Generates a metrics report from local SQLite DB or REST API.
# Usage: ./metrics-report.sh [--days 30] [--json]
set -euo pipefail

DB_PATH="$(dirname "$0")/../metrics/workspace-metrics.db"
API_BASE="http://localhost:3099/api/metrics"
DAYS=30
JSON=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --days) DAYS="$2"; shift 2 ;;
    --json) JSON=true; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📊 Mission Control — Metrics Report${NC}"
echo -e "${CYAN}  Generated: $(date -u +"%Y-%m-%d %H:%M UTC")${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Try REST API first (server running)
if curl -s --max-time 2 "$API_BASE/summary" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Server reachable at $API_BASE${NC}\n"

  if [[ "$JSON" == true ]]; then
    curl -s "$API_BASE/export"
    exit 0
  fi

  SUMMARY=$(curl -s "$API_BASE/summary")
  SKILLS=$(curl -s "$API_BASE/skills")
  AGENTS=$(curl -s "$API_BASE/agents")
  MODELS=$(curl -s "$API_BASE/models")
  DAILY=$(curl -s "$API_BASE/tokens/daily?days=$DAYS")

  echo -e "${YELLOW}── Summary ────────────────────────────────────────${NC}"
  echo "$SUMMARY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Total Tokens  : {d.get(\"total_tokens_input\",0) + d.get(\"total_tokens_output\",0):,}  (in: {d.get(\"total_tokens_input\",0):,} | out: {d.get(\"total_tokens_output\",0):,})')
print(f'  Sessions      : {d.get(\"total_sessions\",0):,}')
print(f'  Events        : {d.get(\"total_events\",0):,}')
print(f'  Skills        : {d.get(\"total_skills_invoked\",0):,}  (unique: {d.get(\"unique_skills\",0)})')
print(f'  Agents        : {d.get(\"total_agents_invoked\",0):,}  (unique: {d.get(\"unique_agents\",0)})')
print(f'  Top Skill     : {d.get(\"top_skill\",\"-\")}')
print(f'  Top Agent     : {d.get(\"top_agent\",\"-\")}')
print(f'  Top Model     : {d.get(\"most_used_model\",\"-\")}')
" 2>/dev/null || echo "$SUMMARY"

  echo ""
  echo -e "${YELLOW}── Skills ─────────────────────────────────────────${NC}"
  echo "$SKILLS" | python3 -c "
import json, sys
rows = json.load(sys.stdin)
if not rows:
  print('  No skill data')
  sys.exit()
print(f'  {\"Skill\":<30} {\"Calls\":>6} {\"Tokens\":>10} {\"Avg ms\":>8}')
print('  ' + '-'*58)
for r in rows[:10]:
  t = r.get('total_tokens_input',0) + r.get('total_tokens_output',0)
  ms = r.get('avg_duration_ms') or 0
  print(f'  {r[\"skill_name\"]:<30} {r[\"invocations\"]:>6} {t:>10,} {int(ms):>7}ms')
" 2>/dev/null || echo "$SKILLS"

  echo ""
  echo -e "${YELLOW}── Agents ─────────────────────────────────────────${NC}"
  echo "$AGENTS" | python3 -c "
import json, sys
rows = json.load(sys.stdin)
if not rows:
  print('  No agent data')
  sys.exit()
print(f'  {\"Agent\":<30} {\"Calls\":>6} {\"Tokens\":>10} {\"Avg ms\":>8}')
print('  ' + '-'*58)
for r in rows[:10]:
  t = r.get('total_tokens_input',0) + r.get('total_tokens_output',0)
  ms = r.get('avg_duration_ms') or 0
  print(f'  {r[\"agent_name\"]:<30} {r[\"invocations\"]:>6} {t:>10,} {int(ms):>7}ms')
" 2>/dev/null || echo "$AGENTS"

  echo ""
  echo -e "${YELLOW}── Models ─────────────────────────────────────────${NC}"
  echo "$MODELS" | python3 -c "
import json, sys
rows = json.load(sys.stdin)
if not rows:
  print('  No model data')
  sys.exit()
for r in rows:
  t = r.get('total_tokens_input',0) + r.get('total_tokens_output',0)
  print(f'  {r[\"model\"]:<40} sessions: {r[\"sessions\"]:>4}  tokens: {t:>10,}')
" 2>/dev/null || echo "$MODELS"

  echo ""
  echo -e "${YELLOW}── Daily Trend (last $DAYS days) ──────────────────${NC}"
  echo "$DAILY" | python3 -c "
import json, sys
rows = json.load(sys.stdin)
if not rows:
  print('  No daily data')
  sys.exit()
max_t = max((r.get('tokens_input',0)+r.get('tokens_output',0)) for r in rows) or 1
for r in rows[-14:]:
  t = r.get('tokens_input',0) + r.get('tokens_output',0)
  bar = '█' * int((t / max_t) * 30)
  print(f'  {r[\"date\"]}  {bar:<30}  {t:>8,}')
" 2>/dev/null || echo "$DAILY"

  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Fall back to sqlite3 CLI if DB exists
elif [[ -f "$DB_PATH" ]] && command -v sqlite3 &>/dev/null; then
  echo -e "${YELLOW}⚠ Server not running — reading DB directly with sqlite3${NC}\n"

  echo -e "${YELLOW}── Summary ────────────────────────────────────────${NC}"
  sqlite3 "$DB_PATH" "
    SELECT
      'Sessions: ' || COUNT(*) FROM sessions;
  " 2>/dev/null || true
  sqlite3 "$DB_PATH" "
    SELECT
      'Events: ' || COUNT(*),
      'Skills invoked: ' || SUM(CASE WHEN event_type='skill_invoked' THEN 1 ELSE 0 END),
      'Agents invoked: ' || SUM(CASE WHEN event_type='agent_invoked' THEN 1 ELSE 0 END),
      'Total tokens in: ' || SUM(tokens_input),
      'Total tokens out: ' || SUM(tokens_output)
    FROM events;
  " 2>/dev/null | tr '|' '\n' | sed 's/^/  /' || true

  echo ""
  echo -e "${YELLOW}── Top 5 Skills ───────────────────────────────────${NC}"
  sqlite3 "$DB_PATH" "
    SELECT skill_name, COUNT(*) as calls, SUM(tokens_input+tokens_output) as tokens
    FROM events WHERE skill_name IS NOT NULL
    GROUP BY skill_name ORDER BY calls DESC LIMIT 5;
  " 2>/dev/null | awk -F'|' '{printf "  %-30s calls: %4s  tokens: %s\n",$1,$2,$3}' || echo "  No data"

  echo ""
  echo -e "${YELLOW}── Top 5 Agents ───────────────────────────────────${NC}"
  sqlite3 "$DB_PATH" "
    SELECT agent_name, COUNT(*) as calls, SUM(tokens_input+tokens_output) as tokens
    FROM events WHERE agent_name IS NOT NULL
    GROUP BY agent_name ORDER BY calls DESC LIMIT 5;
  " 2>/dev/null | awk -F'|' '{printf "  %-30s calls: %4s  tokens: %s\n",$1,$2,$3}' || echo "  No data"

  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

else
  echo -e "${RED}✗ Server not reachable and no local DB found.${NC}"
  echo ""
  echo "Start the server first:"
  echo "  cd mission-control/ui && npm run dev:server"
  echo ""
  echo "Or if this is first run, no metrics have been collected yet."
  exit 1
fi

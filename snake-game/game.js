'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const GRID       = 20;          // cells per side
const CELL       = 28;          // px per cell
const GAP        = 2;           // px between cells
const STEP       = CELL + GAP;
const CANVAS_PX  = GRID * STEP + GAP;
const TICK_MS    = 130;
const BEST_KEY   = 'snake-best-score';

const COLOR = {
  bg:     '#0f172a',
  grid:   '#1e293b',
  border: '#334155',
  head:   '#bbf7d0',
  body:   '#4ade80',
  food:   '#fbbf24',
  over:   'rgba(15,23,42,0.72)',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
};

// Directions as [dRow, dCol]
const DIR = {
  up:    [-1,  0],
  down:  [ 1,  0],
  left:  [ 0, -1],
  right: [ 0,  1],
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const KEY_DIR = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
};

// ── State ────────────────────────────────────────────────────────────────────

let snake      = [];       // array of {r, c}; index 0 is head
let food       = null;     // {r, c}
let dir        = 'right';
let nextDir    = 'right';
let score      = 0;
let best       = 0;
let state      = 'idle';   // idle | running | paused | game-over
let loopId     = null;

// ── DOM ──────────────────────────────────────────────────────────────────────

const canvas     = document.getElementById('canvas');
const ctx        = canvas.getContext('2d');
const scoreEl    = document.getElementById('score-value');
const bestEl     = document.getElementById('best-value');
const badgeEl    = document.getElementById('state-badge');
const btnStart   = document.getElementById('btn-start');
const btnPause   = document.getElementById('btn-pause');

canvas.width  = CANVAS_PX;
canvas.height = CANVAS_PX;
canvas.style.width  = CANVAS_PX + 'px';
canvas.style.height = CANVAS_PX + 'px';

// ── Helpers ──────────────────────────────────────────────────────────────────

function cellToXY(r, c) {
  return [GAP + c * STEP, GAP + r * STEP];
}

function randomFood(occupied) {
  const set = new Set(occupied.map(({ r, c }) => r + ',' + c));
  const free = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (!set.has(r + ',' + c)) free.push({ r, c });
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : occupied[0];
}

function loadBest() {
  const v = parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10);
  best = isFinite(v) ? v : 0;
  bestEl.textContent = best;
}

function saveBest() {
  if (score > best) {
    best = score;
    localStorage.setItem(BEST_KEY, String(best));
    bestEl.textContent = best;
  }
}

function setScore(n) {
  score = n;
  scoreEl.textContent = score;
}

function setBadge(s) {
  state = s;
  const labels = { idle: 'Idle', running: 'Running', paused: 'Paused', 'game-over': 'Game Over' };
  badgeEl.textContent = labels[s] ?? s;
  badgeEl.className   = 'badge--' + s;
}

// ── Draw ─────────────────────────────────────────────────────────────────────

function drawCell(r, c, color, radius) {
  const [x, y] = cellToXY(r, c);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, CELL, CELL, radius ?? 6);
  ctx.fill();
}

function draw() {
  // Background
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

  // Grid dots
  ctx.fillStyle = COLOR.grid;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      drawCell(r, c, COLOR.grid, 4);
    }
  }

  // Food
  if (food) {
    const [fx, fy] = cellToXY(food.r, food.c);
    // Glow
    ctx.save();
    ctx.shadowColor = COLOR.food;
    ctx.shadowBlur  = 14;
    drawCell(food.r, food.c, COLOR.food, 10);
    ctx.restore();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(fx + 4, fy + 3, CELL - 16, 5, 3);
    ctx.fill();
  }

  // Snake body
  for (let i = snake.length - 1; i > 0; i--) {
    drawCell(snake[i].r, snake[i].c, COLOR.body, 6);
  }

  // Snake head
  if (snake.length > 0) {
    const { r, c } = snake[0];
    ctx.save();
    ctx.shadowColor = COLOR.head;
    ctx.shadowBlur  = 12;
    drawCell(r, c, COLOR.head, 8);
    ctx.restore();
  }

  // Game-over overlay
  if (state === 'game-over') {
    ctx.fillStyle = COLOR.over;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.text;
    ctx.font = 'bold 22px system-ui';
    ctx.fillText('Game Over', CANVAS_PX / 2, CANVAS_PX / 2 - 18);
    ctx.font = '14px system-ui';
    ctx.fillStyle = COLOR.muted;
    ctx.fillText('Score: ' + score + ' · Press Enter or Start', CANVAS_PX / 2, CANVAS_PX / 2 + 14);
  }

  // Paused overlay
  if (state === 'paused') {
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.text;
    ctx.font = 'bold 20px system-ui';
    ctx.fillText('Paused', CANVAS_PX / 2, CANVAS_PX / 2);
  }
}

// ── Game logic ────────────────────────────────────────────────────────────────

function initSnake() {
  const midRow = Math.floor(GRID / 2);
  const midCol = Math.floor(GRID / 2);
  return [
    { r: midRow, c: midCol },
    { r: midRow, c: midCol - 1 },
    { r: midRow, c: midCol - 2 },
  ];
}

function resetGame() {
  snake   = initSnake();
  dir     = 'right';
  nextDir = 'right';
  setScore(0);
  food = randomFood(snake);
}

function beginGame() {
  resetGame();
  setBadge('running');
  btnStart.textContent = 'Restart';
  btnPause.disabled    = false;
  btnPause.textContent = 'Pause';
  startLoop();
}

function endGame() {
  stopLoop();
  saveBest();
  setBadge('game-over');
  btnPause.disabled = true;
  draw();
}

function step() {
  dir = nextDir;
  const { r, c }  = snake[0];
  const [dr, dc]  = DIR[dir];
  const nr = r + dr;
  const nc = c + dc;

  // Wall collision
  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) {
    endGame();
    return;
  }

  // Self collision (exclude tail tip which will move away)
  const isGrowing = nr === food.r && nc === food.c;
  const bodyCheck  = isGrowing ? snake : snake.slice(0, -1);
  if (bodyCheck.some(({ r: br, c: bc }) => br === nr && bc === nc)) {
    endGame();
    return;
  }

  const newSnake = [{ r: nr, c: nc }, ...snake];

  if (isGrowing) {
    setScore(score + 1);
    saveBest();
    if (newSnake.length === GRID * GRID) {
      snake = newSnake;
      endGame();
      return;
    }
    food = randomFood(newSnake);
  } else {
    newSnake.pop();
  }

  snake = newSnake;
  draw();
}

// ── Loop ──────────────────────────────────────────────────────────────────────

function startLoop() {
  stopLoop();
  loopId = setInterval(step, TICK_MS);
}

function stopLoop() {
  if (loopId !== null) { clearInterval(loopId); loopId = null; }
}

// ── Pause ─────────────────────────────────────────────────────────────────────

function togglePause() {
  if (state === 'running') {
    stopLoop();
    setBadge('paused');
    btnPause.textContent = 'Resume';
    draw();
  } else if (state === 'paused') {
    setBadge('running');
    btnPause.textContent = 'Pause';
    startLoop();
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    if (state === 'running' || state === 'paused') togglePause();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    beginGame();
    return;
  }

  const d = KEY_DIR[e.key];
  if (!d) return;
  e.preventDefault();

  // Disallow reversal
  if (snake.length > 1 && OPPOSITE[nextDir] === d) return;
  nextDir = d;

  // Allow a direction key to start the game from idle
  if (state === 'idle') beginGame();
});

btnStart.addEventListener('click', beginGame);
btnPause.addEventListener('click', togglePause);

// ── Init ──────────────────────────────────────────────────────────────────────

loadBest();
resetGame();
setBadge('idle');
draw();

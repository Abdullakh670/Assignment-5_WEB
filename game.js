'use strict';

/* ==========================================================
   Task 1 · Height Duel (Higher or Lower)
   Option A: guess whether the next random landmark is higher
   or lower. 3 lives, streak counter, best streak.
   ========================================================== */

// ---------- Constants: every number of the game lives here ----------
const START_LIVES = 3;          // lives at the start of a game
const WIN_STREAK = 10;          // right guesses in a row needed to win
const HISTORY_LENGTH = 5;       // how many last rounds are shown
const MIN_ITEMS = 2;            // the game needs at least two different items
const STORAGE_KEY = 'a5-height-duel-best';

const MOVE_HIGHER = 'higher';
const MOVE_LOWER = 'lower';
const KEY_TO_MOVE = { h: MOVE_HIGHER, l: MOVE_LOWER };

// Data: approximate heights in metres
const ITEMS = [
  { name: 'Statue of Liberty', height: 93 },
  { name: 'Elizabeth Tower (Big Ben)', height: 96 },
  { name: 'Bayterek Tower, Astana', height: 97 },
  { name: 'Great Pyramid of Giza', height: 139 },
  { name: 'Khan Shatyr, Astana', height: 150 },
  { name: 'Space Needle', height: 184 },
  { name: 'Sydney Tower', height: 309 },
  { name: 'Eiffel Tower', height: 330 },
  { name: 'Empire State Building', height: 443 },
  { name: 'Petronas Towers', height: 452 },
  { name: 'Lakhta Center', height: 462 },
  { name: 'Taipei 101', height: 508 },
  { name: 'CN Tower', height: 553 },
  { name: 'Shanghai Tower', height: 632 },
  { name: 'Tokyo Skytree', height: 634 },
  { name: 'Burj Khalifa', height: 828 }
];

// ---------- DOM references ----------
const el = {
  lives: document.getElementById('lives'),
  streak: document.getElementById('streak'),
  best: document.getElementById('best'),
  goal: document.getElementById('goal'),
  goalLabel: document.getElementById('goal-label'),
  banner: document.getElementById('banner'),
  currentName: document.getElementById('current-name'),
  currentValue: document.getElementById('current-value'),
  nextName: document.getElementById('next-name'),
  nextValue: document.getElementById('next-value'),
  nextCard: document.getElementById('card-next'),
  higher: document.getElementById('btn-higher'),
  lower: document.getElementById('btn-lower'),
  restart: document.getElementById('btn-restart'),
  message: document.getElementById('message'),
  history: document.getElementById('history')
};

// ---------- State ----------
let state;

/** Whole number from min to max, both included. */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random index of ITEMS that is different from `exclude`. */
function pickIndex(exclude) {
  let index = randomInt(0, ITEMS.length - 1);
  while (index === exclude) {
    index = randomInt(0, ITEMS.length - 1);
  }
  return index;
}

function loadBest() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(saved) && saved >= 0 ? saved : 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(value) {
  try { localStorage.setItem(STORAGE_KEY, String(value)); } catch (error) { /* storage unavailable */ }
}

function newGame() {
  const currentIndex = randomInt(0, ITEMS.length - 1);
  state = {
    lives: START_LIVES,
    streak: 0,
    best: loadBest(),
    status: 'playing',            // 'playing' | 'won' | 'lost'
    currentIndex,
    nextIndex: pickIndex(currentIndex),
    history: []
  };
  setMessage('New game! Is the landmark on the right higher or lower?', '');
  render();
  el.higher.focus();
}

// ---------- Rendering: shows the state after every move ----------
function setMessage(text, kind) {
  el.message.textContent = text;
  el.message.classList.toggle('is-error', kind === 'error');
  el.message.classList.toggle('is-success', kind === 'success');
  el.message.classList.toggle('is-warn', kind === 'warn');
}

function render() {
  const current = ITEMS[state.currentIndex];
  const next = ITEMS[state.nextIndex];
  const playing = state.status === 'playing';

  el.lives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(START_LIVES - state.lives);
  el.lives.setAttribute('aria-label', state.lives + ' of ' + START_LIVES + ' lives left');
  el.streak.textContent = state.streak;
  el.best.textContent = state.best;
  el.goal.max = WIN_STREAK;
  el.goal.value = state.streak;
  el.goalLabel.textContent = 'Goal: ' + state.streak + ' / ' + WIN_STREAK;

  el.currentName.textContent = current.name;
  el.currentValue.textContent = current.height + ' m';
  el.nextName.textContent = next.name;
  el.nextValue.textContent = '?';

  el.higher.disabled = !playing;
  el.lower.disabled = !playing;

  el.banner.hidden = playing;
  el.banner.classList.toggle('is-win', state.status === 'won');
  el.banner.classList.toggle('is-lose', state.status === 'lost');
  if (state.status === 'won') {
    el.banner.textContent = 'You win! ' + WIN_STREAK + ' right guesses in a row.';
  } else if (state.status === 'lost') {
    el.banner.textContent = 'Game over. You ran out of lives. Best streak: ' + state.best + '.';
  }

  renderHistory();
}

function renderHistory() {
  el.history.replaceChildren();
  if (state.history.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No rounds yet.';
    el.history.append(li);
    return;
  }
  const last = state.history.slice(-HISTORY_LENGTH).reverse();
  for (const entry of last) {
    const li = document.createElement('li');
    li.classList.add(entry.right ? 'is-right' : 'is-wrong');
    li.textContent = entry.text;
    el.history.append(li);
  }
}

// ---------- Game logic ----------
function play(move) {
  // Rejections: the state is NOT changed
  if (state.status !== 'playing') {
    setMessage('The game is over. Press Restart to play again.', 'warn');
    return;
  }
  if (move !== MOVE_HIGHER && move !== MOVE_LOWER) {
    setMessage('Invalid move. Choose "higher" or "lower".', 'error');
    return;
  }

  const current = ITEMS[state.currentIndex];
  const next = ITEMS[state.nextIndex];

  // Equal values count as a right guess: >= for higher, <= for lower
  const right =
    (move === MOVE_HIGHER && next.height >= current.height) ||
    (move === MOVE_LOWER && next.height <= current.height);

  let text;
  if (right) {
    state.streak += 1;
    if (state.streak > state.best) {
      state.best = state.streak;
      saveBest(state.best);
    }
    text = 'Right: ' + next.name + ' is ' + next.height + ' m (' + move + ' than ' + current.height + ' m).';
  } else {
    state.lives -= 1;
    state.streak = 0;
    text = 'Wrong: ' + next.name + ' is ' + next.height + ' m, you said ' + move + '.';
  }
  state.history.push({ right, text });

  // Three possible end conditions
  if (state.streak === WIN_STREAK) {
    state.status = 'won';
  } else if (state.lives === 0) {
    state.status = 'lost';
  }

  // The revealed item becomes the current one; a new hidden item is drawn
  state.currentIndex = state.nextIndex;
  if (state.status === 'playing') {
    state.nextIndex = pickIndex(state.currentIndex);
  }

  setMessage(text, right ? 'success' : 'error');
  render();
}

// ---------- Events ----------
el.higher.addEventListener('click', () => play(el.higher.dataset.move));
el.lower.addEventListener('click', () => play(el.lower.dataset.move));
el.restart.addEventListener('click', newGame);

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length !== 1) return;              // ignore Tab, Enter, arrows...
  if (event.target.closest && event.target.closest('button') && event.key === ' ') return;
  const move = KEY_TO_MOVE[event.key.toLowerCase()];
  if (move === undefined) {
    if (event.key !== ' ') setMessage('Invalid key "' + event.key + '". Use H for higher or L for lower.', 'error');
    return;
  }
  play(move);
});

if (ITEMS.length >= MIN_ITEMS) {
  newGame();
} else {
  setMessage('Not enough items to play.', 'error');
}

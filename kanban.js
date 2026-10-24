'use strict';

/* ==========================================================
   Task 2 · Kanban board (Option A)
   The page is built from the `tasks` array. HTML has only
   empty containers. Every change calls render().
   ========================================================== */

// ---------- Constants ----------
const WIP_LIMIT = 3;             // max cards in the middle column
const MAX_HOURS = 20;
const MIN_TITLE = 3;
const PRIORITY_NAMES = { 1: 'High', 2: 'Medium', 3: 'Low' };
const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' }
];
const TAGS = ['game', 'data', 'form', 'style', 'report'];
const DOING = 'doing';

// ---------- Data: objects with id and properties of different types ----------
let tasks = [
  { id: 1,  title: 'Write game constants',        tag: 'game',   priority: 2, hours: 1, urgent: false, column: 'done' },
  { id: 2,  title: 'Random number function',      tag: 'game',   priority: 1, hours: 2, urgent: false, column: 'done' },
  { id: 3,  title: 'Lives and streak counter',    tag: 'game',   priority: 1, hours: 3, urgent: true,  column: 'doing' },
  { id: 4,  title: 'Describe tasks as an array',  tag: 'data',   priority: 2, hours: 2, urgent: false, column: 'doing' },
  { id: 5,  title: 'Render function',             tag: 'data',   priority: 1, hours: 4, urgent: true,  column: 'doing' },
  { id: 6,  title: 'Search and tag filter',       tag: 'data',   priority: 2, hours: 3, urgent: false, column: 'todo' },
  { id: 7,  title: 'Form layout',                 tag: 'form',   priority: 3, hours: 2, urgent: false, column: 'todo' },
  { id: 8,  title: 'Live validation rules',       tag: 'form',   priority: 1, hours: 5, urgent: true,  column: 'todo' },
  { id: 9,  title: 'Ticket preview card',         tag: 'form',   priority: 2, hours: 3, urgent: false, column: 'todo' },
  { id: 10, title: 'Colors and focus styles',     tag: 'style',  priority: 3, hours: 2, urgent: false, column: 'todo' },
  { id: 11, title: 'Check 375px and 1280px',      tag: 'style',  priority: 2, hours: 1, urgent: false, column: 'todo' },
  { id: 12, title: 'Screenshots and report',      tag: 'report', priority: 1, hours: 4, urgent: false, column: 'todo' }
];
let nextId = tasks.length + 1;

// ---------- State of filters and message ----------
const view = { query: '', tag: 'all', sort: 'default' };
let message = { text: 'Use the buttons on the cards to move them.', kind: '' };

// ---------- DOM ----------
const board = document.getElementById('board');
const searchInput = document.getElementById('search');
const tagFilter = document.getElementById('tag-filter');
const sortSelect = document.getElementById('sort');
const clearBtn = document.getElementById('clear-filters');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const messageBox = document.getElementById('message');
const emptyState = document.getElementById('empty-state');
const addForm = document.getElementById('add-form');
const newTitle = document.getElementById('new-title');
const newTag = document.getElementById('new-tag');
const newPriority = document.getElementById('new-priority');
const newHours = document.getElementById('new-hours');
const addError = document.getElementById('add-error');

// ---------- Helpers ----------
function countIn(columnId) {
  let count = 0;
  for (const task of tasks) {
    if (task.column === columnId) count += 1;
  }
  return count;
}

/** Own loop: finished cards and hours (not the whole array, only done ones). */
function calcProgress() {
  let doneCount = 0, doneHours = 0, totalHours = 0;
  for (let i = 0; i < tasks.length; i++) {
    totalHours += tasks[i].hours;
    if (tasks[i].column === 'done') {
      doneCount += 1;
      doneHours += tasks[i].hours;
    }
  }
  return { doneCount, doneHours, totalHours };
}

function getVisibleTasks() {
  const query = view.query.trim().toLowerCase();
  return tasks.filter((task) =>
    (view.tag === 'all' || task.tag === view.tag) &&
    (query === '' || task.title.toLowerCase().includes(query))
  );
}

function setMessage(text, kind) {
  message = { text, kind };
}

// ---------- The one render function ----------
function render() {
  renderTagOptions(tagFilter, true);
  renderTagOptions(newTag, false);

  const visible = getVisibleTasks();
  board.replaceChildren();

  for (const column of COLUMNS) {
    let cards = visible.filter((task) => task.column === column.id);
    if (view.sort === 'priority') {
      cards = cards.slice().sort((a, b) => a.priority - b.priority);
    }
    board.append(buildColumn(column, cards));
  }

  // Empty result of search / filter
  emptyState.hidden = visible.length > 0;
  if (visible.length === 0) {
    emptyState.textContent = 'Nothing found. No card matches "' + view.query.trim() + '"' +
      (view.tag === 'all' ? '' : ' with tag "' + view.tag + '"') + '. Try another word or clear the filters.';
  }

  // Progress bar
  const p = calcProgress();
  progress.max = tasks.length;
  progress.value = p.doneCount;
  const percent = tasks.length === 0 ? 0 : Math.round((p.doneCount / tasks.length) * 100);
  progressText.textContent = p.doneCount + ' of ' + tasks.length + ' cards done (' + percent + '%), ' +
    p.doneHours + ' of ' + p.totalHours + ' hours';

  // Message
  messageBox.textContent = message.text;
  messageBox.classList.toggle('is-error', message.kind === 'error');
  messageBox.classList.toggle('is-success', message.kind === 'success');
}

function renderTagOptions(select, withAll) {
  const previous = select.value;
  const tags = [];
  for (const task of tasks) {
    if (!tags.includes(task.tag)) tags.push(task.tag);
  }
  select.replaceChildren();
  if (withAll) {
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All tags';
    select.append(all);
  }
  for (const tag of tags) {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    select.append(option);
  }
  if (previous && Array.from(select.options).some((o) => o.value === previous)) {
    select.value = previous;
  }
}

function buildColumn(column, cards) {
  const section = document.createElement('section');
  section.className = 'column';
  section.setAttribute('aria-label', column.title);

  const total = countIn(column.id);
  const head = document.createElement('div');
  head.className = 'column-head';
  const title = document.createElement('h2');
  title.textContent = column.title;
  const count = document.createElement('span');
  count.className = 'count';
  if (column.id === DOING) {
    count.textContent = total + ' / ' + WIP_LIMIT;
    const full = total >= WIP_LIMIT;
    count.classList.toggle('is-full', full);
    section.classList.toggle('is-full', full);
  } else {
    count.textContent = String(total);
  }
  head.append(title, count);
  section.append(head);

  if (cards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = total === 0 ? 'No cards here yet.' : 'No cards match the filters.';
    section.append(empty);
    return section;
  }
  for (const task of cards) {
    section.append(buildCard(task));
  }
  return section;
}

function buildCard(task) {
  const card = document.createElement('article');
  card.classList.add('task', 'prio-' + task.priority);
  card.classList.toggle('is-done', task.column === 'done');
  card.dataset.id = String(task.id);

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const tag = document.createElement('span');
  tag.className = 'chip';
  tag.textContent = task.tag;
  const prio = document.createElement('span');
  prio.className = 'chip';
  prio.textContent = PRIORITY_NAMES[task.priority] + ' priority';
  const hours = document.createElement('span');
  hours.className = 'chip';
  hours.textContent = task.hours + ' h';
  meta.append(tag, prio, hours);
  if (task.urgent) {
    const urgent = document.createElement('span');
    urgent.className = 'chip urgent';
    urgent.textContent = 'urgent';
    meta.append(urgent);
  }

  const buttons = document.createElement('div');
  buttons.className = 'btn-row';
  const index = COLUMNS.findIndex((c) => c.id === task.column);
  if (index > 0) buttons.append(buildButton('left', task, '← ' + COLUMNS[index - 1].title));
  if (index < COLUMNS.length - 1) buttons.append(buildButton('right', task, COLUMNS[index + 1].title + ' →'));

  card.append(title, meta, buttons);
  return card;
}

function buildButton(direction, task, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-small';
  button.dataset.action = 'move';
  button.dataset.direction = direction;
  button.dataset.id = String(task.id);
  button.textContent = label;
  button.setAttribute('aria-label', label.replace(/[←→]/g, '').trim() + ': ' + task.title);
  return button;
}

// ---------- Actions: change the data first, then render ----------
function moveTask(id, direction) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const from = COLUMNS.findIndex((c) => c.id === task.column);
  const to = direction === 'right' ? from + 1 : from - 1;
  if (to < 0 || to >= COLUMNS.length) return;
  const target = COLUMNS[to];

  // Rule: the middle column holds at most WIP_LIMIT cards
  if (target.id === DOING && countIn(DOING) >= WIP_LIMIT) {
    setMessage('Blocked: "' + task.title + '" cannot go to In progress. The column already has ' +
      WIP_LIMIT + ' cards (limit ' + WIP_LIMIT + '). Finish or move one back first.', 'error');
    render();
    return;
  }
  task.column = target.id;
  setMessage('"' + task.title + '" moved to ' + target.title + '.', 'success');
  render();
}

function addTask(event) {
  event.preventDefault();
  const title = newTitle.value.trim();
  const hours = Number(newHours.value);
  let error = '';
  let badField = null;
  if (title.length < MIN_TITLE) {
    error = 'Title needs at least ' + MIN_TITLE + ' characters.';
    badField = newTitle;
  } else if (tasks.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
    error = 'A card with this title already exists.';
    badField = newTitle;
  } else if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    error = 'Hours must be a whole number from 1 to ' + MAX_HOURS + '.';
    badField = newHours;
  }
  newTitle.setAttribute('aria-invalid', badField === newTitle ? 'true' : 'false');
  newHours.setAttribute('aria-invalid', badField === newHours ? 'true' : 'false');
  addError.textContent = error;
  if (badField) {
    badField.focus();
    return;
  }
  tasks.push({
    id: nextId++,
    title,
    tag: newTag.value || TAGS[0],
    priority: Number(newPriority.value),
    hours,
    urgent: Number(newPriority.value) === 1,
    column: 'todo'
  });
  addForm.reset();
  newTitle.setAttribute('aria-invalid', 'false');
  newHours.setAttribute('aria-invalid', 'false');
  setMessage('Card "' + title + '" added to To do.', 'success');
  render();
}

// ---------- Events ----------
// One listener on the container for the buttons of all cards (event delegation)
board.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="move"]');
  if (!button) return;
  moveTask(Number(button.dataset.id), button.dataset.direction);
});

searchInput.addEventListener('input', () => { view.query = searchInput.value; render(); });
tagFilter.addEventListener('change', () => { view.tag = tagFilter.value; render(); });
sortSelect.addEventListener('change', () => { view.sort = sortSelect.value; render(); });
clearBtn.addEventListener('click', () => {
  view.query = ''; view.tag = 'all'; view.sort = 'default';
  searchInput.value = ''; sortSelect.value = 'default'; tagFilter.value = 'all';
  setMessage('Filters cleared.', '');
  render();
});
addForm.addEventListener('submit', addTask);

render();

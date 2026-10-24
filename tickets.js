'use strict';

/* ==========================================================
   Task 3 · Ticket builder (Option A)
   Live preview, live validation, result built with the DOM.
   ========================================================== */

// ---------- Constants ----------
const MAX_QTY = 6;
const CODE_LENGTH = 6;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CURRENCY = '₸';

// ---------- Data (arrays of objects) ----------
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const todayISO = addDays(0);

const events = [
  { id: 'rock',  name: 'Astana Rock Night', place: 'Barys Arena',
    shows: [{ date: addDays(7),  soldOut: false }, { date: addDays(14), soldOut: true },  { date: addDays(21), soldOut: false }] },
  { id: 'opera', name: 'Opera Gala',        place: 'Astana Opera',
    shows: [{ date: addDays(10), soldOut: false }, { date: addDays(17), soldOut: false }, { date: addDays(24), soldOut: true }] },
  { id: 'hack',  name: 'AITU Hack Final',   place: 'Astana IT University',
    shows: [{ date: addDays(5),  soldOut: true },  { date: addDays(12), soldOut: false }, { date: addDays(19), soldOut: false }] }
];

const ticketTypes = [
  { id: 'standard', name: 'Standard', price: 5000,  seatsLeft: 12 },
  { id: 'vip',      name: 'VIP',      price: 15000, seatsLeft: 4 },
  { id: 'student',  name: 'Student',  price: 2500,  seatsLeft: 8 }
];

const promoCodes = [
  { code: 'AITU20',    percent: 20, onlyType: null },
  { code: 'WELCOME10', percent: 10, onlyType: null },
  { code: 'VIPONLY25', percent: 25, onlyType: 'vip' }
];

// Order of the fields = order in the form (used to focus the first error)
const FIELDS = ['event', 'date', 'type', 'quantity', 'promo', 'name', 'email'];

// ---------- DOM ----------
const form = document.getElementById('ticket-form');
form.noValidate = true;                       // browser messages off, checkValidity() still works
const summary = document.getElementById('error-summary');
const resultBox = document.getElementById('result');
const controls = {};
const errorBoxes = {};
for (const name of FIELDS) {
  controls[name] = document.getElementById(name);
  errorBoxes[name] = document.getElementById(name + '-error');
}
const dateHint = document.getElementById('date-hint');
controls.date.min = todayISO;

const pv = {
  event: document.getElementById('pv-event'), date: document.getElementById('pv-date'),
  type: document.getElementById('pv-type'),   qty: document.getElementById('pv-qty'),
  name: document.getElementById('pv-name'),   email: document.getElementById('pv-email'),
  promo: document.getElementById('pv-promo'), total: document.getElementById('pv-total')
};

// ---------- State ----------
const touched = new Set();      // fields the user has left at least once
let submitted = false;          // after a submit attempt, all fields are checked live

// ---------- Helpers ----------
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function formatMoney(n) { return n.toLocaleString('en-US').replace(/,/g, ' ') + ' ' + CURRENCY; }
function findEvent(id) { return events.find((e) => e.id === id); }
function findType(id) { return ticketTypes.find((t) => t.id === id); }
function findPromo(code) { return promoCodes.find((p) => p.code === code.trim().toUpperCase()); }

function values() {
  const v = {};
  for (const name of FIELDS) v[name] = controls[name].value;
  return v;
}

function generateBookingCode() {
  let code = 'TK-';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length - 1)];
  }
  return code;
}

// ---------- Validation rules (what HTML attributes cannot express) ----------
const validators = {
  event(v) {
    return v.event === '' ? 'Choose an event.' : '';
  },
  // Rule 1: the date must be an upcoming show of the chosen event and must not be sold out
  date(v) {
    if (v.date === '') return 'Choose a date.';
    if (v.date < todayISO) return 'This date is in the past. Choose an upcoming date.';
    const ev = findEvent(v.event);
    if (!ev) return 'Choose an event first, then pick one of its dates.';
    const show = ev.shows.find((s) => s.date === v.date);
    if (!show) return 'There is no show on this date. See the available dates under the field.';
    if (show.soldOut) return 'This date is sold out. Choose another date.';
    return '';
  },
  type(v) {
    return v.type === '' ? 'Choose a ticket type.' : '';
  },
  // Rule 2: quantity cannot exceed the seats left of the chosen type
  quantity(v) {
    if (v.quantity.trim() === '') return 'Enter the number of tickets.';
    const q = Number(v.quantity);
    if (!Number.isInteger(q)) return 'Quantity must be a whole number.';
    if (q < 1 || q > MAX_QTY) return 'You can book from 1 to ' + MAX_QTY + ' tickets.';
    const type = findType(v.type);
    if (type && type.seatsLeft === 0) return type.name + ' tickets are sold out.';
    if (type && q > type.seatsLeft) return 'Only ' + type.seatsLeft + ' ' + type.name + ' seats left. Lower the quantity.';
    return '';
  },
  // Rule 3: promo code must exist; some codes work only with one ticket type
  promo(v) {
    const code = v.promo.trim();
    if (code === '') return '';
    const promo = findPromo(code);
    if (!promo) return 'Unknown promo code "' + code + '". Check the spelling.';
    if (promo.onlyType !== null && v.type !== promo.onlyType) {
      return 'Code ' + promo.code + ' works only with ' + findType(promo.onlyType).name + ' tickets.';
    }
    return '';
  },
  // Rule 4: full name = two or more words, letters only
  name(v) {
    const name = v.name.trim();
    if (name === '') return 'Enter your first and last name.';
    if (!/^[\p{L}][\p{L}'\- ]*$/u.test(name)) return 'Use letters, spaces, hyphens and apostrophes only (no digits).';
    if (name.split(/\s+/).length < 2) return 'Enter both first and last name.';
    return '';
  },
  // Rule 5: email needs a real domain with a dot (type="email" accepts "a@b")
  email(v) {
    const email = v.email.trim();
    if (email === '') return 'Enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) return 'Email must look like name@mail.com (the domain needs a dot).';
    return '';
  }
};

/** Check one field, show or clear its message, return the message. */
function validateField(name) {
  const message = validators[name](values());
  const control = controls[name];
  errorBoxes[name].textContent = message;
  control.setAttribute('aria-invalid', message ? 'true' : 'false');
  control.classList.toggle('is-valid', !message && control.value.trim() !== '');
  return message;
}

function clearFieldStates() {
  for (const name of FIELDS) {
    errorBoxes[name].textContent = '';
    controls[name].removeAttribute('aria-invalid');
    controls[name].classList.remove('is-valid');
  }
}

// ---------- Select options built from data ----------
function renderSelects() {
  const eventValue = controls.event.value;
  const typeValue = controls.type.value;
  controls.event.replaceChildren(makeOption('', 'Choose an event'));
  for (const ev of events) controls.event.append(makeOption(ev.id, ev.name + ' · ' + ev.place));
  controls.type.replaceChildren(makeOption('', 'Choose a type'));
  for (const t of ticketTypes) {
    const label = t.name + ' · ' + formatMoney(t.price) + ' · ' + (t.seatsLeft === 0 ? 'sold out' : t.seatsLeft + ' left');
    controls.type.append(makeOption(t.id, label));
  }
  controls.event.value = eventValue;
  controls.type.value = typeValue;
}
function makeOption(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

function renderDateHint() {
  const ev = findEvent(controls.event.value);
  if (!ev) { dateHint.textContent = 'Choose an event to see its dates.'; return; }
  dateHint.textContent = 'Shows: ' + ev.shows.map((s) => s.date + (s.soldOut ? ' (sold out)' : '')).join(', ');
}

// ---------- Live preview ----------
function renderPreview() {
  const v = values();
  const ev = findEvent(v.event);
  const type = findType(v.type);
  const qty = Number(v.quantity);
  const promo = findPromo(v.promo);
  const promoOk = promo && (promo.onlyType === null || promo.onlyType === v.type);

  pv.event.textContent = ev ? ev.name : 'Choose an event';
  pv.date.textContent = v.date || '—';
  pv.type.textContent = type ? type.name : '—';
  pv.qty.textContent = Number.isInteger(qty) && qty > 0 ? String(qty) : '—';
  pv.name.textContent = v.name.trim() || '—';
  pv.email.textContent = v.email.trim() || '—';
  pv.promo.textContent = promoOk ? promo.code + ' (−' + promo.percent + '%)' : '—';

  let total = 0;
  if (type && Number.isInteger(qty) && qty > 0) {
    total = type.price * qty;
    if (promoOk) total = Math.round(total * (100 - promo.percent) / 100);
  }
  pv.total.textContent = formatMoney(total);
}

// ---------- Events ----------
// Checked on blur (focusout bubbles), then on every input
form.addEventListener('focusout', (event) => {
  const name = event.target.id;
  if (!FIELDS.includes(name)) return;
  touched.add(name);
  validateField(name);
});

form.addEventListener('input', (event) => {
  if (event.target.id === 'event') renderDateHint();
  renderPreview();
  // Fields depend on each other (date <-> event, quantity <-> type, promo <-> type)
  for (const name of FIELDS) {
    if (touched.has(name) || submitted) validateField(name);
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitted = true;
  const invalid = FIELDS.filter((name) => validateField(name) !== '');

  if (invalid.length > 0) {
    summary.hidden = false;
    summary.textContent = invalid.length + (invalid.length === 1 ? ' error' : ' errors') + ' found. Fix the marked fields and send the form again.';
    controls[invalid[0]].focus();
    return;
  }

  summary.hidden = true;
  const v = values();
  const ev = findEvent(v.event);
  const type = findType(v.type);
  const qty = Number(v.quantity);
  const promo = v.promo.trim() === '' ? null : findPromo(v.promo);

  type.seatsLeft -= qty;                       // seats are taken
  const code = generateBookingCode();
  const total = promo ? Math.round(type.price * qty * (100 - promo.percent) / 100) : type.price * qty;
  showResult({ code, ev, date: v.date, type, qty, name: v.name.trim(), email: v.email.trim(), promo, total });

  form.reset();
  touched.clear();
  submitted = false;
  clearFieldStates();
  renderSelects();
  renderDateHint();
  renderPreview();
});

function showResult(r) {
  const box = document.createElement('div');
  box.className = 'ticket is-final';
  box.tabIndex = -1;

  const title = document.createElement('h3');
  title.textContent = 'Booking confirmed';
  const label = document.createElement('p');
  label.textContent = 'Your booking code:';
  const code = document.createElement('div');
  code.className = 'booking-code';
  code.textContent = r.code;

  const list = document.createElement('dl');
  const rows = [
    ['Event', r.ev.name + ', ' + r.ev.place],
    ['Date', r.date],
    ['Type', r.type.name + ' × ' + r.qty],
    ['Name', r.name],
    ['Email', r.email],
    ['Promo', r.promo ? r.promo.code + ' (−' + r.promo.percent + '%)' : 'none'],
    ['Paid', formatMoney(r.total)]
  ];
  for (const [term, value] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  box.append(title, label, code, list);
  resultBox.replaceChildren(box);
  box.focus();
}

// ---------- Start ----------
renderSelects();
renderDateHint();
renderPreview();

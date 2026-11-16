// MigraineEase web app. No build step, no server: everything runs and is stored on this device.
'use strict';

/* ================= helpers ================= */
const KEY = 'migraineease.v1';
const VERSION = '1.0';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const D = x => new Date(x);
const pad = n => String(n).padStart(2, '0');

function icon(name, cls = '') {
  let d = ICONS[name] || ICONS.star, fill = false;
  if (d.startsWith('F:')) { fill = true; d = d.slice(2); }
  return `<svg class="ic ${fill ? 'fill ' : ''}${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
}

const fmtDate = x => D(x).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = x => D(x).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const toInput = x => { const d = D(x); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dayKey = x => { const d = D(x); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const sameMonth = (a, y, m) => D(a).getFullYear() === y && D(a).getMonth() === m;
const startOfDay = x => { const d = D(x); d.setHours(0, 0, 0, 0); return d; };
const durMin = ev => (ev.end ? Math.max(0, Math.round((D(ev.end) - D(ev.start)) / 60000)) : null);
const durStr = m => (m == null ? 'Ongoing' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const intColor = v => (v == null ? 'var(--subtle)' : v <= 3 ? 'var(--success)' : v <= 6 ? 'var(--orange)' : 'var(--danger)');
function ago(x) {
  const m = Math.max(0, Math.round((Date.now() - D(x)) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ${m % 60} min ago`;
  return `${plural(Math.floor(m / 1440), 'day')} ago`;
}
function counts(list) {
  const c = new Map();
  list.forEach(n => c.set(n, (c.get(n) || 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

/* ================= state ================= */
const blank = () => ({
  v: 1, events: [], customSymptoms: [], customTriggers: [], meds: [],
  lifestyle: { sleepHours: 7, completed: false },
  activeEventId: null, myTips: [], savedTips: [], lastBackupAt: null, changedAt: null
});
let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* fall through to an empty state */ }
  return blank();
}
function save(changed = true) {
  if (changed) S.changedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Could not save — storage is full or blocked'); }
}
const needsBackup = () => S.events.length > 0 && S.changedAt && (!S.lastBackupAt || S.changedAt > S.lastBackupAt);

const UI = { tab: 'home', sheets: [], attack: null, cal: { y: new Date().getFullYear(), m: new Date().getMonth() }, tipFilter: 'All' };

const allSymptoms = () => DEFAULT_SYMPTOMS.concat(S.customSymptoms);
const allTriggers = () => DEFAULT_TRIGGERS.concat(S.customTriggers);
const cat = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
const getEvent = id => S.events.find(e => e.id === id);
const activeEvent = () => (S.activeEventId ? getEvent(S.activeEventId) : null);
const sortEvents = () => S.events.sort((a, b) => D(b.start) - D(a.start));
function eventSymptoms(ev) {
  const seen = new Set();
  return ev.timeline.map(t => t.symptom).filter(s => !seen.has(s.id) && seen.add(s.id));
}
function sortedSymptoms() {
  const use = new Map(counts(S.events.flatMap(e => eventSymptoms(e).map(s => s.id))));
  return allSymptoms().map((s, i) => ({ s, i })).sort((a, b) => (use.get(b.s.id) || 0) - (use.get(a.s.id) || 0) || a.i - b.i).map(x => x.s);
}
function newEvent(props) {
  return Object.assign({ id: uid(), start: new Date().toISOString(), end: null, timeline: [], intensity: null, triggers: [], relief: [], tried: [], meds: [], notes: '' }, props);
}
const entry = (symptom, at) => ({ id: uid(), symptom: { id: symptom.id, name: symptom.name, icon: symptom.icon, cat: symptom.cat }, at: D(at).toISOString() });

/* ================= stats ================= */
function streakDays() {
  if (!S.events.length) return null;
  if (S.activeEventId) return 0;
  const last = Math.max(...S.events.map(e => +D(e.end || e.start)));
  return Math.max(0, Math.round((startOfDay(Date.now()) - startOfDay(last)) / 86400000));
}
function monthCount(offset) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset);
  return S.events.filter(e => sameMonth(e.start, d.getFullYear(), d.getMonth())).length;
}
function avgDuration() {
  const ds = S.events.map(durMin).filter(m => m != null);
  return ds.length ? durStr(Math.round(ds.reduce((a, b) => a + b, 0) / ds.length)) : '—';
}
function personalRelief(names, excludeId) {
  const others = S.events.filter(e => e.id !== excludeId);
  const want = new Set(names);
  const similar = others.filter(e => {
    const have = new Set(eventSymptoms(e).map(s => s.name));
    return want.size && [...want].filter(n => have.has(n)).length / want.size > 0.6;
  });
  const tally = evs => {
    const st = new Map();
    evs.forEach(e => e.relief.forEach(r => {
      const x = st.get(r.name) || { name: r.name, s: 0, t: 0 };
      x.t++; if (r.helped) x.s++; st.set(r.name, x);
    }));
    return [...st.values()].sort((a, b) => b.s - a.s || b.t - a.t);
  };
  const fromSimilar = tally(similar);
  return fromSimilar.length ? { list: fromSimilar, similar: true } : { list: tally(others), similar: false };
}

/* ================= rendering: shell ================= */
const TABS = [['home', 'Home', 'home'], ['insights', 'Insights', 'chart'], ['tips', 'Tips', 'bulb'], ['profile', 'Profile', 'user']];

function render() {
  const old = $('.screen');
  const keep = old && old.dataset.tab === UI.tab ? old.scrollTop : 0;
  const view = { home: homeView, insights: insightsView, tips: tipsView, profile: profileView }[UI.tab]();
  $('#app').innerHTML = `<main class="screen" data-tab="${UI.tab}">${view}</main>
    <nav class="tabbar">${TABS.map(([id, label, ic]) =>
      `<button class="tab ${UI.tab === id ? 'on' : ''}" data-act="tab" data-val="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav>`;
  $('.screen').scrollTop = keep;
}

const sectionH = (title, ic, extra = '') => `<div class="row"><div class="section-h grow">${icon(ic)}${esc(title)}</div>${extra}</div>`;

/* ================= home ================= */
function homeView() {
  const ev = activeEvent();
  let h = `<div class="title-row"><h1>MigraineEase</h1></div><div class="stack">`;
  if (ev) {
    const syms = eventSymptoms(ev);
    h += `<div class="attack-card">
      <div class="row"><div class="dot-ic" style="width:50px;height:50px;background:rgba(230,97,97,.3);color:var(--danger)">${icon('brain')}</div>
        <div class="grow"><b>Attack In Progress</b><div class="small sub">Started <span data-live="${ev.start}">${ago(ev.start)}</span></div></div></div>
      ${ev.meds.length ? `<div class="inset"><div class="label">Medications taken</div>${ev.meds.map(m =>
        `<div class="row small"><span style="color:var(--accent-soft)">${icon('pill')}</span><span class="grow">${esc(m.name)}${m.dosage ? ` <span class="sub">${esc(m.dosage)}</span>` : ''}</span><span class="sub tiny">${fmtTime(m.at)}</span></div>`).join('')}</div>` : ''}
      <div class="stack-s" style="gap:10px">
        <button class="btn primary" data-act="open" data-val="medQuick">${icon('pill')}Add Medication</button>
        <button class="btn ghost" data-act="endAttack">${icon('check')}End Attack</button>
      </div></div>`;
    if (syms.length) h += `<div class="stack-s">${sectionH('Current Symptoms', 'activity')}<div class="grid3">${syms.map(s =>
      `<div class="sym static" style="--c:${cat(s.cat).color}">${icon(s.icon)}<span>${esc(s.name)}</span></div>`).join('')}</div></div>`;
    h += `<button class="tile" data-act="open" data-val="addSymptoms"><span style="color:var(--accent)">${icon('plus')}</span>Add More Symptoms</button>`;
    h += reliefSection(ev);
  } else {
    if (needsBackup()) h += `<button class="banner" data-act="backup">${icon('cloud')}<span class="grow small"><b>Changes not backed up yet</b><br><span class="sub">Tap to save a backup to Files / iCloud Drive</span></span>${icon('right')}</button>`;
    const streak = streakDays();
    const line = streak == null ? 'Tap for instant relief guidance' : streak === 0 ? 'Tap for relief guidance' : `🎉 ${plural(streak, 'day')} migraine-free`;
    h += `<button class="hero" data-act="startAttackMode"><div class="pulse"><i>${icon('heartZap')}</i></div><b>I have a migraine</b><span>${line}</span></button>`;
    h += `<div class="stack-s">${sectionH('Quick Actions', 'zap')}<div class="grid2">
      <button class="tile" data-act="logPast"><span style="color:var(--accent)">${icon('plus')}</span><span>Log Past<br>Migraine</span></button>
      <button class="tile" data-act="open" data-val="triggers"><span style="color:var(--orange)">${icon('sliders')}</span><span>Edit<br>Triggers</span></button>
    </div></div>`;
  }
  return h + '</div>';
}

function reliefCard(ev, name, detail, conf) {
  const fb = ev.relief.find(r => r.name === name);
  const color = conf == null ? null : conf > 0.7 ? 'var(--success)' : conf > 0.4 ? 'var(--orange)' : 'var(--subtle)';
  const fbHtml = fb
    ? `<div class="row small sub" style="gap:6px">${icon(fb.helped ? 'check' : 'x')}${fb.helped ? 'Saved — this helped.' : "Saved — this didn't help."}<span class="grow"></span><button data-act="feedbackUndo" data-id="${ev.id}" data-name="${esc(name)}" style="color:var(--accent-soft)">Change</button></div>`
    : `<div class="grid2"><button class="btn" style="padding:10px;font-size:13px;background:rgba(115,199,140,.2);color:var(--success);border-radius:10px" data-act="feedback" data-id="${ev.id}" data-name="${esc(name)}" data-val="1">${icon('thumbUp')}Helped</button>
       <button class="btn" style="padding:10px;font-size:13px;background:rgba(230,97,97,.2);color:var(--danger);border-radius:10px" data-act="feedback" data-id="${ev.id}" data-name="${esc(name)}" data-val="0">${icon('thumbDown')}Didn't help</button></div>`;
  return `<div class="stack-s" style="background:rgba(255,255,255,.08);border-radius:14px;padding:16px">
    <div class="row"><div class="grow"><b>${esc(name)}</b>${detail ? `<div class="small sub">${esc(detail)}</div>` : ''}</div>
    ${color ? `<span class="pill" style="background:color-mix(in srgb, ${color} 25%, transparent);color:${color}">${Math.round(conf * 100)}%</span>` : ''}</div>${fbHtml}</div>`;
}

function reliefSection(ev) {
  const pr = personalRelief(eventSymptoms(ev).map(s => s.name), ev.id);
  const personal = pr.list.slice(0, 3);
  const used = new Set(personal.map(p => p.name));
  const common = COMMON_RELIEF.filter(n => !used.has(n)).slice(0, 3);
  common.forEach(n => used.add(n));
  const tried = [...new Set((ev.tried || []).concat(ev.relief.map(r => r.name)))].filter(n => !used.has(n));
  return `<div class="stack-s">${sectionH('What helped you before', 'user')}
      ${personal.length ? `<div class="small sub">${pr.similar ? 'From your attacks with similar symptoms' : 'From all your logged attacks'}</div>` + personal.map(p => reliefCard(ev, p.name, `Worked ${p.s}/${p.t} times`, p.s / Math.max(p.t, 1))).join('')
        : `<div class="empty" style="background:rgba(255,255,255,.06);border-radius:14px">Track more attacks to get personal suggestions</div>`}</div>
    <div class="stack-s">${sectionH('Often helpful', 'sparkles')}
      <div class="small sub">General first steps many people with migraine use. Tell the app what works for you.</div>
      ${common.map(n => reliefCard(ev, n, '', null)).join('')}</div>
    <div class="stack-s">${sectionH('Something else you tried', 'plus')}
      ${tried.map(n => reliefCard(ev, n, '', null)).join('')}
      <div class="row"><input id="relief-custom" placeholder="e.g. Hot shower" maxlength="40" enterkeyhint="done"><button class="btn primary" style="width:auto;padding:12px 18px" data-act="reliefCustom" data-id="${ev.id}">Add</button></div></div>`;
}

/* ================= attack mode (full screen) ================= */
function symGrid(list, sel) {
  return CATEGORIES.map(c => {
    const items = list.filter(s => s.cat === c.id);
    if (!items.length) return '';
    return `<div style="--c:${c.color}"><div class="cat-h">${c.name}</div><div class="grid3">${items.map(s =>
      `<button class="sym ${sel.has(s.id) ? 'on' : ''}" data-act="tog" data-set="symptoms" data-val="${esc(s.id)}">${icon(s.icon)}<span>${esc(s.name)}</span></button>`).join('')}</div></div>`;
  }).join('');
}

function renderAttack() {
  const fs = $('#fs');
  const a = UI.attack;
  if (!a) { fs.innerHTML = ''; return; }
  const keep = $('.scroll', fs)?.scrollTop || 0;
  if (a.step === 'pick') {
    fs.innerHTML = `<div class="fullscreen"><div class="inner">
      <div class="center" style="padding:20px 24px 0"><h1 style="font-size:28px">How do you feel?</h1><div class="sub">Tap your symptoms</div></div>
      <div class="scroll"><div class="stack">${symGrid(sortedSymptoms(), a.sel.symptoms)}
        <button class="btn" style="background:rgba(255,255,255,.06);color:var(--accent-soft);border-radius:14px" data-act="open" data-val="customSymptom">${icon('plus')}Add custom symptom</button></div></div>
      <div class="foot"><button class="btn primary big" id="get-help" data-act="getHelp" ${a.sel.symptoms.size ? '' : 'disabled'}>Get Help</button>
        <button class="btn sub" style="padding:10px;font-weight:400" data-act="cancelAttackMode">Cancel</button></div></div></div>`;
  } else {
    const ev = getEvent(a.eventId);
    fs.innerHTML = `<div class="fullscreen" style="animation:none"><div class="inner"><div class="scroll"><div class="stack" style="gap:26px">
      <div class="center" style="padding-top:14px"><div style="color:var(--accent);font-size:30px">${icon('sparkles')}</div><h1 style="font-size:24px">Relief Suggestions</h1><div class="sub small">Your attack is being tracked. Rest now — you can add details later.</div></div>
      ${reliefSection(ev)}</div></div>
      <div class="foot"><button class="btn primary" data-act="cancelAttackMode">${icon('home')}Back to Home</button></div></div></div>`;
  }
  const sc = $('.scroll', fs); if (sc) sc.scrollTop = keep;
}

/* ================= insights ================= */
function rankCard(title, ic, subtitle, items, kind) {
  return `<div class="card stack-s">${sectionH(title, ic)}${subtitle ? `<div class="small sub">${subtitle}</div>` : ''}
    ${items.length ? `<div>${items.map(([name, detail], i) => {
      const inner = `<span class="rank">${i + 1}.</span><span class="grow ellipsis" style="font-size:15px">${esc(name)}</span><span class="small sub">${detail}</span>${kind ? `<span class="sub tiny">${icon('right')}</span>` : ''}`;
      return (kind ? `<button class="list-row flat" data-act="info" data-kind="${kind}" data-name="${esc(name)}">${inner}</button>` : `<div class="list-row flat">${inner}</div>`)
        + (i < items.length - 1 ? '<div class="divider"></div>' : '');
    }).join('')}</div>` : '<div class="empty">Not enough data yet</div>'}</div>`;
}

function insightsView() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), n: S.events.filter(e => sameMonth(e.start, d.getFullYear(), d.getMonth())).length });
  }
  const max = Math.max(1, ...months.map(m => m.n));
  const triggers = counts(S.events.flatMap(e => e.triggers)).slice(0, 5).map(([n, c]) => [n, plural(c, 'time')]);
  const symptoms = counts(S.events.flatMap(e => eventSymptoms(e).map(s => s.name))).slice(0, 5).map(([n, c]) => [n, plural(c, 'attack')]);
  const relief = personalRelief([], null).list.slice(0, 5).map(r => [r.name, `${r.s}/${r.t} helped`]);
  return `<div class="title-row"><h1>Insights</h1></div><div class="stack">
    <div class="card stack-s">${sectionH('Monthly Overview', 'chart')}
      <div class="bars">${months.map(m => `<div><em>${m.n || ''}</em><i class="${m.n ? 'has' : ''}" style="height:${m.n ? Math.max(8, (m.n / max) * 84) : 8}px"></i>${m.label}</div>`).join('')}</div></div>
    ${rankCard('Top Triggers', 'alert', 'Tap any trigger to learn why it affects you', triggers, 'trigger')}
    ${rankCard('Common Symptoms', 'heart', "Tap any symptom to understand what's happening", symptoms, 'symptom')}
    ${rankCard('Most Effective Relief', 'sparkles', '', relief, null)}
  </div>`;
}

/* ================= tips ================= */
function tipsView() {
  const f = UI.tipFilter;
  const saved = new Set(S.savedTips);
  const tips = S.myTips.map(t => ({ ...t, mine: true })).concat(STARTER_TIPS).filter(t => {
    if (f === 'All') return true;
    if (f === 'Saved') return saved.has(t.id);
    if (f === 'Mine') return t.mine;
    const q = f.toLowerCase();
    return t.symptoms.concat(t.tags).some(x => x.toLowerCase().includes(q));
  });
  return `<div class="title-row"><h1>Tips</h1><button class="row" style="gap:5px;color:var(--accent);font-weight:700;font-size:15px" data-act="open" data-val="addTip">${icon('plus')}Add Tip</button></div>
    <div class="hscroll">${TIP_FILTERS.map(x => `<button class="chip sm ${x === f ? 'on' : ''}" data-act="tipFilter" data-val="${x}">${x}</button>`).join('')}</div>
    <div class="stack" style="gap:16px">
    <div class="card center"><div style="color:var(--accent);font-size:32px">${icon('bulb')}</div><b>Relief Tips</b><div class="small sub">A few starter ideas plus your own notes.<br>Everything here stays on this device.</div></div>
    ${tips.length ? tips.map(t => `<div class="card stack-s">
        ${t.symptoms.length || t.tags.length ? `<div class="chips" style="gap:6px">${t.symptoms.map(s => `<span class="pill rose">${esc(s)}</span>`).join('')}${t.tags.map(s => `<span class="pill grey">#${esc(s)}</span>`).join('')}</div>` : ''}
        <div style="font-size:15px;line-height:1.45;-webkit-user-select:text;user-select:text">${esc(t.content)}</div>
        <div class="row tiny sub"><span class="grow">${t.mine ? `Your tip · ${fmtDate(t.at)}` : 'Starter tip'}</span>
          ${t.mine ? `<button class="icon-btn" style="width:36px;height:36px" aria-label="Delete tip" data-act="delTip" data-id="${t.id}">${icon('trash')}</button>` : ''}
          <button class="row small" style="gap:4px;font-weight:700;padding:8px 0 8px 8px;color:${saved.has(t.id) ? 'var(--accent)' : 'var(--subtle)'}" data-act="saveTip" data-id="${t.id}">${icon('heart', saved.has(t.id) ? 'fill' : '')}${saved.has(t.id) ? 'Saved' : 'Save'}</button></div></div>`).join('')
      : `<div class="card center stack-s" style="padding:30px 16px"><div class="sub" style="font-size:30px">${icon('search')}</div><b>No tips for “${esc(f)}”</b><button class="chip sm on" style="align-self:center" data-act="open" data-val="addTip">Add Tip</button></div>`}
    <div class="tiny sub center">Tips are personal notes, not medical advice.</div></div>`;
}

/* ================= profile ================= */
function eventRow(ev) {
  const syms = eventSymptoms(ev).slice(0, 3).map(s => s.name).join(', ');
  const m = durMin(ev);
  return `<button class="list-row" data-act="detail" data-id="${ev.id}">
    <span class="intensity" style="--c:${intColor(ev.intensity)}">${ev.intensity ?? '–'}</span>
    <span class="grow"><span style="font-size:15px;font-weight:500">${fmtDate(ev.start)}</span><div class="small sub ellipsis">${esc(syms || 'No symptoms logged')}</div></span>
    <span style="text-align:right">${ev.id === S.activeEventId ? '<span class="pill" style="background:rgba(230,97,97,.2);color:var(--danger)">Active</span>' : m != null ? `<span class="pill grey">${m < 60 ? m + 'm' : Math.floor(m / 60) + 'h'}</span>` : ''}
      ${ev.timeline.length ? `<div class="tiny" style="color:var(--accent);margin-top:4px">${plural(ev.timeline.length, 'symptom')}</div>` : ''}</span></button>`;
}

function calendarCard() {
  const { y, m } = UI.cal;
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const hits = new Map();
  S.events.filter(e => sameMonth(e.start, y, m)).forEach(e => {
    const k = D(e.start).getDate(), cur = hits.get(k);
    if (!cur || (e.intensity ?? 5) > (cur.intensity ?? 5)) hits.set(k, e);
  });
  const today = new Date();
  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<div class="wd">${d}</div>`).join('') + '<div></div>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const e = hits.get(d);
    const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    cells += e
      ? `<button class="day hit ${isToday ? 'today' : ''}" style="--c:${intColor(e.intensity ?? 5)}" data-act="detail" data-id="${e.id}"><span>${d}</span></button>`
      : `<div class="day ${isToday ? 'today' : ''}"><span>${d}</span></div>`;
  }
  return `<div class="card stack-s">${sectionH('Pain Calendar', 'calendar')}
    <div class="row"><button class="icon-btn" aria-label="Previous month" data-act="calShift" data-val="-1">${icon('left')}</button>
      <b class="grow center" style="font-size:15px">${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
      <button class="icon-btn" aria-label="Next month" data-act="calShift" data-val="1">${icon('right')}</button></div>
    <div class="cal">${cells}</div>
    <div class="legend"><span style="--c:var(--success)"><i></i>Mild</span><span style="--c:var(--orange)"><i></i>Moderate</span><span style="--c:var(--danger)"><i></i>Severe</span></div></div>`;
}

function backupCard() {
  const warn = needsBackup();
  return `<div class="card stack-s">${sectionH('Data & Backup', 'cloud')}
    <div class="small sub">Your data is stored on this device. Save a backup file to Files / iCloud Drive to keep it safe and move it between devices.</div>
    <div class="small" style="color:${warn ? 'var(--amber)' : 'var(--subtle)'}">${S.lastBackupAt ? `Last backup: ${fmtDate(S.lastBackupAt)}, ${fmtTime(S.lastBackupAt)}${warn ? ' · changes since then' : ''}` : S.events.length ? 'No backup yet' : 'Nothing to back up yet'}</div>
    <div class="grid2"><button class="btn primary" style="padding:13px" data-act="backup">${icon('upload')}Back up</button>
      <button class="btn ghost" style="padding:13px" data-act="restore">${icon('download')}Restore</button></div></div>`;
}

function profileView() {
  const stat = (label, value, color) => `<div class="stat" style="--c:${color}"><b>${esc(value)}</b><span>${label}</span></div>`;
  const streak = streakDays();
  const top = counts(S.events.flatMap(e => e.triggers))[0];
  return `<div class="title-row"><h1>Profile</h1><button class="icon-btn" aria-label="Settings" data-act="open" data-val="settings">${icon('gear')}</button></div><div class="stack">
    ${calendarCard()}
    <div class="stack-s">${sectionH('Statistics', 'chart')}
      <div class="grid3">${stat('This Month', monthCount(0), 'var(--accent)')}${stat('Last Month', monthCount(-1), 'var(--orange)')}${stat('Avg Duration', avgDuration(), 'var(--cat-sensory)')}
        ${stat('Migraine-free', streak == null ? '—' : streak + 'd', 'var(--success)')}${stat('Top Trigger', top ? top[0] : 'None yet', 'var(--danger)')}${stat('Total', S.events.length, 'var(--cat-neuro)')}</div></div>
    <div class="stack-s">${sectionH('My Medications', 'pill', `<button class="icon-btn" style="color:var(--accent)" aria-label="Add medication" data-act="open" data-val="addMed">${icon('plus')}</button>`)}
      ${S.meds.length ? S.meds.map(m => `<div class="list-row"><span style="color:var(--accent-soft)">${icon('pill')}</span>
        <span class="grow"><span style="font-size:15px;font-weight:500">${esc(m.name)}</span>${m.dosage ? `<div class="small sub">${esc(m.dosage)}</div>` : ''}</span>
        ${m.regular ? '<span class="pill green">Regular</span>' : ''}<button class="icon-btn" style="width:36px;height:36px" aria-label="Remove medication" data-act="delMed" data-id="${m.id}">${icon('trash')}</button></div>`).join('')
        : '<div class="card empty">No medications saved yet</div>'}</div>
    <div class="stack-s">${sectionH('Recent Attacks', 'list')}
      ${S.events.length ? S.events.slice(0, 5).map(eventRow).join('') : `<div class="card center" style="padding:28px 16px"><div style="font-size:32px;color:var(--accent);opacity:.5">${icon('sparkles')}</div><b style="font-size:15px">No attacks logged yet</b><div class="small sub">That's a good thing! We'll be here when you need us.</div></div>`}
      ${S.events.length > 5 ? `<button class="btn ghost" style="padding:12px" data-act="open" data-val="allAttacks">All ${S.events.length} attacks</button>` : ''}</div>
    <button class="list-row" style="border-radius:var(--r-card);padding:16px" data-act="open" data-val="lifestyle"><span style="color:var(--accent-soft);font-size:22px">${icon('user')}</span>
      <span class="grow"><b style="font-size:15px">Migraine Awareness Questionnaire</b><div class="small sub">${S.lifestyle.completed ? 'Completed — tap to update' : 'Note your lifestyle to spot patterns'}</div></span>
      <span style="color:${S.lifestyle.completed ? 'var(--success)' : 'var(--subtle)'}">${icon(S.lifestyle.completed ? 'check' : 'right')}</span></button>
    ${backupCard()}
    <div class="card stack-s">${sectionH('Your Privacy', 'shield')}
      ${[['phone', 'All your data stays on this device. Nothing is sent to a server.'], ['cloud', 'Backups are files you save yourself, for example to iCloud Drive.'], ['lock', 'No account, no tracking, no analytics.']].map(([ic, t]) =>
        `<div class="row small sub" style="align-items:flex-start"><span style="color:var(--accent)">${icon(ic)}</span><span>${t}</span></div>`).join('')}</div>
    <div class="tiny sub center" style="opacity:.6">MigraineEase v${VERSION} · Not a medical device. Talk to your doctor about treatment.</div>
  </div>`;
}

/* ================= sheets ================= */
function sheetFrame(o) {
  return `<div class="sheet ${o.full ? 'full' : ''}">
    <div class="sheet-head">${o.left ? `<button data-act="${o.leftAct || 'close'}">${o.left}</button>` : '<span></span>'}<b>${esc(o.title)}</b>
      ${o.right ? `<button class="confirm" data-act="${o.rightAct || 'close'}">${o.right}</button>` : '<span></span>'}</div>
    ${o.pre || ''}<div class="sheet-body"><div class="stack">${o.body}</div></div>${o.foot ? `<div class="sheet-foot">${o.foot}</div>` : ''}</div>`;
}

function triggerChips(sel) {
  return TRIGGER_CATEGORIES.map(c => {
    const items = allTriggers().filter(t => t.category === c);
    if (!items.length) return '';
    return `<div class="field"><div class="label amber">${c}</div><div class="chips">${items.map(t =>
      `<button class="chip ${sel.has(t.name) ? 'on' : ''}" data-act="tog" data-set="triggers" data-val="${esc(t.name)}">${esc(t.name)}</button>`).join('')}</div></div>`;
  }).join('');
}

const SHEETS = {
  addSymptoms(sh) {
    const ev = activeEvent();
    const have = new Set(ev ? eventSymptoms(ev).map(s => s.id) : []);
    return sheetFrame({ title: 'Add Symptoms', left: 'Cancel', right: 'Add', rightAct: 'addSymptomsSave', full: true, body: symGrid(sortedSymptoms().filter(s => !have.has(s.id)), sh.sel.symptoms) });
  },

  customSymptom(sh) {
    return sheetFrame({ title: 'Custom Symptom', left: 'Cancel', right: 'Add', rightAct: 'customSymptomSave', body: `
      <div class="field"><div class="label">Symptom name</div><input id="cs-name" placeholder="e.g. Jaw pain" maxlength="30" enterkeyhint="done"></div>
      <div class="field"><div class="label">Category</div><select id="cs-cat">${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="field"><div class="label">Icon</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">${CUSTOM_ICON_OPTIONS.map(i =>
        `<button class="opt ${sh.icon === i ? 'on' : ''}" style="font-size:22px" data-act="pickIcon" data-val="${i}">${icon(i)}</button>`).join('')}</div></div>` });
  },

  medQuick() {
    const row = m => `<button class="list-row" data-act="takeMed" data-name="${esc(m.name)}" data-dosage="${esc(m.dosage || '')}"><span style="color:var(--accent-soft)">${icon('pill')}</span>
      <span class="grow"><span style="font-size:15px;font-weight:500">${esc(m.name)}</span>${m.dosage ? `<div class="small sub">${esc(m.dosage)}</div>` : ''}</span><span style="color:var(--accent)">${icon('plus')}</span></button>`;
    const mine = new Set(S.meds.map(m => m.name));
    return sheetFrame({ title: 'Add Medication', left: 'Done', full: true, body: `
      ${S.meds.length ? `<div class="stack-s"><div class="label">Your Medications</div>${S.meds.map(row).join('')}</div>` : ''}
      <div class="stack-s"><div class="label">Common Medications</div>${COMMON_MEDS.filter(m => !mine.has(m.name)).slice(0, 6).map(row).join('')}</div>
      <div class="stack-s"><div class="label">Other</div><div class="row"><input id="med-custom" placeholder="Medication name" maxlength="40" enterkeyhint="done"><button class="btn primary" style="width:auto;padding:12px 18px" data-act="takeMedCustom">Add</button></div></div>
      <div class="tiny sub center">This only records what you took. Follow your doctor's or the leaflet's dosing instructions.</div>` });
  },

  // One editor for three jobs: reflect after an attack, log a past attack, edit an existing one.
  editor(sh) {
    const ev = sh.eventId ? getEvent(sh.eventId) : null;
    const past = sh.mode === 'past', reflect = sh.mode === 'reflect';
    const start = ev ? ev.start : new Date(Date.now() - 86400000), end = ev ? ev.end : null;
    const int = ev?.intensity ?? 5;
    const now = toInput(new Date());
    return sheetFrame({ title: reflect ? 'How was it?' : past ? 'Log Past Migraine' : 'Edit Attack', left: reflect ? 'Skip' : 'Cancel', right: 'Save', rightAct: 'editorSave', full: true, body: `
      ${reflect ? `<div class="card center"><div style="color:var(--accent-soft);font-size:26px">${icon('search')}</div><div class="small sub">Attack ended after ${durStr(durMin(ev))}. Rate it and reflect on what might have triggered it.</div></div>` : ''}
      ${!reflect ? `<div class="grid2"><div class="field"><div class="label">Started</div><input type="datetime-local" id="ed-start" max="${now}" value="${toInput(start)}"></div>
        ${ev && ev.id === S.activeEventId ? '<div class="field"><div class="label">Ended</div><div class="small sub" style="padding-top:12px">Still in progress</div></div>'
          : `<div class="field"><div class="label">Ended</div><input type="datetime-local" id="ed-end" max="${now}" value="${end ? toInput(end) : ''}"></div>`}</div>` : ''}
      <div class="card field"><div class="row"><div class="label grow">Pain intensity</div><span class="big-num" id="ed-int-out" style="color:${intColor(int)}">${int}</span><span class="sub small">/ 10</span></div>
        <input type="range" id="ed-int" min="1" max="10" step="1" value="${int}" data-input="intensity"><div class="row tiny sub"><span class="grow">Mild</span><span>Severe</span></div></div>
      ${past ? `<div class="stack-s"><div class="label">Symptoms</div>${symGrid(sortedSymptoms(), sh.sel.symptoms)}</div>` : ''}
      <div class="stack-s"><div class="label">Possible triggers</div>${triggerChips(sh.sel.triggers)}</div>
      <div class="field"><div class="label">Notes</div><textarea id="ed-notes" placeholder="Anything worth remembering" maxlength="1000">${esc(ev?.notes || '')}</textarea></div>
      ${reflect ? `<div class="list-row small sub"><span style="color:var(--amber)">${icon('bulb')}</span>You can change all of this later under Profile → Recent Attacks.</div>` : ''}` });
  },

  detail(sh) {
    const ev = getEvent(sh.eventId);
    if (!ev) return sheetFrame({ title: 'Attack Detail', right: 'Done', body: '<div class="empty">This attack was deleted.</div>' });
    const tl = ev.timeline;
    const phaseOf = t => cat(t.symptom.cat).phase;
    const dom = counts(tl.map(phaseOf))[0];
    const rel = t => { const m = Math.round((D(t.at) - D(ev.start)) / 60000); return m < 0 ? 'Before start' : m === 0 ? 'At start' : m < 60 ? `+${m}m` : `+${Math.floor(m / 60)}h${m % 60 ? (m % 60) + 'm' : ''}`; };
    const pill = (v, l) => `<div class="grow center"><b style="font-size:15px">${esc(v)}</b><div class="tiny sub">${l}</div></div>`;
    const phases = PHASES.map(p => {
      const items = tl.filter(t => phaseOf(t) === p.id).sort((a, b) => D(a.at) - D(b.at));
      if (!items.length) return '';
      return `<div style="--c:${p.color}"><div class="phase-h">${icon(p.icon)}<span class="grow">${p.name}</span><span class="sub tiny" style="font-weight:400">${fmtTime(items[0].at)}</span></div>
        <div class="tl">${items.map(t => `<div class="tl-row"><div class="tl-rail"></div><div class="tl-main row" style="gap:10px">${icon(t.symptom.icon)}<span class="grow" style="font-size:15px">${esc(t.symptom.name)}</span>
          <button class="time-btn" data-act="editTime" data-id="${t.id}">${rel(t)}${icon('pencil')}</button></div></div>`).join('')}</div></div>`;
    }).join('');
    const block = (title, ic, inner) => `<div class="card stack-s">${sectionH(title, ic)}${inner}</div>`;
    return sheetFrame({ title: 'Attack Detail', right: 'Done', full: true, body: `
      <div class="card stack-s"><div class="row"><div class="grow"><b style="font-size:20px">${fmtDate(ev.start)}</b><div class="sub small">${fmtTime(ev.start)}${ev.end ? ' – ' + fmtTime(ev.end) : ''}</div></div>
        <div class="center" style="padding:8px 14px;border-radius:12px;background:color-mix(in srgb, ${intColor(ev.intensity)} 15%, transparent)"><b style="font-size:22px;color:${intColor(ev.intensity)}">${ev.intensity ?? '–'}</b><div class="tiny sub">/ 10</div></div></div>
        <div class="divider"></div><div class="row">${pill(durStr(durMin(ev)), 'Duration')}${pill(eventSymptoms(ev).length, 'Symptoms')}${pill(dom ? PHASES.find(p => p.id === dom[0]).name : '—', 'Main phase')}</div></div>
      <div class="stack-s">${sectionH('Symptom Timeline', 'clock', tl.length ? '<span class="tiny sub">Tap time to edit</span>' : '')}
        ${tl.length ? phases : `<div class="card empty">No symptoms recorded</div>`}</div>
      ${ev.triggers.length ? block('Triggers', 'alert', `<div class="chips">${ev.triggers.map(t => `<span class="chip on" style="padding:7px 12px;font-size:13px">${esc(t)}</span>`).join('')}</div>`) : ''}
      ${ev.meds.length ? block('Medication', 'pill', ev.meds.map(m => `<div class="row small"><span class="grow">${esc(m.name)} <span class="sub">${esc(m.dosage || '')}</span></span><span class="sub tiny">${fmtTime(m.at)}</span></div>`).join('')) : ''}
      ${ev.relief.length ? block('Relief', 'sparkles', ev.relief.map(r => `<div class="row small"><span style="color:${r.helped ? 'var(--success)' : 'var(--danger)'}">${icon(r.helped ? 'thumbUp' : 'thumbDown')}</span><span class="grow">${esc(r.name)}</span><span class="sub tiny">${r.helped ? 'Helped' : "Didn't help"}</span></div>`).join('')) : ''}
      ${ev.notes ? block('Notes', 'file', `<div class="small" style="white-space:pre-wrap;-webkit-user-select:text;user-select:text">${esc(ev.notes)}</div>`) : ''}
      <div class="stack-s"><button class="btn ghost" data-act="editEvent" data-id="${ev.id}">${icon('pencil')}Edit intensity, triggers & notes</button>
        <button class="btn danger" data-act="delEvent" data-id="${ev.id}">${icon('trash')}Delete attack</button></div>` });
  },

  time(sh) {
    const ev = getEvent(sh.eventId), t = ev.timeline.find(x => x.id === sh.entryId);
    return sheetFrame({ title: 'Edit Timestamp', left: 'Cancel', right: 'Save', rightAct: 'timeSave', body: `
      <div class="center"><div style="color:var(--accent);font-size:34px">${icon('clock')}</div><div class="sub small">When did “${esc(t.symptom.name)}” start?</div></div>
      <input type="datetime-local" id="time-input" max="${toInput(new Date())}" value="${toInput(t.at)}">
      <button class="btn danger" data-act="delEntry">${icon('trash')}Remove this symptom</button>` });
  },

  info(sh) {
    const isT = sh.kind === 'trigger';
    const src = isT ? TRIGGER_INFO : SYMPTOM_INFO;
    const q = sh.name.toLowerCase();
    const hit = src.find(i => i.name.toLowerCase() === q) || src.find(i => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
    const body = hit?.body || (isT ? 'This trigger can stimulate nerve pathways that activate migraine mechanisms in the brain.' : 'This symptom is part of the migraine cascade, involving changes in brain chemistry and blood flow.');
    const tip = (isT ? hit?.tip : hit?.relief) || (isT ? 'Track when this occurs relative to your migraines to find your personal pattern.' : "Resting in a calm, dark environment often helps reduce this symptom's intensity.");
    const col = isT ? 'var(--danger)' : 'var(--accent)';
    const sec = (ic, title, text, c) => `<div class="card stack-s"><div class="row" style="gap:8px;font-weight:700"><span style="color:${c}">${icon(ic)}</span>${title}</div><div style="font-size:15px;line-height:1.6;opacity:.88;-webkit-user-select:text;user-select:text">${esc(text)}</div></div>`;
    return sheetFrame({ title: sh.name, right: 'Done', full: true, body: `
      <div class="card row" style="gap:16px;padding:20px"><div class="dot-ic" style="width:60px;height:60px;font-size:22px;color:${col};background:color-mix(in srgb, ${col} 20%, transparent)">${icon(isT ? 'alert' : 'heart')}</div>
        <div><div class="label">${isT ? 'Trigger' : 'Symptom'}</div><b style="font-size:22px">${esc(sh.name)}</b></div></div>
      ${sec('brain', isT ? 'What happens in your body' : "What's happening in your brain", body, col)}
      ${sec(isT ? 'bulb' : 'plus', isT ? 'What you can do' : 'How to find relief', tip, 'var(--success)')}
      <div class="tiny sub center">General information, not medical advice.</div>` });
  },

  triggers() {
    const custom = S.customTriggers;
    return sheetFrame({ title: 'Edit Triggers', right: 'Done', full: true, body: `
      <div class="card stack-s"><div class="label">Add your own trigger</div>
        <input id="tr-name" placeholder="e.g. Red wine" maxlength="30" enterkeyhint="done">
        <div class="row"><select id="tr-cat">${TRIGGER_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select><button class="btn primary" style="width:auto;padding:12px 18px" data-act="addTrigger">Add</button></div></div>
      ${custom.length ? `<div class="stack-s"><div class="label">Your triggers</div>${custom.map(t => `<div class="list-row"><span class="grow"><span style="font-size:15px">${esc(t.name)}</span><div class="tiny sub">${t.category}</div></span>
        <button class="icon-btn" style="width:36px;height:36px" aria-label="Remove trigger" data-act="delTrigger" data-name="${esc(t.name)}">${icon('trash')}</button></div>`).join('')}</div>` : ''}
      <div class="stack-s"><div class="label">Built-in triggers</div>${TRIGGER_CATEGORIES.map(c => {
        const items = DEFAULT_TRIGGERS.filter(t => t.category === c);
        return items.length ? `<div class="field"><div class="label amber">${c}</div><div class="chips">${items.map(t => `<span class="chip" style="padding:7px 12px;font-size:13px">${t.name}</span>`).join('')}</div></div>` : '';
      }).join('')}</div>` });
  },

  customSymptoms() {
    return sheetFrame({ title: 'Custom Symptoms', right: 'Done', full: true, body: `
      ${S.customSymptoms.length ? S.customSymptoms.map(s => `<div class="list-row"><span style="color:${cat(s.cat).color}">${icon(s.icon)}</span><span class="grow"><span style="font-size:15px">${esc(s.name)}</span><div class="tiny sub">${cat(s.cat).name}</div></span>
        <button class="icon-btn" style="width:36px;height:36px" aria-label="Remove symptom" data-act="delSymptom" data-id="${esc(s.id)}">${icon('trash')}</button></div>`).join('') : '<div class="card empty">No custom symptoms yet</div>'}
      <button class="btn primary" data-act="open" data-val="customSymptom">${icon('plus')}Add custom symptom</button>` });
  },

  addMed() {
    return sheetFrame({ title: 'Add Medication', left: 'Cancel', right: 'Save', rightAct: 'addMedSave', full: true, body: `
      <div class="card stack-s"><input id="am-name" placeholder="Medication name" maxlength="40"><input id="am-dose" placeholder="Dosage (e.g. 400mg)" maxlength="20">
        <label class="switch"><span>Take regularly</span><input type="checkbox" id="am-regular"></label></div>
      <div class="stack-s"><div class="label">Common medications</div>${COMMON_MEDS.map(m => `<button class="list-row" data-act="fillMed" data-name="${m.name}" data-dosage="${m.dosage}"><span class="grow">${m.name}</span><span class="sub small">${m.dosage}</span></button>`).join('')}</div>` });
  },

  lifestyle(sh) {
    const sec = LIFESTYLE[sh.step], p = sh.profile;
    const field = f => f.type === 'stepper'
      ? `<div class="card field"><b style="font-size:15px">${f.title}</b><div class="row"><button class="icon-btn" style="color:var(--accent)" aria-label="Less" data-act="lsStep" data-key="${f.key}" data-val="-1">${icon('minus')}</button>
          <span class="grow center big-num" id="ls-${f.key}">${p[f.key]}${f.unit}</span><button class="icon-btn" style="color:var(--accent)" aria-label="More" data-act="lsStep" data-key="${f.key}" data-val="1">${icon('plus')}</button></div></div>`
      : `<div class="card field"><b style="font-size:15px">${f.title}</b><div class="grid2" style="gap:10px">${f.options.map(o => `<button class="opt ${p[f.key] === o ? 'on' : ''}" data-act="lsOpt" data-key="${f.key}" data-val="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
    return sheetFrame({ title: sec.title, left: 'Cancel', full: true,
      pre: `<div class="steps">${LIFESTYLE.map((_, i) => `<i class="${i <= sh.step ? 'on' : ''}"></i>`).join('')}</div>`,
      body: `<div class="center"><div style="color:var(--accent);font-size:32px">${icon(sec.icon)}</div><b style="font-size:22px">${sec.title}</b><div class="sub small">${sec.subtitle}</div></div>${sec.fields.map(field).join('')}`,
      foot: `${sh.step > 0 ? '<button class="btn ghost" style="width:90px" data-act="lsNav" data-val="-1">Back</button>' : ''}<button class="btn primary" data-act="lsNav" data-val="1">${sh.step < LIFESTYLE.length - 1 ? 'Next' : 'Save'}</button>` });
  },

  addTip(sh) {
    const grid = (opts, set, cols) => `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px">${opts.map(o => `<button class="opt ${sh.sel[set].has(o) ? 'on' : ''}" style="font-size:13px;padding:10px 4px" data-act="tog" data-set="${set}" data-val="${o}">${o}</button>`).join('')}</div>`;
    return sheetFrame({ title: 'Add a Tip', left: 'Cancel', right: 'Save', rightAct: 'addTipSave', full: true, body: `
      <div class="field"><div class="label">Your tip</div><textarea id="tip-text" placeholder="What works for you?" maxlength="400" style="min-height:120px"></textarea></div>
      <div class="field"><div class="label">Symptoms it helps with</div>${grid(TIP_SYMPTOMS, 'symptoms', 2)}</div>
      <div class="field"><div class="label">Tags</div>${grid(TIP_TAGS, 'tags', 3)}</div>` });
  },

  allAttacks() {
    return sheetFrame({ title: `All Attacks (${S.events.length})`, right: 'Done', full: true, body: `<div class="stack-s">${S.events.map(eventRow).join('')}</div>` });
  },

  settings() {
    const item = (ic, label, act, val, extra = '') => `<button class="list-row" data-act="${act}" ${val ? `data-val="${val}"` : ''}><span style="color:var(--accent-soft)">${icon(ic)}</span><span class="grow" style="font-size:15px">${label}</span>${extra}<span class="sub tiny">${icon('right')}</span></button>`;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return sheetFrame({ title: 'Settings', left: 'Done', full: true, body: `
      <div class="stack-s"><div class="label">Personalize</div>
        ${item('heart', 'Custom Symptoms', 'open', 'customSymptoms', `<span class="sub small">${S.customSymptoms.length || ''}</span>`)}
        ${item('alert', 'Custom Triggers', 'open', 'triggers', `<span class="sub small">${S.customTriggers.length || ''}</span>`)}
        ${item('list', 'Lifestyle Questionnaire', 'open', 'lifestyle')}</div>
      <div class="stack-s"><div class="label">Your data</div>
        ${item('upload', 'Back up to Files / iCloud Drive', 'backup')}
        ${item('download', 'Restore from a backup file', 'restore')}
        ${item('file', 'Export attacks as a table (CSV)', 'exportCsv')}
        ${S.events.length ? '' : item('sparkles', 'Load example data', 'demo')}
        <button class="list-row" data-act="erase" style="color:var(--danger)">${icon('trash')}<span class="grow" style="font-size:15px">Erase all data</span></button></div>
      <div class="stack-s"><div class="label">About</div>
        <div class="card small sub stack-s"><div><b style="color:#fff">How it works</b><br>Tap “I have a migraine”, pick your symptoms, and the app tracks the attack. When it ends, rate it and note triggers. Over time, Insights shows your patterns and what actually helps you.</div>
          <div><b style="color:#fff">Where your data lives</b><br>Only in this app on this device. ${standalone ? 'You are using the Home Screen app.' : 'Add the app to your Home Screen (Share → Add to Home Screen) so it works offline and keeps its data reliably.'} Back up regularly to Files / iCloud Drive.</div></div>
        <div class="list-row"><span class="grow" style="font-size:15px">Version</span><span class="sub">${VERSION}</span></div></div>` });
  }
};

function openSheet(type, props = {}) {
  const sh = Object.assign({ type, sel: { symptoms: new Set(), triggers: new Set(), tags: new Set() } }, props);
  UI.sheets.push(sh);
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = SHEETS[type](sh);
  $('#sheets').appendChild(el);
  return sh;
}
function refreshSheet() {
  const sh = UI.sheets.at(-1), el = $('#sheets').lastElementChild;
  if (!sh || !el) return;
  const keep = $('.sheet-body', el)?.scrollTop || 0;
  el.innerHTML = SHEETS[sh.type](sh);
  el.style.animation = 'none'; $('.sheet', el).style.animation = 'none';
  const b = $('.sheet-body', el); if (b) b.scrollTop = keep;
}
const LIVE_SHEETS = ['detail', 'allAttacks', 'settings', 'customSymptoms', 'triggers'];
function closeSheet() {
  UI.sheets.pop();
  $('#sheets').lastElementChild?.remove();
  if (UI.sheets.length && LIVE_SHEETS.includes(UI.sheets.at(-1).type)) refreshSheet();
  renderAttack();
  render();
}
function closeAllSheets() { UI.sheets = []; $('#sheets').innerHTML = ''; }
const topSel = () => (UI.sheets.length ? UI.sheets.at(-1).sel : UI.attack?.sel);

/* ================= dialogs, toast ================= */
function ask(title, text, ok = 'OK', destructive = false) {
  return new Promise(res => {
    const el = document.createElement('div');
    el.className = 'overlay dialog-wrap';
    el.innerHTML = `<div class="dialog" role="alertdialog"><div class="txt"><b>${esc(title)}</b><span>${esc(text)}</span></div>
      <div class="acts"><button data-r="0">Cancel</button><button data-r="1" class="${destructive ? 'destructive' : ''}">${esc(ok)}</button></div></div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { el.remove(); res(b.dataset.r === '1'); } });
    document.body.appendChild(el);
  });
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ================= backup, restore, export ================= */
async function shareFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
async function backup() {
  if (!S.events.length && !S.meds.length && !S.myTips.length && !S.customSymptoms.length && !S.customTriggers.length) return toast('Nothing to back up yet');
  const now = new Date().toISOString();
  const payload = { app: 'MigraineEase', format: 1, exportedAt: now, data: { ...S, lastBackupAt: now, changedAt: now } };
  const file = new File([JSON.stringify(payload, null, 2)], 'MigraineEase-backup.json', { type: 'application/json' });
  const r = await shareFile(file);
  if (r === 'cancelled') return;
  S.lastBackupAt = now; S.changedAt = now; save(false);
  if (UI.sheets.length) refreshSheet();
  render();
  toast(r === 'shared' ? 'Backup handed over — choose “Save to Files”' : 'Backup file downloaded');
}
function restoreFrom(text) {
  let p;
  try { p = JSON.parse(text); } catch (e) { return toast('That file is not a MigraineEase backup'); }
  if (!p || p.app !== 'MigraineEase' || !p.data || !Array.isArray(p.data.events)) return toast('That file is not a MigraineEase backup');
  ask('Restore this backup?', `Backup from ${fmtDate(p.exportedAt)} with ${plural(p.data.events.length, 'attack')}. It replaces everything currently in the app on this device.`, 'Restore', true).then(ok => {
    if (!ok) return;
    S = Object.assign(blank(), p.data);
    S.events.forEach(e => { e.timeline ||= []; e.triggers ||= []; e.relief ||= []; e.meds ||= []; e.tried ||= []; });
    if (S.activeEventId && !getEvent(S.activeEventId)) S.activeEventId = null;
    sortEvents(); save(false); closeAllSheets(); UI.attack = null; renderAttack(); render();
    toast('Backup restored');
  });
}
async function exportCsv() {
  if (!S.events.length) return toast('No attacks to export yet');
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Start', 'End', 'Duration (min)', 'Intensity (1-10)', 'Symptoms', 'Triggers', 'Medication', 'Helped', 'Did not help', 'Notes']];
  S.events.forEach(e => rows.push([
    `${fmtDate(e.start)} ${fmtTime(e.start)}`, e.end ? `${fmtDate(e.end)} ${fmtTime(e.end)}` : '', durMin(e) ?? '', e.intensity ?? '',
    eventSymptoms(e).map(s => s.name).join('; '), e.triggers.join('; '), e.meds.map(m => `${m.name} ${m.dosage || ''}`.trim()).join('; '),
    e.relief.filter(r => r.helped).map(r => r.name).join('; '), e.relief.filter(r => !r.helped).map(r => r.name).join('; '), e.notes]));
  const csv = '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n');
  const r = await shareFile(new File([csv], 'MigraineEase-attacks.csv', { type: 'text/csv' }));
  if (r === 'downloaded') toast('Table downloaded');
}
function loadDemo() {
  const s = n => DEFAULT_SYMPTOMS.find(x => x.name === n);
  const at = (days, mins = 0) => new Date(Date.now() - days * 86400000 + mins * 60000);
  const mk = (days, durH, int, tl, triggers, relief) => newEvent({
    start: at(days).toISOString(), end: durH ? at(days, durH * 60).toISOString() : at(days, 180).toISOString(), intensity: int,
    timeline: tl.map(([n, m]) => entry(s(n), at(days, m))), triggers, relief: relief.map(n => ({ name: n, helped: true }))
  });
  S.events = [
    mk(2, 4, 7, [['Mood changes', -45], ['Food cravings', -30], ['Visual aura', 0], ['Forehead pain', 20], ['Throbbing pain', 25], ['Light sensitivity', 30], ['Nausea', 40], ['Exhaustion', 240]], ['Work stress', 'Poor sleep'], ['Dark quiet room', 'Take triptan']),
    mk(8, 6, 8, [['Visual aura', 0], ['Flashing lights', 10], ['One-sided pain', 20], ['Light sensitivity', 30], ['Sound sensitivity', 35], ['Nausea', 50]], ['Weather change'], ['Sleep', 'Cold compress']),
    mk(15, 4, 5, [['Forehead pain', 0], ['Nausea', 0]], ['Skipped meal'], ['Ibuprofen']),
    mk(22, 4, 6, [['Forehead pain', 0], ['Light sensitivity', 0], ['Dizziness', 0]], ['Caffeine'], ['Dark quiet room', 'Hydrate']),
    mk(31, 3, 4, [['Forehead pain', 0], ['Visual aura', 0]], ['Work stress'], ['Take triptan'])
  ];
  S.meds = [{ id: uid(), name: 'Sumatriptan', dosage: '50mg', regular: false }, { id: uid(), name: 'Ibuprofen', dosage: '400mg', regular: false }];
  sortEvents(); save(); closeAllSheets(); render(); toast('Example data loaded');
}

/* ================= actions ================= */
const A = {
  tab(el) { UI.tab = el.dataset.val; render(); $('.screen').scrollTop = 0; },
  open(el) { openSheet(el.dataset.val, el.dataset.val === 'lifestyle' ? { step: 0, profile: { ...S.lifestyle } } : el.dataset.val === 'customSymptom' ? { icon: 'star' } : {}); },
  close() { closeSheet(); },

  tog(el) {
    const set = topSel()?.[el.dataset.set]; if (!set) return;
    const v = el.dataset.val;
    set.has(v) ? set.delete(v) : set.add(v);
    el.classList.toggle('on', set.has(v));
    const gh = $('#get-help'); if (gh && UI.attack && !UI.sheets.length) gh.disabled = !UI.attack.sel.symptoms.size;
  },

  // --- attack flow ---
  startAttackMode() { UI.attack = { step: 'pick', sel: { symptoms: new Set() } }; renderAttack(); },
  cancelAttackMode() { UI.attack = null; renderAttack(); render(); },
  getHelp() {
    const picked = allSymptoms().filter(s => UI.attack.sel.symptoms.has(s.id));
    if (!picked.length) return;
    const ev = newEvent({ timeline: picked.map(s => entry(s, new Date())) });
    S.events.unshift(ev); S.activeEventId = ev.id; save();
    UI.attack = { step: 'relief', eventId: ev.id }; renderAttack(); render();
  },
  addSymptomsSave() {
    const ev = activeEvent(), sel = topSel().symptoms;
    if (ev && sel.size) { allSymptoms().filter(s => sel.has(s.id)).forEach(s => ev.timeline.push(entry(s, new Date()))); save(); }
    closeSheet();
  },
  async endAttack() {
    const ev = activeEvent(); if (!ev) return;
    if (!await ask('End Attack?', 'This logs how long the attack lasted and lets you rate it and note possible triggers.', 'End & Reflect')) return;
    ev.end = new Date().toISOString(); S.activeEventId = null; save(); render();
    openSheet('editor', { mode: 'reflect', eventId: ev.id }).sel.triggers = new Set(ev.triggers);
    refreshSheet();
  },
  feedback(el) {
    const ev = getEvent(el.dataset.id); if (!ev) return;
    ev.relief = ev.relief.filter(r => r.name !== el.dataset.name);
    ev.relief.push({ name: el.dataset.name, helped: el.dataset.val === '1' });
    save(); renderAttack(); render();
  },
  feedbackUndo(el) {
    const ev = getEvent(el.dataset.id); if (!ev) return;
    ev.relief = ev.relief.filter(r => r.name !== el.dataset.name);
    if (!(ev.tried ||= []).includes(el.dataset.name)) ev.tried.push(el.dataset.name);
    save(); renderAttack(); render();
  },
  reliefCustom(el) {
    const ev = getEvent(el.dataset.id), input = el.parentElement.querySelector('input');
    const name = input.value.trim(); if (!ev || !name) return;
    if (!(ev.tried ||= []).includes(name)) ev.tried.push(name);
    save(); renderAttack(); render();
  },
  takeMed(el) {
    const ev = activeEvent(); if (!ev) return closeSheet();
    ev.meds.push({ id: uid(), name: el.dataset.name, dosage: el.dataset.dosage || '', at: new Date().toISOString() });
    save(); closeSheet(); toast(`${el.dataset.name} logged at ${fmtTime(new Date())}`);
  },
  takeMedCustom() {
    const name = $('#med-custom').value.trim(); if (!name) return;
    A.takeMed({ dataset: { name, dosage: '' } });
  },

  // --- editor (reflect / past / edit) ---
  logPast() { openSheet('editor', { mode: 'past' }); },
  editEvent(el) {
    const ev = getEvent(el.dataset.id);
    openSheet('editor', { mode: 'edit', eventId: ev.id }).sel.triggers = new Set(ev.triggers);
    refreshSheet();
  },
  editorSave() {
    const sh = UI.sheets.at(-1);
    const intensity = +$('#ed-int').value, notes = $('#ed-notes').value.trim(), triggers = [...sh.sel.triggers];
    let ev = sh.eventId ? getEvent(sh.eventId) : null;
    if (sh.mode !== 'reflect') {
      const sv = $('#ed-start').value, evEl = $('#ed-end');
      if (!sv) return toast('Please enter when it started');
      const start = new Date(sv), end = evEl && evEl.value ? new Date(evEl.value) : null;
      if (start > new Date()) return toast('The start time is in the future');
      if (end && end <= start) return toast('The end must be after the start');
      if (end && end > new Date()) return toast('The end time is in the future');
      if (sh.mode === 'past') {
        if (!end) return toast('Please enter when it ended');
        ev = newEvent({ start: start.toISOString(), timeline: allSymptoms().filter(s => sh.sel.symptoms.has(s.id)).map(s => entry(s, start)) });
        S.events.push(ev);
      } else {
        const shift = start - D(ev.start);
        if (shift) ev.timeline.forEach(t => { t.at = new Date(+D(t.at) + shift).toISOString(); });
        ev.start = start.toISOString();
      }
      if (evEl) ev.end = end ? end.toISOString() : ev.end;
    }
    Object.assign(ev, { intensity, notes, triggers });
    sortEvents(); save(); closeSheet();
    toast(sh.mode === 'past' ? 'Migraine logged' : 'Saved');
  },

  // --- attack detail ---
  detail(el) { openSheet('detail', { eventId: el.dataset.id }); },
  editTime(el) { openSheet('time', { eventId: UI.sheets.at(-1).eventId, entryId: el.dataset.id }); },
  timeSave() {
    const sh = UI.sheets.at(-1), v = $('#time-input').value;
    if (!v) return;
    if (new Date(v) > new Date()) return toast('That time is in the future');
    getEvent(sh.eventId).timeline.find(t => t.id === sh.entryId).at = new Date(v).toISOString();
    save(); closeSheet();
  },
  delEntry() {
    const sh = UI.sheets.at(-1), ev = getEvent(sh.eventId);
    ev.timeline = ev.timeline.filter(t => t.id !== sh.entryId);
    save(); closeSheet();
  },
  async delEvent(el) {
    if (!await ask('Delete this attack?', 'It will be removed from your history and statistics. This cannot be undone.', 'Delete', true)) return;
    S.events = S.events.filter(e => e.id !== el.dataset.id);
    if (S.activeEventId === el.dataset.id) S.activeEventId = null;
    save(); closeSheet(); toast('Attack deleted');
  },
  info(el) { openSheet('info', { kind: el.dataset.kind, name: el.dataset.name }); },
  calShift(el) {
    const d = new Date(UI.cal.y, UI.cal.m + +el.dataset.val, 1);
    UI.cal = { y: d.getFullYear(), m: d.getMonth() }; render();
  },

  // --- personalisation ---
  pickIcon(el) {
    UI.sheets.at(-1).icon = el.dataset.val;
    el.parentElement.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b === el));
  },
  customSymptomSave() {
    const name = $('#cs-name').value.trim(); if (!name) return toast('Please enter a name');
    if (allSymptoms().some(s => s.name.toLowerCase() === name.toLowerCase())) return toast('That symptom already exists');
    const s = { id: 'c-' + uid(), name, icon: UI.sheets.at(-1).icon, cat: $('#cs-cat').value, custom: true };
    S.customSymptoms.push(s); save();
    if (UI.attack?.step === 'pick') UI.attack.sel.symptoms.add(s.id);
    closeSheet();
  },
  delSymptom(el) { S.customSymptoms = S.customSymptoms.filter(s => s.id !== el.dataset.id); save(); refreshSheet(); },
  addTrigger() {
    const name = $('#tr-name').value.trim(), category = $('#tr-cat').value; if (!name) return toast('Please enter a name');
    if (allTriggers().some(t => t.name.toLowerCase() === name.toLowerCase())) return toast('That trigger already exists');
    S.customTriggers.push({ name, category, custom: true }); save(); refreshSheet(); toast('Trigger added');
  },
  delTrigger(el) { S.customTriggers = S.customTriggers.filter(t => t.name !== el.dataset.name); save(); refreshSheet(); },
  fillMed(el) { $('#am-name').value = el.dataset.name; $('#am-dose').value = el.dataset.dosage; $('.sheet-body', $('#sheets').lastElementChild).scrollTop = 0; },
  addMedSave() {
    const name = $('#am-name').value.trim(); if (!name) return toast('Please enter a name');
    if (S.meds.some(m => m.name.toLowerCase() === name.toLowerCase())) return toast('That medication is already saved');
    S.meds.push({ id: uid(), name, dosage: $('#am-dose').value.trim(), regular: $('#am-regular').checked }); save(); closeSheet();
  },
  async delMed(el) {
    const m = S.meds.find(x => x.id === el.dataset.id);
    if (!m || !await ask(`Remove ${m.name}?`, 'It stays in the attacks where you already logged it.', 'Remove', true)) return;
    S.meds = S.meds.filter(x => x.id !== m.id); save(); render();
  },
  lsOpt(el) {
    UI.sheets.at(-1).profile[el.dataset.key] = el.dataset.val;
    el.parentElement.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b === el));
  },
  lsStep(el) {
    const p = UI.sheets.at(-1).profile, f = LIFESTYLE[0].fields.find(x => x.key === el.dataset.key);
    p[f.key] = Math.min(f.max, Math.max(f.min, p[f.key] + +el.dataset.val));
    $('#ls-' + f.key).textContent = p[f.key] + f.unit;
  },
  lsNav(el) {
    const sh = UI.sheets.at(-1), next = sh.step + +el.dataset.val;
    if (next >= LIFESTYLE.length) { S.lifestyle = { ...sh.profile, completed: true }; save(); closeSheet(); return toast('Questionnaire saved'); }
    sh.step = next; refreshSheet(); $('.sheet-body', $('#sheets').lastElementChild).scrollTop = 0;
  },

  // --- tips ---
  tipFilter(el) {
    UI.tipFilter = el.dataset.val;
    const x = $('.hscroll')?.scrollLeft || 0; render();
    const bar = $('.hscroll'); if (bar) bar.scrollLeft = x;
  },
  saveTip(el) {
    const id = el.dataset.id;
    S.savedTips = S.savedTips.includes(id) ? S.savedTips.filter(x => x !== id) : S.savedTips.concat(id);
    save(); A.tipFilter({ dataset: { val: UI.tipFilter } });
  },
  addTipSave() {
    const content = $('#tip-text').value.trim(); if (!content) return toast('Please write your tip first');
    const sel = UI.sheets.at(-1).sel;
    S.myTips.unshift({ id: 'my-' + uid(), content, symptoms: [...sel.symptoms], tags: [...sel.tags], at: new Date().toISOString() });
    save(); UI.tipFilter = 'All'; closeSheet();
  },
  async delTip(el) {
    if (!await ask('Delete this tip?', 'Your tip will be removed from this device.', 'Delete', true)) return;
    S.myTips = S.myTips.filter(t => t.id !== el.dataset.id); S.savedTips = S.savedTips.filter(x => x !== el.dataset.id); save(); render();
  },

  // --- data ---
  backup() { backup(); },
  restore() { const i = $('#restore-input'); i.value = ''; i.click(); },
  exportCsv() { exportCsv(); },
  async demo() { if (await ask('Load example data?', 'Adds five made-up attacks so you can see how the app looks when filled. You can erase them in Settings.', 'Load')) loadDemo(); },
  async erase() {
    if (!await ask('Erase all data?', 'Every attack, medication, tip and setting is removed from this device. Backup files you saved elsewhere are not touched.', 'Erase', true)) return;
    S = blank(); save(false); closeAllSheets(); UI.attack = null; renderAttack(); UI.tab = 'home'; render(); toast('All data erased');
  }
};

/* ================= wiring ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled && A[el.dataset.act]) { A[el.dataset.act](el, e); return; }
  if (e.target.classList.contains('overlay') && !e.target.classList.contains('dialog-wrap') && UI.sheets.length) {
    const t = UI.sheets.at(-1).type;
    if (LIVE_SHEETS.includes(t) || t === 'info' || t === 'medQuick') closeSheet(); // sheets with unsaved input need an explicit Cancel
  }
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'intensity') {
    const o = $('#ed-int-out'); o.textContent = e.target.value; o.style.color = intColor(+e.target.value);
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') e.target.blur();
});
$('#restore-input').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(restoreFrom, () => toast('Could not read that file'));
});
setInterval(() => document.querySelectorAll('[data-live]').forEach(n => { n.textContent = ago(n.dataset.live); }), 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) document.querySelectorAll('[data-live]').forEach(n => { n.textContent = ago(n.dataset.live); }); });

$('#overlays').innerHTML = '<div id="fs"></div><div id="sheets"></div>';
S.events.forEach(e => { e.tried ||= []; });
if (S.activeEventId && !getEvent(S.activeEventId)) S.activeEventId = null;
render();

// Ask the browser not to evict our data, and enable offline use where service workers are available.
navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

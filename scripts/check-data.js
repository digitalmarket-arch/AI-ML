#!/usr/bin/env node
/* AI Marg data checker. Run:  node scripts/check-data.js
   Loads data/*.js the same way the browser does and reports problems. Exit code 1 if any error. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
const files = ['course', 'resources', 'quizzes', 'exercises', 'projects', 'glossary', 'pages', 'labs'];
const errors = [], warnings = [];
for (const f of files) {
  const p = path.join(ROOT, 'data', f + '.js');
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p }); }
  catch (e) { errors.push(`data/${f}.js does not load: ${e.message}`); }
}
const D = sandbox.window.AIM || {};
const mods = new Set((D.modules || []).map(m => m.id));
const levels = new Set((D.levels || []).map(l => l.id));
const dup = (arr, what) => { const s = new Set(); for (const x of arr) { if (s.has(x)) errors.push(`duplicate ${what} id: ${x}`); s.add(x); } };

dup((D.modules || []).map(m => m.id), 'module');
for (const m of D.modules || []) {
  if (!levels.has(m.level)) errors.push(`module ${m.id}: unknown level ${m.level}`);
  if (!m.title) errors.push(`module ${m.id}: missing title`);
  if (m.lab && !fs.existsSync(path.join(ROOT, 'assets/js/labs', m.lab + '.js'))) errors.push(`module ${m.id}: lab file assets/js/labs/${m.lab}.js not found`);
  for (const w of m.watch || []) if (!(D.resources || []).some(r => r.id === w.id)) errors.push(`module ${m.id}: watch list points to unknown resource ${w.id}`);
}
dup((D.resources || []).map(r => r.id), 'resource');
const LANGS = ['hindi', 'hinglish', 'indian-english', 'english'];
for (const r of D.resources || []) {
  if (!/^https:\/\//.test(r.url || '')) errors.push(`resource ${r.id}: url must start with https://`);
  if (!LANGS.includes(r.language)) errors.push(`resource ${r.id}: language must be one of ${LANGS.join(', ')}`);
  if (!(r.modules || []).length) errors.push(`resource ${r.id}: no modules`);
  for (const mid of r.modules || []) if (!mods.has(mid)) errors.push(`resource ${r.id}: unknown module ${mid}`);
  if (r.videoId && !/^[A-Za-z0-9_-]{11}$/.test(r.videoId)) errors.push(`resource ${r.id}: bad videoId`);
}
for (const m of D.modules || []) {
  const n = (D.resources || []).filter(r => (r.modules || []).includes(m.id)).length;
  if (!n) warnings.push(`module ${m.id} has no resources`);
}
const qids = [];
for (const [k, qs] of Object.entries(D.quizzes || {})) {
  if (!mods.has(k) && !/^test-l\d$/.test(k)) errors.push(`quiz set ${k}: not a module id or test-lN`);
  for (const q of qs) {
    qids.push(q.id);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`question ${q.id}: needs exactly 4 options`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) errors.push(`question ${q.id}: answer must be 0-3`);
    if (!q.q || !q.explain) errors.push(`question ${q.id}: missing text or explanation`);
  }
}
dup(qids, 'question');
dup((D.exercises || []).map(e => e.id), 'exercise');
for (const e of D.exercises || []) {
  if (!mods.has(e.moduleId)) errors.push(`exercise ${e.id}: unknown module ${e.moduleId}`);
  for (const k of ['title', 'task', 'starter', 'solution', 'tests']) if (!e[k]) errors.push(`exercise ${e.id}: missing ${k}`);
  if (e.tests && !/check\(/.test(e.tests)) errors.push(`exercise ${e.id}: tests must use check(...)`);
}
dup((D.projects || []).map(p => p.id), 'project');
for (const p of D.projects || []) {
  if (!/^p-/.test(p.id)) errors.push(`project ${p.id}: id must start with p-`);
  for (const mid of p.modules || []) if (!mods.has(mid)) errors.push(`project ${p.id}: unknown module ${mid}`);
  for (const d of p.datasets || []) if (d.url && !/^https:\/\//.test(d.url)) errors.push(`project ${p.id}: dataset url must be https`);
}
for (const l of D.labs || []) {
  if (!fs.existsSync(path.join(ROOT, 'assets/js/labs', l.id + '.js'))) errors.push(`lab ${l.id}: file assets/js/labs/${l.id}.js not found`);
  if (!mods.has(l.module)) errors.push(`lab ${l.id}: unknown module ${l.module}`);
  if (!(l.tasks || []).length) warnings.push(`lab ${l.id}: no tasks`);
}
for (const m of D.modules || []) if (m.lab && !(D.labs || []).some(l => l.id === m.lab)) errors.push(`module ${m.id}: lab ${m.lab} is missing from data/labs.js`);
for (const g of D.glossary || []) if (g.moduleId && !mods.has(g.moduleId)) warnings.push(`glossary ${g.term}: unknown module ${g.moduleId}`);
// reading diagrams: assets/figures/<module>.js registers window.AIFigures[module] = [{ id, after, title, caption, alt, svg }]
const FIG_AFTER = ['overview', 'outcomes', 'studySteps', 'keyTerms', 'indiaExample', 'commonMistakes', 'selfCheck', 'topics'];
for (const m of D.modules || []) {
  const f = path.join(ROOT, 'assets/figures', m.id + '.js');
  if (!m.figs) continue;
  if (!fs.existsSync(f)) { errors.push(`module ${m.id}: figs is on but ${f} is missing`); continue; }
  const sb = { window: {} }; vm.createContext(sb);
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), sb); } catch (e) { errors.push(`figures ${m.id}: file does not load: ${e.message}`); continue; }
  const figs = (sb.window.AIFigures || {})[m.id];
  if (!Array.isArray(figs) || !figs.length) { errors.push(`figures ${m.id}: nothing registered for this module`); continue; }
  dup(figs.map(x => x.id), 'figure');
  for (const x of figs) {
    for (const k of ['id', 'title', 'caption', 'alt', 'svg']) if (!x[k]) errors.push(`figure ${m.id}/${x.id}: missing ${k}`);
    if (x.after && !FIG_AFTER.includes(x.after)) errors.push(`figure ${m.id}/${x.id}: after must be one of ${FIG_AFTER.join(', ')}`);
    const svg = String(x.svg || '');
    if (!/^\s*<svg[\s>]/i.test(svg) || !/viewBox=/.test(svg)) errors.push(`figure ${m.id}/${x.id}: svg must start with <svg and have a viewBox`);
    if (/<script|<foreignObject|\son[a-z]+\s*=|javascript:|(?:xlink:)?href\s*=\s*["']?(?!#)/i.test(svg)) errors.push(`figure ${m.id}/${x.id}: svg contains scripts, event handlers or outside links`);
    if (/[ऀ-ॿ]/.test(JSON.stringify(x))) errors.push(`figure ${m.id}/${x.id}: text must be English (no Devanagari)`);
  }
}
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="([^"]+)"/g)) if (!/^https?:/.test(m[1]) && !fs.existsSync(path.join(ROOT, m[1]))) errors.push(`index.html loads missing file ${m[1]}`);

const count = (x) => (Array.isArray(x) ? x.length : Object.values(x || {}).reduce((s, v) => s + v.length, 0));
console.log(`modules ${count(D.modules)} · resources ${count(D.resources)} · questions ${count(D.quizzes)} · exercises ${count(D.exercises)} · projects ${count(D.projects)} · glossary ${count(D.glossary)}`);
warnings.forEach(w => console.log('warning:', w));
errors.forEach(e => console.log('ERROR:', e));
console.log(errors.length ? `${errors.length} error(s)` : 'All data checks passed.');
process.exit(errors.length ? 1 : 0);

#!/usr/bin/env node
// Fetches Thai Government Lottery results from glo.or.th and stores them as static JSON:
//   data/draws.json        main prizes of every draw (newest first) — what the app loads on start
//   data/full/<year>.json  prizes 2-5 and near-1st, one file per year — loaded only when checking a 6-digit ticket
//
// Usage:
//   node scripts/fetch-draws.mjs              latest draw + re-scan the last 2 months (what GitHub Actions runs)
//   node scripts/fetch-draws.mjs --backfill   scan every month from 2016 (first run; already-saved draws are skipped)
//   node scripts/fetch-draws.mjs --backfill --from=2020
//
// Files are rewritten only when a result was added, so scheduled runs without news make no commit.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const API = 'https://www.glo.or.th/api';
const DELAY_MS = 500;            // pause between requests so we stay gentle on glo.or.th
const args = process.argv.slice(2);
const BACKFILL = args.includes('--backfill');
const FROM_YEAR = +(args.find(a => a.startsWith('--from=')) || '--from=2016').split('=')[1];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');

// Today's date in Thailand (UTC+7), as YYYY-MM-DD.
const todayTH = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

async function post(endpoint, body) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'RuayStat results sync (GitHub Actions)' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      if (attempt >= 3) throw new Error(`${endpoint} ${JSON.stringify(body)} failed: ${err.message}`);
      await sleep(2000 * attempt);
    }
  }
}

// GLO record -> { main, full } or throws if the shape is not what we expect (never write half-broken data).
function normalize(rec) {
  const nums = key => ((rec.data && rec.data[key] && rec.data[key].number) || []).map(x => String(x.value)).sort();
  const main = {
    date: rec.date,
    first: nums('first')[0],
    front3: nums('last3f'),
    back3: nums('last3b'),
    last2: nums('last2')[0],
    pdf: rec.pdf_url || null
  };
  const full = { near1: nums('near1'), p2: nums('second'), p3: nums('third'), p4: nums('fourth'), p5: nums('fifth') };

  const ok = /^\d{4}-\d{2}-\d{2}$/.test(main.date || '') &&
    /^\d{6}$/.test(main.first || '') && /^\d{2}$/.test(main.last2 || '') &&
    main.front3.length === 2 && main.front3.every(x => /^\d{3}$/.test(x)) &&
    main.back3.length === 2 && main.back3.every(x => /^\d{3}$/.test(x)) &&
    full.p2.length === 5 && full.p3.length === 10 && full.p4.length === 50 && full.p5.length === 100 &&
    [...full.near1, ...full.p2, ...full.p3, ...full.p4, ...full.p5].every(x => /^\d{6}$/.test(x));
  if (!ok) throw new Error('Unexpected result format for ' + rec.date + ': ' + JSON.stringify(main));
  return { main, full };
}

// One specific date -> normalized result, or null when there was no draw that day / not announced yet.
async function fetchDate(iso) {
  const [y, m, d] = iso.split('-');
  const json = await post('/checking/getLotteryResult', { date: d, month: m, year: y });
  const rec = json && json.response && json.response.result;
  return rec && rec.data && rec.data.first ? normalize(rec) : null;
}

async function fetchLatest() {
  const json = await post('/lottery/getLatestLottery', {});
  const rec = json && json.response;
  return rec && rec.data && rec.data.first ? normalize(rec) : null;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}
async function writeJsonIfChanged(file, value) {
  const text = JSON.stringify(value, null, 1) + '\n';
  const old = await fs.readFile(file, 'utf8').catch(() => null);
  if (old === text) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text);
  return true;
}

// Draws are normally on the 1st and 16th but move for holidays: Jan 17, May 2, Dec 30 (for Jan 1),
// Jul 31, 2023 (for Aug 1) ... For each month we try candidate days per slot and stop at the first hit.
// The "1st" slot also checks the last days of the previous month. (Apr 16 - May 16, 2020 were cancelled for COVID.)
function candidateGroups(year, month) {
  const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const prevY = month === 1 ? year - 1 : year, prevM = month === 1 ? 12 : month - 1;
  const prevLast = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
  const first = [1, 2, 3, 4].map(d => iso(year, month, d))
    .concat([0, 1, 2, 3].map(k => iso(prevY, prevM, prevLast - k)));
  const sixteenth = [16, 17, 15].map(d => iso(year, month, d));
  return [first, sixteenth];
}

async function main() {
  const db = await readJson(path.join(DATA, 'draws.json'), { draws: [] });
  const byDate = new Map(db.draws.map(d => [d.date, d]));
  const fullByYear = new Map();
  const loadFull = async y => {
    if (!fullByYear.has(y)) fullByYear.set(y, await readJson(path.join(DATA, 'full', y + '.json'), {}));
    return fullByYear.get(y);
  };
  const added = [];
  const store = async ({ main, full }) => {
    if (byDate.has(main.date)) return;
    byDate.set(main.date, main);
    (await loadFull(main.date.slice(0, 4)))[main.date] = full;
    added.push(main.date);
    console.log(`+ ${main.date}  1st ${main.first}  last2 ${main.last2}`);
  };

  // 1) Latest draw
  const latest = await fetchLatest();
  if (latest) await store(latest);

  // 2) Scan months: everything since FROM_YEAR on backfill, otherwise the last 2 months (catches a missed run)
  const now = new Date(todayTH);
  const start = BACKFILL ? new Date(Date.UTC(FROM_YEAR, 0, 1)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  let requests = 0;
  for (let t = new Date(start); t <= now; t.setUTCMonth(t.getUTCMonth() + 1)) {
    for (const group of candidateGroups(t.getUTCFullYear(), t.getUTCMonth() + 1)) {
      if (group.some(d => byDate.has(d))) continue;                // slot already filled
      for (const day of group) {
        if (day > todayTH) break;
        requests++;
        const r = await fetchDate(day);
        await sleep(DELAY_MS);
        if (r) { await store(r); break; }
      }
    }
  }

  const draws = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  let changed = false;
  if (added.length) {
    changed = await writeJsonIfChanged(path.join(DATA, 'draws.json'), {
      source: 'https://www.glo.or.th',
      updated: new Date().toISOString(),
      count: draws.length,
      draws
    });
    for (const [y, full] of fullByYear) {
      const sorted = Object.fromEntries(Object.entries(full).sort(([a], [b]) => b.localeCompare(a)));
      await writeJsonIfChanged(path.join(DATA, 'full', y + '.json'), sorted);
    }
  }
  console.log(`Done: ${added.length} new draw(s), ${draws.length} total, ${requests} date request(s)${changed ? '' : ', no file changes'}.`);
}

main().catch(err => { console.error(err.message); process.exit(1); });

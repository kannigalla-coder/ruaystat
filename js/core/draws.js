// Draw results. Order of precedence for one date:
//   1. a result the user typed in (manual)
//   2. real results from data/draws.json (written by scripts/fetch-draws.mjs from glo.or.th)
//   3. deterministic sample data — only when data/draws.json cannot be loaded (e.g. opened as a local file)
(function (RS) {
  'use strict';
  const pad = RS.pad;

  RS.source = 'sample';            // 'real' once data/draws.json has loaded
  RS.dataUpdated = null;           // ISO time of the last results update
  let real = new Map();            // date -> { date, first, front3, back3, last2, pdf }
  let overrides = RS.store.get('overrides', {});
  const cache = new Map();

  // ----- sample data -----
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seedOf(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const rnum = (r, len) => pad(Math.floor(r() * Math.pow(10, len)), len);
  function sampleDraw(date) {
    const r = mulberry32(seedOf('ruay:' + date));
    return { first: rnum(r, 6), front3: [rnum(r, 3), rnum(r, 3)], back3: [rnum(r, 3), rnum(r, 3)], last2: rnum(r, 2), pdf: null };
  }
  function sampleLower(date) {
    const r = mulberry32(seedOf('low:' + date));
    const g = n => Array.from({ length: n }, () => rnum(r, 6));
    return { p2: g(5), p3: g(10), p4: g(50), p5: g(100) };
  }

  // ----- real results -----
  // Resolves true when real results are in use. Never rejects: on failure the app keeps the sample data.
  RS.loadDraws = async function () {
    try {
      const res = await fetch('data/draws.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json.draws || !json.draws.length) throw new Error('empty');
      real = new Map(json.draws.map(d => [d.date, d]));
      RS.source = 'real';
      RS.dataUpdated = json.updated || null;
      RS.useRealDates(json.draws.map(d => d.date));
      cache.clear();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Prizes 2-5 live in data/full/<year>.json and are fetched only when a screen needs them.
  const fullData = {};             // year -> { date: { near1, p2, p3, p4, p5 } }
  const fullLoads = new Map();     // year -> Promise<boolean>
  const fullFailed = new Set();

  RS.ensureFull = function (date) {
    if (RS.source !== 'real') return Promise.resolve(true);
    const y = date.slice(0, 4);
    if (!fullLoads.has(y)) {
      fullLoads.set(y, fetch('data/full/' + y + '.json', { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(j => { fullData[y] = j; return true; })
        .catch(() => { fullFailed.add(y); return false; }));
    }
    return fullLoads.get(y);
  };
  RS.ensureFullAll = dates => Promise.all([...new Set(dates)].map(RS.ensureFull));

  // 'manual' | 'ready' | 'missing' (year loaded, date absent) | 'loading' | 'failed' | 'not-loaded'
  RS.fullState = function (date) {
    if (overrides[date]) return 'manual';
    if (RS.source !== 'real') return 'ready';
    const y = date.slice(0, 4);
    if (fullData[y]) return fullData[y][date] ? 'ready' : 'missing';
    if (fullFailed.has(y)) return 'failed';
    return fullLoads.has(y) ? 'loading' : 'not-loaded';
  };

  // -> { p2, p3, p4, p5 } or null when not available right now (see RS.fullState for why)
  RS.lowerPrizes = function (date) {
    if (overrides[date]) return null;
    if (RS.source !== 'real') return sampleLower(date);
    const y = date.slice(0, 4);
    return (fullData[y] && fullData[y][date]) || null;
  };

  // ----- one draw -----
  // Returns { first, front3[2], back3[2], last2, pdf, manual, real }
  RS.getDraw = function (date) {
    if (!cache.has(date)) {
      const o = overrides[date];
      let r;
      if (o) r = Object.assign({ pdf: null }, o, { manual: true, real: false });
      else if (real.has(date)) r = Object.assign({}, real.get(date), { manual: false, real: true });
      else r = Object.assign(sampleDraw(date), { manual: false, real: false });
      cache.set(date, r);
    }
    return cache.get(date);
  };
  RS.hasOverride = date => !!overrides[date];
  RS.setOverride = function (date, result) {
    overrides[date] = result; RS.store.set('overrides', overrides); cache.clear(); RS.emit('results');
  };
  RS.clearOverride = function (date) {
    delete overrides[date]; RS.store.set('overrides', overrides); cache.clear(); RS.emit('results');
  };

  RS.nearFirst = f => { const n = +f; return [pad((n + 999999) % 1000000, 6), pad((n + 1) % 1000000, 6)]; };
})(window.RS);

// Frequency analysis and the weighted number generator. No DOM code here.
(function (RS) {
  'use strict';
  const pad = RS.pad;

  RS.TYPES = {
    last2:  { label: 'เลขท้าย 2 ตัว',       len: 2, perDraw: 1, src: r => [r.last2] },
    back3:  { label: 'เลขท้าย 3 ตัว',       len: 3, perDraw: 2, src: r => r.back3 },
    front3: { label: 'เลขหน้า 3 ตัว',       len: 3, perDraw: 2, src: r => r.front3 },
    first:  { label: 'รางวัลที่ 1 (6 ตัว)', len: 6, perDraw: 1, src: r => [r.first] }
  };
  RS.ALGOS = {
    hot:      { label: 'เลขออกบ่อย (Hot)',     desc: 'เลือกเฉพาะเลขที่เคยออก ยิ่งออกบ่อยยิ่งมีโอกาสถูกเลือก', icon: 'local_fire_department', tint: 'text-primary-container' },
    cold:     { label: 'เลขไม่ออกนาน (Cold)',  desc: 'ยิ่งไม่ออกมานานหลายงวด ยิ่งมีโอกาสถูกเลือก',          icon: 'ac_unit',               tint: 'text-cold' },
    balanced: { label: 'สมดุล (Balanced)',      desc: 'ใช้เฉพาะตัวเลขที่เคยออกในแต่ละหลัก และเลี่ยงเลขคู่หรือคี่ล้วน', icon: 'balance', tint: 'text-secondary' }
  };
  RS.CYCLES = [['all', 'ทุกงวด 1 & 16'], ['1', 'เฉพาะงวด 1'], ['16', 'เฉพาะงวด 16']];
  RS.YEARS = [1, 3, 5, 10];
  RS.cycleText = c => c === 'all' ? 'ทุกงวด' : 'งวดวันที่ ' + c;
  RS.oddCount = s => s.split('').filter(c => +c % 2).length;

  // f: { cycle: 'all'|'1'|'16', years, month: 0-11|null } -> past draws, newest first
  RS.filterDraws = function (f) {
    const cut = new Date(RS.NOW); cut.setFullYear(cut.getFullYear() - f.years);
    const cutT = cut.getTime();
    return RS.PAST.filter(d => d.t >= cutT && (f.cycle === 'all' || String(d.cycle) === f.cycle) && (f.month == null || d.month === f.month));
  };

  // count: times each number appeared; last/lastIdx: most recent date / draws ago; digits[pos][0-9]: per-position counts
  RS.analyze = function (draws, T) {
    const count = new Map(), last = new Map(), lastIdx = new Map();
    const digits = Array.from({ length: T.len }, () => Array(10).fill(0));
    draws.forEach((d, i) => {
      T.src(RS.getDraw(d.date)).forEach(n => {
        count.set(n, (count.get(n) || 0) + 1);
        if (!last.has(n)) { last.set(n, d.date); lastIdx.set(n, i); }
        for (let p = 0; p < T.len; p++) digits[p][+n[p]]++;
      });
    });
    return { count, last, lastIdx, digits, n: draws.length };
  };

  // Weighted pick; returns -1 when every weight is 0 (nothing in the statistics to choose from).
  function pick(w) {
    const total = w.reduce((a, b) => a + b, 0);
    if (total <= 0) return -1;
    let x = Math.random() * total;
    for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; }
    return w.length - 1;
  }

  // Rule: every number comes from results that actually happened in the selected draws.
  //   hot      -> only numbers that appeared; weight = count²
  //   cold     -> weight grows with draws since last seen (a number absent the whole period counts as the longest gap)
  //   balanced -> each digit must have appeared in that position; weight = product of those counts
  function weightFor(s, a, T, algo) {
    const c = a.count.get(s) || 0;
    if (algo === 'hot') return c * c;
    if (algo === 'cold') { const gap = a.lastIdx.has(s) ? a.lastIdx.get(s) : a.n + 2; return Math.pow(gap + 1, 2); }
    let w = 1;
    for (let p = 0; p < T.len; p++) w *= a.digits[p][+s[p]];
    const odd = RS.oddCount(s);
    return (odd === 0 || odd === T.len) ? w * 0.35 : w;
  }

  // Weight of one digit for 6-digit numbers (built position by position).
  // Only digits that appeared in that position of the 1st prize can be chosen.
  function digitWeight(c, algo) {
    if (c === 0) return 0;
    if (algo === 'hot') return c * c;
    if (algo === 'cold') return 1 / (c * c);
    return c;
  }

  // o: { cycle, years, month, type, qty, algo }
  // -> { sets: [string], a: analysis, pool: how many distinct numbers were possible (2-3 digits only) }
  // sets can be shorter than qty when the statistics do not contain enough numbers; the caller tells the user.
  RS.generateNumbers = function (o) {
    const T = RS.TYPES[o.type], a = RS.analyze(RS.filterDraws(o), T), sets = [];
    if (!a.n) return { sets, a, pool: 0 };
    if (T.len <= 3) {
      const N = Math.pow(10, T.len), nums = [], w = [];
      for (let i = 0; i < N; i++) { const s = pad(i, T.len); nums.push(s); w.push(weightFor(s, a, T, o.algo)); }
      const pool = w.filter(x => x > 0).length;
      for (let k = 0; k < o.qty; k++) {
        const i = pick(w); if (i < 0) break;
        sets.push(nums[i]); w[i] = 0;   // no repeats
      }
      return { sets, a, pool };
    }
    const used = new Set();
    for (let k = 0; k < o.qty; k++) {
      let s = null;
      for (let tries = 0; tries < 40; tries++) {
        const cand = a.digits.map(col => pick(col.map(c => digitWeight(c, o.algo))));
        if (cand.includes(-1)) break;
        const str = cand.join('');
        if (used.has(str)) continue;
        if (o.algo === 'balanced' && [0, 6].includes(RS.oddCount(str)) && tries < 39) continue;
        s = str; break;
      }
      if (!s) break;
      used.add(s); sets.push(s);
    }
    return { sets, a, pool: null };
  };

  RS.POSITIONS = ['แสน', 'หมื่น', 'พัน', 'ร้อย', 'สิบ', 'หน่วย'];
})(window.RS);

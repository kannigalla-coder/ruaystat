// Thai date formatting and the draw calendar (which dates have a draw, which is next).
(function (RS) {
  'use strict';

  const TH_M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const TH_MS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  const pad = (n, l) => String(n).padStart(l, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
  const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const thDate = (s, short) => { const d = parseIso(s); return d.getDate() + ' ' + (short ? TH_MS : TH_M)[d.getMonth()] + ' ' + (d.getFullYear() + 543); };
  const baht = n => n.toLocaleString('th-TH') + ' บาท';

  // Draws are on the 1st and 16th at 16:00, with the usual shifts:
  // Jan 1 -> Dec 30 of the previous year, Jan 16 -> Jan 17, May 1 -> May 2.
  // `cycle` is 1 or 16; `month` is the month the draw belongs to (0-11).
  function mk(d, cycle, month) {
    const t = new Date(d); t.setHours(16, 0, 0, 0);
    return { date: iso(d), cycle, month, t: t.getTime() };
  }
  function buildSchedule() {
    const out = [];
    for (let y = 2016; y <= 2030; y++) for (let m = 0; m < 12; m++) {
      if (m === 4) out.push(mk(new Date(y, 4, 2), 1, 4));
      else if (m !== 0) out.push(mk(new Date(y, m, 1), 1, m));
      out.push(mk(m === 0 ? new Date(y, 0, 17) : new Date(y, m, 16), 16, m));
      if (m === 11) out.push(mk(new Date(y, 11, 30), 1, 0));
    }
    return out.sort((a, b) => a.t - b.t);
  }

  const NOW = Date.now();
  const SCHEDULE = buildSchedule();

  Object.assign(RS, {
    TH_M, TH_MS, pad, iso, parseIso, thDate, baht,
    NOW,
    // Until real results load, past draws come from the estimated schedule above.
    PAST: SCHEDULE.filter(d => d.t <= NOW).reverse(),   // newest first
    NEXT: SCHEDULE.find(d => d.t > NOW),                 // the next draw is always estimated (no result exists yet)
    BY_DATE: new Map(SCHEDULE.map(d => [d.date, d]))
  });

  // Real draw dates replace the estimate, so shifted draws (e.g. Dec 29 instead of Dec 30) are exact.
  // A draw held on day 1-4 is the "1st" draw. One held on day 28-31 was moved earlier and is the
  // next month's "1st" draw (Dec 30 -> January, Jul 31, 2023 -> August). Anything else is the "16th" draw.
  RS.useRealDates = function (dates) {
    const list = dates.map(date => {
      const d = parseIso(date), day = d.getDate(), m = d.getMonth();
      const early = day >= 28;
      const t = new Date(d); t.setHours(16, 0, 0, 0);
      return { date, cycle: (day <= 4 || early) ? 1 : 16, month: early ? (m + 1) % 12 : m, t: t.getTime() };
    }).sort((a, b) => b.t - a.t);
    RS.PAST = list;
    RS.BY_DATE = new Map(list.map(d => [d.date, d]));
    SCHEDULE.forEach(d => { if (!RS.BY_DATE.has(d.date) && d.t > NOW) RS.BY_DATE.set(d.date, d); });
  };

  // A saved number points at the estimated date of its draw. If the real draw moved by a few days, find it.
  RS.resolveDraw = function (date) {
    const exact = RS.BY_DATE.get(date);
    if (exact && exact.t <= Date.now()) return exact;
    const t = parseIso(date).getTime();
    return RS.PAST.find(d => Math.abs(d.t - t) <= 4 * 864e5) || null;
  };
})(window.RS);

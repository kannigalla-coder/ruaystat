// Prize checking for one ticket against one draw.
(function (RS) {
  'use strict';

  const LOWER = [['p2', 'รางวัลที่ 2', 200000], ['p3', 'รางวัลที่ 3', 80000], ['p4', 'รางวัลที่ 4', 40000], ['p5', 'รางวัลที่ 5', 20000]];

  // num: 6, 3 or 2 digits. only: 'front3' | 'back3' limits a 3-digit check to one prize type.
  // Returns { wins: [{name, amt}], total, partial } — partial means prizes 2-5 were unavailable.
  // For a 6-digit ticket against real results, call RS.ensureFull(date) first so prizes 2-5 are loaded.
  RS.checkTicket = function (num, date, only) {
    const r = RS.getDraw(date), wins = [];
    const add = (name, amt) => wins.push({ name, amt });
    let lp = null;

    if (num.length === 6 && !only) {
      if (num === r.first) add('รางวัลที่ 1', 6000000);
      if (RS.nearFirst(r.first).includes(num)) add('ข้างเคียงรางวัลที่ 1', 100000);
      lp = RS.lowerPrizes(date);
      if (lp) LOWER.forEach(([k, name, amt]) => { if (lp[k].includes(num)) add(name, amt); });
      r.front3.forEach(x => { if (x === num.slice(0, 3)) add('เลขหน้า 3 ตัว', 4000); });
      r.back3.forEach(x => { if (x === num.slice(3)) add('เลขท้าย 3 ตัว', 4000); });
      if (r.last2 === num.slice(4)) add('เลขท้าย 2 ตัว', 2000);
    } else if (num.length === 3) {
      if (only !== 'back3') r.front3.forEach(x => { if (x === num) add('เลขหน้า 3 ตัว', 4000); });
      if (only !== 'front3') r.back3.forEach(x => { if (x === num) add('เลขท้าย 3 ตัว', 4000); });
    } else if (num.length === 2) {
      if (r.last2 === num) add('เลขท้าย 2 ตัว', 2000);
    }
    return { wins, total: wins.reduce((s, w) => s + w.amt, 0), partial: num.length === 6 && !only && !lp };
  };

  RS.LOWER_PRIZES = LOWER;
})(window.RS);

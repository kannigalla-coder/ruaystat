// Tab: สถิติ — last-2-digit heatmap, hot/cold lists, recent results table.
(function (RS) {
  'use strict';
  RS.tabs = RS.tabs || {};

  const TEMPLATE = `
    <div class="flex flex-col rounded-2xl bg-surface-container p-4 gap-4 shadow-lg">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-primary text-[20px]">analytics</span>
        <span class="text-[14px] font-bold">สถิติเลขท้าย 2 ตัว</span>
      </div>
      <div class="grid grid-cols-3 p-1 rounded-full bg-surface-container-lowest gap-1" data-group="cycle"></div>
      <div class="flex flex-wrap gap-1.5" data-group="years"></div>
      <p class="text-[11px] text-on-surface-variant" data-ref="summary"></p>
    </div>

    <div class="flex flex-col rounded-2xl bg-surface-container p-4 gap-3 shadow-lg">
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold">ตารางความถี่ 00–99</span>
        <span class="text-[10px] text-on-surface-variant">แตะช่องเพื่อดูรายละเอียด</span>
      </div>
      <div class="grid grid-cols-10 gap-1" data-ref="heatmap"></div>
      <div class="flex items-center gap-2 text-[10px] text-on-surface-variant">
        <span>ออกน้อย</span>
        <div class="h-2 flex-1 rounded-full" style="background: linear-gradient(90deg, rgba(245,158,11,.06), rgba(245,158,11,1))"></div>
        <span>ออกบ่อย</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      <div class="rounded-2xl bg-surface-container p-3 flex flex-col gap-2 min-w-0">
        <div class="flex items-center gap-1 text-primary-container">
          <span class="material-symbols-outlined fill text-[18px]">local_fire_department</span>
          <span class="text-[13px] font-bold text-on-surface">ออกบ่อย</span>
        </div>
        <ol class="flex flex-col gap-1.5" data-ref="hot"></ol>
      </div>
      <div class="rounded-2xl bg-surface-container p-3 flex flex-col gap-2 min-w-0">
        <div class="flex items-center gap-1 text-cold">
          <span class="material-symbols-outlined text-[18px]">ac_unit</span>
          <span class="text-[13px] font-bold text-on-surface">ไม่ออกนานสุด</span>
        </div>
        <ol class="flex flex-col gap-1.5" data-ref="cold"></ol>
      </div>
    </div>

    <div class="flex flex-col rounded-2xl bg-surface-container p-4 gap-3 shadow-lg">
      <span class="text-[14px] font-bold">ผลย้อนหลังในช่วงที่เลือก</span>
      <div class="overflow-x-auto">
        <table class="w-full text-[12px]">
          <thead><tr class="text-on-surface-variant text-left">
            <th class="font-semibold pb-2">งวด</th><th class="font-semibold pb-2">รางวัลที่ 1</th><th class="font-semibold pb-2 text-center">2 ตัว</th><th class="font-semibold pb-2">ท้าย 3 ตัว</th>
          </tr></thead>
          <tbody data-ref="recent"></tbody>
        </table>
      </div>
    </div>`;

  let el, ref;
  const state = Object.assign({ cycle: String(RS.NEXT.cycle), years: 5 }, RS.store.get('stat', {}) || {});
  const pad = RS.pad;

  function render() {
    const draws = RS.filterDraws({ cycle: state.cycle, years: state.years, month: null });
    const a = RS.analyze(draws, RS.TYPES.last2);

    ref.summary.textContent = draws.length
      ? `${draws.length} งวด ตั้งแต่ ${RS.thDate(draws[draws.length - 1].date, true)} ถึง ${RS.thDate(draws[0].date, true)} · ค่าเฉลี่ยที่คาดไว้ ${(draws.length / 100).toFixed(1)} ครั้งต่อเลข`
      : 'ไม่มีงวดในช่วงนี้';

    // Heatmap
    const max = Math.max(1, ...a.count.values());
    let h = '';
    for (let i = 0; i < 100; i++) {
      const s = pad(i, 2), c = a.count.get(s) || 0, al = c ? 0.12 + 0.88 * c / max : 0.05;
      h += `<button type="button" data-num="${s}" data-c="${c}" data-last="${a.last.get(s) || ''}" aria-label="เลข ${s} ออก ${c} ครั้ง"
        class="heat num rounded-md flex items-center justify-center text-[10px] font-semibold ${al > 0.55 ? 'text-on-primary-fixed' : 'text-on-surface-variant'}"
        style="background: rgba(245,158,11,${al.toFixed(2)})">${s}</button>`;
    }
    ref.heatmap.innerHTML = h;

    // Hot / cold
    const row = (i, n, color, right) => `<li class="flex items-center justify-between gap-1"><span class="flex items-center gap-1.5"><span class="text-[10px] text-on-surface-variant w-3">${i + 1}</span><span class="num text-[16px] font-bold ${color}">${n}</span></span><span class="text-[11px] text-on-surface-variant">${right}</span></li>`;
    const hot = Array.from(a.count.entries()).sort((x, y) => y[1] - x[1] || a.lastIdx.get(x[0]) - a.lastIdx.get(y[0])).slice(0, 5);
    ref.hot.innerHTML = hot.map(([n, c], i) => row(i, n, 'text-primary', c + ' ครั้ง')).join('') || '<li class="text-[11px] text-on-surface-variant">ไม่มีข้อมูล</li>';
    const cold = [];
    for (let i = 0; i < 100; i++) { const s = pad(i, 2); cold.push([s, a.lastIdx.has(s) ? a.lastIdx.get(s) : Infinity]); }
    cold.sort((x, y) => y[1] - x[1]);
    ref.cold.innerHTML = cold.slice(0, 5).map(([n, g], i) => row(i, n, 'text-cold', g === Infinity ? 'ไม่ออกเลย' : g + ' งวด')).join('');

    // Recent table
    ref.recent.innerHTML = draws.slice(0, 12).map(d => {
      const r = RS.getDraw(d.date);
      return `<tr class="border-t border-surface-bright/60"><td class="py-2 pr-2 whitespace-nowrap">${RS.thDate(d.date, true)}${r.manual ? ' <span class="text-secondary" title="ผลที่คุณกรอก">●</span>' : ''}</td><td class="num py-2 pr-2 tracking-wider">${r.first}</td><td class="num py-2 pr-2 text-center font-bold text-primary text-[14px]">${r.last2}</td><td class="num py-2 whitespace-nowrap">${r.back3.join(' ')}</td></tr>`;
    }).join('');
  }

  RS.tabs.stats = {
    mount(root) {
      el = root; el.innerHTML = TEMPLATE;
      ref = {}; RS.$$('[data-ref]', el).forEach(n => { ref[n.dataset.ref] = n; });
      RS.optionGroups(el, state, () => { RS.store.set('stat', state); render(); });
      ref.heatmap.addEventListener('click', e => {
        const b = e.target.closest('[data-num]'); if (!b) return;
        const c = +b.dataset.c;
        RS.toast('เลข ' + b.dataset.num + ': ' + (c ? 'ออก ' + c + ' ครั้ง ล่าสุด ' + RS.thDate(b.dataset.last, true) : 'ไม่ออกในช่วงนี้'));
      });
      RS.on('results', render);
      render();
    }
  };
})(window.RS);

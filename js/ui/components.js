// Shared UI pieces: toast, copy, lottery balls, and the option buttons used by filters.
(function (RS) {
  'use strict';

  let toastTimer;
  RS.toast = function (msg) {
    const t = RS.$('#toast');
    t.textContent = msg; t.classList.remove('opacity-0');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('opacity-0'), 2400);
  };

  RS.copy = function (text) {
    try {
      navigator.clipboard.writeText(text).then(() => RS.toast('คัดลอก ' + text + ' แล้ว'), () => RS.toast('คัดลอกไม่ได้ เลขคือ ' + text));
    } catch (e) { RS.toast('คัดลอกไม่ได้ เลขคือ ' + text); }
  };

  RS.balls = (s, size, popIn) => s.split('').map((d, i) =>
    `<div class="ball ${size}${popIn ? ' pop' : ''}" style="${popIn ? 'animation-delay:' + i * 70 + 'ms' : ''}"><span class="relative">${d}</span></div>`).join('');
  RS.ballSize = len => len === 2 ? 'ball-lg' : len === 3 ? 'ball-md' : 'ball-sm';

  const SEG_ON = 'bg-surface-bright text-primary font-bold shadow-md', SEG_OFF = 'text-on-surface-variant hover:text-on-surface';
  const CHIP_ON = 'bg-primary-container text-on-primary-container font-bold shadow-md', CHIP_OFF = 'bg-surface-container-high text-on-surface-variant hover:text-primary';
  const check = on => `<span class="material-symbols-outlined text-[18px] ${on ? 'fill' : 'opacity-40'}">${on ? 'check_circle' : 'radio_button_unchecked'}</span>`;

  // Option-group templates. Each returns button HTML; buttons carry data-val.
  const GROUPS = {
    cycle: cur => RS.CYCLES.map(([v, l]) =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === v}" class="py-2 text-center rounded-full text-[12px] transition-all ${cur === v ? SEG_ON : SEG_OFF}">${l}</button>`).join(''),
    years: cur => RS.YEARS.map(v =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === String(v)}" class="px-3 py-1.5 rounded-full text-[11px] transition-all ${cur === String(v) ? CHIP_ON : CHIP_OFF}">ย้อนหลัง ${v} ปี</button>`).join(''),
    monthMode: cur => [['next', 'เฉพาะเดือน' + RS.TH_M[RS.NEXT.month] + ' (เดือนเดียวกับงวดถัดไป)'], ['all', 'ทุกเดือน']].map(([v, l]) =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === v}" class="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] transition-all ${cur === v ? CHIP_ON : CHIP_OFF}">${v === 'next' ? '<span class="material-symbols-outlined text-[14px]">event_repeat</span>' : ''}${l}</button>`).join(''),
    type: cur => Object.entries(RS.TYPES).map(([v, T]) =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === v}" class="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${cur === v ? 'bg-surface-bright text-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}"><span class="text-[12px] ${cur === v ? 'font-bold' : ''}">${T.label}</span>${check(cur === v)}</button>`).join(''),
    qty: cur => [1, 2, 3, 5, 10].map(v =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === String(v)}" class="flex-1 py-1.5 rounded-lg text-center text-[12px] ${cur === String(v) ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}">${v} ชุด</button>`).join(''),
    algo: cur => Object.entries(RS.ALGOS).map(([v, A]) =>
      `<button type="button" data-val="${v}" aria-pressed="${cur === v}" class="flex items-center justify-between gap-2 p-2.5 rounded-lg text-left transition-colors ${cur === v ? 'bg-surface-container-high ring-1 ring-primary-container/50' : 'bg-surface-container-lowest hover:bg-surface-container-high'}"><span class="flex items-center gap-2 min-w-0"><span class="material-symbols-outlined text-[18px] ${A.tint}">${A.icon}</span><span class="flex flex-col min-w-0"><span class="text-[12px] ${cur === v ? 'font-bold text-primary' : 'text-on-surface'}">${A.label}</span><span class="text-[11px] text-on-surface-variant">${A.desc}</span></span></span>${check(cur === v)}</button>`).join('')
  };

  // Fills every [data-group] inside root from state, and wires clicks once.
  // onChange(key, value) is called with numbers already converted for years/qty.
  RS.optionGroups = function (root, state, onChange) {
    const render = () => RS.$$('[data-group]', root).forEach(el => { el.innerHTML = GROUPS[el.dataset.group](String(state[el.dataset.group])); });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-group] [data-val]');
      if (!b || !root.contains(b)) return;
      const key = b.closest('[data-group]').dataset.group, v = b.dataset.val;
      state[key] = (key === 'years' || key === 'qty') ? +v : v;
      render(); onChange(key, state[key]);
    });
    render();
    return render;
  };
})(window.RS);

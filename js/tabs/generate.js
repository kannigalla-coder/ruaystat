// Tab: สุ่มเลข — filters, number settings, generate button, result cards, tip.
(function (RS) {
  'use strict';
  RS.tabs = RS.tabs || {};

  const TEMPLATE = `
    <div class="relative overflow-hidden rounded-2xl bg-surface-container-high p-4 shadow-xl">
      <div class="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary-container/10 blur-2xl pointer-events-none"></div>
      <div class="relative flex flex-col gap-2">
        <div class="flex items-center gap-1 self-start px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary">
          <span class="material-symbols-outlined fill text-[16px]">calendar_today</span>
          <span class="text-[11px] font-semibold" data-ref="nextDraw"></span>
        </div>
        <h1 class="text-[22px] leading-tight font-bold text-primary" style="text-wrap: balance">สุ่มเลขจากสถิติย้อนหลัง</h1>
        <p class="text-[12px] text-on-surface-variant">สำหรับวันที่คิดเลขไม่ออก ระบบสุ่มเฉพาะจากผลที่เคยออกจริงในงวดและช่วงเวลาที่คุณเลือก ไม่สุ่มมั่ว</p>
      </div>
    </div>

    <div class="flex flex-col rounded-2xl bg-surface-container p-4 gap-4 shadow-lg">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-primary text-[20px]">filter_alt</span>
        <span class="text-[14px] font-bold">เลือกงวดอ้างอิงสถิติ</span>
      </div>
      <div class="grid grid-cols-3 p-1 rounded-full bg-surface-container-lowest gap-1" data-group="cycle"></div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] text-on-surface-variant">ช่วงเวลาย้อนหลัง</span>
        <div class="flex flex-wrap gap-1.5" data-group="years"></div>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] text-on-surface-variant">เดือนที่ใช้คิดสถิติ</span>
        <div class="flex flex-wrap gap-1.5" data-group="monthMode"></div>
      </div>
    </div>

    <div class="flex flex-col rounded-2xl bg-surface-container p-4 gap-4 shadow-lg">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-primary text-[20px]">tune</span>
        <span class="text-[14px] font-bold">รูปแบบตัวเลข</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] text-on-surface-variant">ประเภทตัวเลข</span>
        <div class="grid grid-cols-2 gap-1.5" data-group="type"></div>
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-on-surface-variant">จำนวนชุด</span>
          <span class="text-[12px] text-primary font-bold" data-ref="qtyLabel"></span>
        </div>
        <div class="flex gap-1.5" data-group="qty"></div>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] text-on-surface-variant">วิธีให้น้ำหนัก</span>
        <div class="flex flex-col gap-1.5" data-group="algo"></div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <button id="generateBtn" type="button" class="relative group w-full h-14 rounded-full bg-gradient-to-r from-primary-fixed-dim via-primary-container to-surface-tint text-on-primary text-[17px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all overflow-hidden">
        <span class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></span>
        <span class="material-symbols-outlined text-[24px]">bolt</span>
        <span data-ref="btnText"></span>
      </button>
      <div class="flex items-center justify-center gap-1.5 text-on-surface-variant">
        <span class="material-symbols-outlined text-[14px] text-secondary">database</span>
        <span class="text-[11px]" data-ref="basis"></span>
      </div>
    </div>

    <div class="flex flex-col gap-2.5" data-ref="results"></div>
    <div class="flex items-start gap-2 p-4 rounded-2xl bg-surface-container-low" data-ref="tip"></div>`;

  let el, ref, last = null;
  const state = Object.assign(
    { cycle: String(RS.NEXT.cycle), years: 5, monthMode: 'all', type: 'last2', qty: 2, algo: 'hot' },
    RS.store.get('gen', {}) || {}
  );
  const filter = () => ({ cycle: state.cycle, years: state.years, month: state.monthMode === 'next' ? RS.NEXT.month : null });

  function renderControls() {
    ref.qtyLabel.textContent = state.qty + ' ชุด';
    ref.btnText.textContent = 'สุ่มเลข ' + state.qty + ' ชุด (' + RS.TYPES[state.type].label.replace(' (6 ตัว)', '') + ')';
    const n = RS.filterDraws(filter()).length;
    ref.basis.textContent = n ? 'คำนวณจากผล ' + n + ' งวดที่ตรงเงื่อนไข' : 'ไม่มีงวดที่ตรงเงื่อนไข ลองขยายช่วงเวลา';
  }

  function generate(popIn) {
    const f = filter();
    const out = RS.generateNumbers(Object.assign({}, f, { type: state.type, qty: state.qty, algo: state.algo }));
    last = { sets: out.sets, a: out.a, pool: out.pool, qty: state.qty, type: state.type, algo: state.algo, f, years: state.years };
    renderResults(popIn);
  }

  function card(num, i) {
    const T = RS.TYPES[last.type], a = last.a;
    const c = a.count.get(num) || 0, lastDate = a.last.get(num), gap = a.lastIdx.get(num);
    const odd = RS.oddCount(num);
    let tag, footer;
    if (T.len <= 3) {
      const note = c ? `ออก ${c} ครั้งใน ${a.n} งวด · ล่าสุด ${RS.thDate(lastDate, true)}` : `ไม่ออกเลยตลอด ${a.n} งวดที่เลือก`;
      const slots = a.n * T.perDraw;
      const freq = slots ? (c / slots * 100).toFixed(1) + '%' : '–';
      tag = last.algo === 'cold' ? (gap == null ? 'ไม่ออกเลยในช่วงนี้' : `ไม่ออกมาแล้ว ${gap} งวด`)
        : last.algo === 'hot' ? `ออกแล้ว ${c} ครั้ง` : `คู่ ${T.len - odd} · คี่ ${odd}`;
      footer = `<div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-lowest">
        <div class="flex items-center gap-1.5 min-w-0"><span class="material-symbols-outlined text-secondary text-[16px]">history</span><span class="text-[11px] truncate">${note}</span></div>
        <div class="flex items-center gap-1 flex-shrink-0"><span class="text-[10px] text-on-surface-variant">ความถี่ย้อนหลัง</span><span class="num text-[12px] font-bold text-secondary">${freq}</span></div>
      </div>`;
    } else {
      // 6 digits: show where each digit came from (times it appeared in that position of the 1st prize).
      tag = last.algo === 'cold' ? 'หลักละตัวที่ออกน้อย' : last.algo === 'hot' ? 'หลักละตัวที่ออกบ่อย' : `คู่ ${6 - odd} · คี่ ${odd}`;
      const cols = num.split('').map((d, p) => `<div class="flex flex-col items-center gap-0.5 py-1.5 rounded-md bg-surface-container-lowest min-w-0">
          <span class="text-[10px] text-on-surface-variant">${RS.POSITIONS[p]}</span>
          <span class="num text-[11px] font-bold text-secondary">${a.digits[p][+d]}<span class="font-normal text-on-surface-variant"> ครั้ง</span></span>
        </div>`).join('');
      footer = `<div class="grid grid-cols-6 gap-1">${cols}</div>
        <p class="text-[11px] text-on-surface-variant">ตัวเลขแต่ละหลักเคยออกในตำแหน่งนั้นของรางวัลที่ 1 ตามจำนวนครั้งด้านบน (จาก ${a.n} งวด) ·
          ${c ? `เลขชุดนี้ทั้ง 6 หลักเคยออกเป็นรางวัลที่ 1 มาแล้ว ${c} ครั้ง` : 'เลขชุดนี้ทั้ง 6 หลักยังไม่เคยออกเป็นรางวัลที่ 1'}</p>`;
    }
    const sv = RS.saved.isSaved(num, last.type);
    return `<div class="flex flex-col rounded-2xl bg-surface-container-high p-4 gap-3 shadow-xl">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="px-2 py-0.5 rounded ${i === 0 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-bright text-primary'} text-[11px] font-bold flex-shrink-0">ชุดที่ ${i + 1}</span>
          <span class="text-[11px] text-on-surface-variant truncate">${tag}</span>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button type="button" data-act="copy" data-num="${num}" title="คัดลอกเลข" aria-label="คัดลอกเลข ${num}" class="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[16px]">content_copy</span></button>
          <button type="button" data-act="save" data-num="${num}" title="${sv ? 'เอาออกจากที่บันทึก' : 'บันทึกเลข'}" aria-pressed="${sv}" aria-label="บันทึกเลข ${num}" class="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center ${sv ? 'text-primary-container' : 'text-on-surface-variant'} hover:text-primary"><span class="material-symbols-outlined text-[16px] ${sv ? 'fill' : ''}">star</span></button>
        </div>
      </div>
      <div class="flex items-center justify-center flex-wrap ${T.len === 6 ? 'gap-1.5' : 'gap-3'} py-1">${RS.balls(num, RS.ballSize(T.len), card.popIn)}</div>
      ${footer}
    </div>`;
  }

  function renderResults(popIn) {
    if (!last) return;
    const T = RS.TYPES[last.type], a = last.a;
    const monthTxt = last.f.month != null ? ' เดือน' + RS.TH_M[last.f.month] : '';
    card.popIn = popIn;
    ref.results.innerHTML = `<div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0"><span class="material-symbols-outlined fill text-primary-container text-[20px]">stars</span>
        <h2 class="text-[17px] font-bold truncate">ผลการสุ่ม · ${RS.cycleText(last.f.cycle)}</h2></div>
        <button type="button" data-act="regen" class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-primary hover:bg-surface-bright text-[11px] flex-shrink-0"><span class="material-symbols-outlined text-[14px]">refresh</span>สุ่มซ้ำ</button>
      </div>
      <span class="text-[11px] text-on-surface-variant -mt-1">เกณฑ์: ${RS.cycleText(last.f.cycle)}${monthTxt} ย้อนหลัง ${last.years} ปี (${a.n} งวด) · ${RS.ALGOS[last.algo].label} · ${T.label}</span>` +
      shortNotice() + last.sets.map(card).join('');
    renderTip();
  }

  // Shown when the statistics hold fewer numbers than the user asked for (we never pad with numbers outside them).
  function shortNotice() {
    if (last.sets.length >= last.qty) return '';
    const T = RS.TYPES[last.type];
    const msg = !last.a.n ? 'ไม่มีงวดที่ตรงเงื่อนไขนี้ จึงยังสุ่มไม่ได้'
      : !last.sets.length ? 'ในช่วงที่เลือกยังไม่มีเลขที่เข้าเงื่อนไข จึงยังสุ่มไม่ได้'
      : T.len <= 3 ? `ในช่วงที่เลือกมี${T.label}ที่เข้าเงื่อนไขแค่ ${last.pool} เลข จึงสุ่มได้ ${last.sets.length} จาก ${last.qty} ชุด`
      : `สุ่มได้ ${last.sets.length} จาก ${last.qty} ชุด เพราะตัวเลขที่เคยออกในแต่ละหลักมีน้อย`;
    return `<div class="flex items-start gap-2 p-3 rounded-xl bg-primary-container/10 text-on-surface">
      <span class="material-symbols-outlined text-primary text-[18px] flex-shrink-0">info</span>
      <p class="text-[12px]">${msg} ลองขยายช่วงเวลาย้อนหลัง หรือเลือก "ทุกเดือน" / "ทุกงวด 1 &amp; 16"</p></div>`;
  }

  function renderTip() {
    const T = RS.TYPES[last.type];
    let body;
    if (T.len <= 3 && last.a.n) {
      const top = Array.from(last.a.count.entries()).sort((x, y) => y[1] - x[1]).slice(0, 3);
      body = `ใน${RS.cycleText(last.f.cycle)} ย้อนหลัง ${last.years} ปี ${T.label}ที่ออกบ่อยสุดคือ ` +
        top.map(([n, c]) => `<strong class="num text-primary">${n}</strong> (${c} ครั้ง)`).join(', ') +
        `. ทุกเลขยังมีโอกาสออก 1 ใน ${Math.pow(10, T.len).toLocaleString('th-TH')} เท่ากันในงวดหน้า`;
    } else {
      body = 'รางวัลที่ 1 แทบไม่เคยออกซ้ำทั้ง 6 หลัก ระบบจึงเลือกทีละหลักจากตัวเลขที่เคยออกในตำแหน่งนั้นจริง ทุกใบยังมีโอกาสถูก 1 ใน 1,000,000 เท่ากัน';
    }
    ref.tip.innerHTML = `<span class="material-symbols-outlined fill text-primary-container text-[20px] flex-shrink-0">lightbulb</span>
      <div class="flex flex-col gap-0.5 min-w-0"><span class="text-[12px] font-bold text-primary">เกร็ดสถิติ</span><p class="text-[12px] text-on-surface-variant">${body}</p></div>`;
  }

  RS.tabs.generate = {
    mount(root) {
      el = root; el.innerHTML = TEMPLATE;
      ref = {}; RS.$$('[data-ref]', el).forEach(n => { ref[n.dataset.ref] = n; });
      ref.nextDraw.textContent = 'งวดถัดไป: ' + RS.thDate(RS.NEXT.date) + ' เวลา 16:00 น.';

      RS.optionGroups(el, state, () => { RS.store.set('gen', state); renderControls(); });

      RS.$('#generateBtn', el).addEventListener('click', () => {
        generate(true);
        ref.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'regen') generate(true);
        if (b.dataset.act === 'copy') RS.copy(b.dataset.num);
        if (b.dataset.act === 'save') {
          const now = RS.saved.toggle(b.dataset.num, last.type, last.algo);
          RS.toast(now ? 'บันทึก ' + b.dataset.num + ' สำหรับงวด ' + RS.thDate(RS.NEXT.date, true) : 'เอา ' + b.dataset.num + ' ออกแล้ว');
        }
      });

      RS.on('saved', () => renderResults(false));
      RS.on('results', renderControls);

      renderControls();
      generate(false);
    }
  };
})(window.RS);

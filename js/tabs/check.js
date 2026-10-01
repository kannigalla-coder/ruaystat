// Tab: ตรวจรางวัล — ticket checker, draw result card, comparison with prior stats, manual result entry.
(function (RS) {
  'use strict';
  RS.tabs = RS.tabs || {};

  const TEMPLATE = `
    <div class="rounded-2xl bg-surface-container p-4 flex flex-col gap-4 shadow-xl">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined fill text-primary text-[20px]">search_check</span>
        <h2 class="text-[17px] font-bold">ตรวจรางวัล</h2>
      </div>
      <div class="flex flex-col gap-1">
        <label for="drawSelector" class="text-[12px] text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[15px]">event</span>งวดที่ต้องการตรวจ
        </label>
        <div class="relative">
          <select id="drawSelector" class="w-full h-12 appearance-none bg-surface-container-high text-on-surface rounded-lg px-4 pr-10 focus:outline-none cursor-pointer"></select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label for="lotteryNumberInput" class="text-[12px] text-on-surface-variant flex items-center justify-between">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">pin</span>เลขสลาก 6 หลัก หรือ 2–3 ตัว</span>
          <button type="button" id="clearInputBtn" class="text-tertiary text-[11px] hover:underline" hidden>ล้างเลข</button>
        </label>
        <input id="lotteryNumberInput" type="text" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="เช่น 253609 หรือ 85"
          class="num w-full h-14 bg-surface-container-lowest text-primary text-[30px] tracking-[0.25em] text-center rounded-lg placeholder:text-on-surface-variant/40 placeholder:text-[15px] placeholder:tracking-normal focus:outline-none focus:bg-surface-container-high shadow-inner">
      </div>
      <button id="submitCheckBtn" type="button" class="w-full h-14 rounded-full bg-gradient-to-r from-primary-fixed-dim via-primary-container to-surface-tint text-on-primary text-[15px] font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <span class="material-symbols-outlined text-[22px]">search</span>ตรวจเลขนี้
      </button>
      <div id="checkResultFeedback" class="rounded-xl p-4 bg-surface-container-highest" hidden></div>
    </div>

    <div class="rounded-2xl bg-surface-container p-4 flex flex-col gap-4 shadow-xl" data-ref="drawCard"></div>
    <div class="rounded-2xl bg-surface-container p-4 flex flex-col gap-3 shadow-lg" data-ref="insight"></div>

    <details class="rounded-2xl bg-surface-container p-4 shadow-lg">
      <summary class="flex items-center justify-between gap-2">
        <span class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-primary text-[20px]">edit_note</span>
          <span class="text-[14px] font-bold">กรอกผลรางวัลจริงของงวดนี้</span>
        </span>
        <span class="material-symbols-outlined chev text-on-surface-variant transition-transform">chevron_right</span>
      </summary>
      <form id="manualForm" class="flex flex-col gap-3 pt-4" novalidate>
        <p class="text-[12px] text-on-surface-variant">ผลที่กรอกจะแทนข้อมูลตัวอย่างของงวดที่เลือก และใช้ทั้งตอนตรวจรางวัลและตอนคำนวณสถิติ เก็บไว้ในเบราว์เซอร์นี้เท่านั้น</p>
        <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">รางวัลที่ 1 (6 หลัก)
          <input id="m-first" inputmode="numeric" maxlength="6" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[20px] tracking-[0.2em] text-center focus:outline-none">
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">เลขหน้า 3 ตัว (ชุด 1)<input id="m-f1" inputmode="numeric" maxlength="3" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[18px] text-center focus:outline-none"></label>
          <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">เลขหน้า 3 ตัว (ชุด 2)<input id="m-f2" inputmode="numeric" maxlength="3" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[18px] text-center focus:outline-none"></label>
          <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">เลขท้าย 3 ตัว (ชุด 1)<input id="m-b1" inputmode="numeric" maxlength="3" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[18px] text-center focus:outline-none"></label>
          <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">เลขท้าย 3 ตัว (ชุด 2)<input id="m-b2" inputmode="numeric" maxlength="3" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[18px] text-center focus:outline-none"></label>
        </div>
        <label class="flex flex-col gap-1 text-[11px] text-on-surface-variant">เลขท้าย 2 ตัว<input id="m-l2" inputmode="numeric" maxlength="2" class="num h-11 rounded-lg bg-surface-container-lowest text-primary text-[20px] text-center focus:outline-none"></label>
        <p class="text-[12px] text-error" id="manualError" hidden></p>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-11 rounded-full bg-primary-container text-on-primary-container font-bold">บันทึกผลงวดนี้</button>
          <button type="button" id="manualReset" class="h-11 px-4 rounded-full bg-surface-container-high text-tertiary text-[12px] font-semibold" hidden>ใช้ข้อมูลตัวอย่าง</button>
        </div>
      </form>
    </details>`;

  const MANUAL_IDS = ['m-first', 'm-f1', 'm-f2', 'm-b1', 'm-b2', 'm-l2'];
  let el, ref, selDate = null;     // set on mount, after results have loaded
  const $ = s => RS.$(s, el);

  // ----- result card -----
  function renderSelector() {
    $('#drawSelector').innerHTML = RS.PAST.map((d, i) =>
      `<option value="${d.date}" ${d.date === selDate ? 'selected' : ''}>งวดวันที่ ${RS.thDate(d.date)}${i === 0 ? ' (ล่าสุด)' : ''}${RS.hasOverride(d.date) ? ' ✓' : ''}</option>`).join('');
  }

  function renderDrawCard() {
    const r = RS.getDraw(selDate), near = RS.nearFirst(r.first);
    const src = r.manual
      ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>ผลที่คุณกรอก</span>'
      : r.real
        ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">verified</span>ผลจริง · glo.or.th</span>'
        : '<span class="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">ข้อมูลตัวอย่าง</span>';
    const pdf = r.pdf
      ? `<a href="${r.pdf}" target="_blank" rel="noopener" class="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary text-[12px] font-semibold">
          <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>ดูใบตรวจผลทางการ (PDF) ก่อนขึ้นเงินรางวัล</a>`
      : '';
    const box = (title, sub, inner, wide) => `<div class="rounded-xl bg-surface-container-high p-4 flex flex-col items-center text-center gap-2 ${wide ? 'col-span-2' : ''}"><div class="flex flex-col"><span class="text-[13px] font-bold">${title}</span><span class="text-[11px] text-on-surface-variant">${sub}</span></div>${inner}</div>`;
    const pills = arr => `<div class="flex gap-2 w-full">${arr.map(n => `<div class="flex-1 py-2 rounded-lg bg-surface-container-lowest shadow-inner"><span class="num text-[22px] font-bold text-primary tracking-wider">${n}</span></div>`).join('')}</div>`;

    // Prizes 2-5: loaded from data/full/<year>.json the first time a draw of that year is shown.
    let lower = '';
    if (!r.manual) {
      const lp = RS.lowerPrizes(selDate), state = RS.fullState(selDate);
      const body = lp
        ? RS.LOWER_PRIZES.map(([k, n, amt]) =>
          `<div class="flex flex-col gap-1.5"><span class="text-[11px] text-on-surface-variant">${n} · ${lp[k].length} รางวัล รางวัลละ ${RS.baht(amt)}</span><div class="grid grid-cols-4 sm:grid-cols-5 gap-1">${lp[k].map(x => `<span class="num text-[12px] text-center py-1 rounded bg-surface-container-lowest">${x}</span>`).join('')}</div></div>`).join('')
        : `<p class="text-[12px] text-on-surface-variant">${state === 'failed' || state === 'missing' ? 'โหลดรางวัลที่ 2–5 ของงวดนี้ไม่ได้ ดูได้จากใบตรวจผล PDF ด้านล่าง' : 'กำลังโหลดรางวัลที่ 2–5...'}</p>`;
      lower = `<details class="rounded-lg bg-surface-container-high" ${ref.lowerOpen ? 'open' : ''} data-ref-lower>
        <summary class="py-3 px-4 flex items-center justify-between text-primary text-[12px] font-semibold"><span class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>ดูรางวัลที่ 2–5</span><span class="material-symbols-outlined chev text-[18px] transition-transform">chevron_right</span></summary>
        <div class="px-4 pb-4 flex flex-col gap-3">${body}</div>
      </details>`;
      if (!lp && (state === 'not-loaded' || state === 'loading')) {
        const forDate = selDate;
        RS.ensureFull(forDate).then(() => { if (selDate === forDate) renderDrawCard(); });
      }
    }

    ref.drawCard.innerHTML = `<div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2"><span class="text-[10px] tracking-widest uppercase text-primary font-bold">ผลสลากกินแบ่ง</span>${src}</div>
        <h3 class="text-[19px] font-bold">งวดประจำวันที่ ${RS.thDate(selDate)}</h3>
      </div>
      <div class="rounded-xl bg-gradient-to-b from-surface-container-high to-surface-container-lowest p-4 flex flex-col items-center gap-2 shadow-md">
        <div class="flex items-center gap-1.5"><span class="material-symbols-outlined fill text-primary text-[18px]">military_tech</span><span class="text-[16px] font-bold text-primary">รางวัลที่ 1</span></div>
        <span class="text-[11px] text-on-surface-variant">รางวัลละ 6,000,000 บาท</span>
        <div class="flex items-center justify-center gap-1.5 py-1 flex-wrap">${RS.balls(r.first, 'ball-sm')}</div>
        <span class="text-[11px] text-on-surface-variant/80">ข้างเคียงรางวัลที่ 1 (รางวัลละ 100,000 บาท): <span class="num">${near.join(' , ')}</span></span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        ${box('เลขท้าย 2 ตัว', 'รางวัลละ 2,000 บาท', `<div class="flex gap-2">${RS.balls(r.last2, 'ball-lg')}</div>`, true)}
        ${box('เลขหน้า 3 ตัว', '2 รางวัล ละ 4,000', pills(r.front3))}
        ${box('เลขท้าย 3 ตัว', '2 รางวัล ละ 4,000', pills(r.back3))}
      </div>${lower}${pdf}`;
    const det = ref.drawCard.querySelector('[data-ref-lower]');
    if (det) det.addEventListener('toggle', () => { ref.lowerOpen = det.open; });
  }

  // ----- how this draw's last 2 digits ranked in the 5 years before it -----
  function renderInsight() {
    const sel = RS.BY_DATE.get(selDate), r = RS.getDraw(selDate);
    const from = new Date(sel.t); from.setFullYear(from.getFullYear() - 5);
    const prior = RS.PAST.filter(d => d.t < sel.t && d.t >= from.getTime() && d.cycle === sel.cycle);
    const a = RS.analyze(prior, RS.TYPES.last2), c = a.count.get(r.last2) || 0;
    const rank = 1 + Array.from(a.count.values()).filter(v => v > c).length;
    const top = rank <= 10 && c > 0;
    ref.insight.innerHTML = `<div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span class="material-symbols-outlined fill text-[18px]">insights</span></div>
        <div><h4 class="text-[14px] font-bold text-primary">งวดนี้เทียบกับสถิติก่อนหน้า</h4><span class="text-[11px] text-on-surface-variant">งวดวันที่ ${sel.cycle} ย้อนหลัง 5 ปีก่อนงวดนี้ (${prior.length} งวด)</span></div>
      </div>
      <div class="rounded-xl bg-surface-container-high p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg ${top ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-lowest text-on-surface-variant'} flex-shrink-0"><span class="material-symbols-outlined fill text-[20px]">${top ? 'local_fire_department' : 'casino'}</span></div>
        <div class="flex flex-col gap-1 min-w-0">
          <span class="text-[13px] font-semibold">เลขท้าย 2 ตัว <span class="num text-primary font-bold">${r.last2}</span> ${c ? `เคยออก ${c} ครั้ง อยู่อันดับ ${rank} จาก 100` : 'ไม่เคยออกเลยในช่วงนั้น'}</span>
          <p class="text-[12px] text-on-surface-variant">${top ? 'ตรงกับกลุ่มเลขออกบ่อย 10 อันดับแรกของสถิติก่อนหน้า' : 'ไม่อยู่ในกลุ่มเลขออกบ่อย 10 อันดับแรก'} ผลแบบนี้เกิดได้ตามปกติ เพราะเลขที่ออกแต่ละงวดไม่ขึ้นกับงวดก่อน</p>
        </div>
      </div>`;
  }

  // ----- ticket check -----
  function runCheck() {
    const v = $('#lotteryNumberInput').value.replace(/\D/g, '');
    const fb = $('#checkResultFeedback');
    const show = (icon, iconCls, title, desc) => {
      fb.hidden = false;
      fb.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconCls}"><span class="material-symbols-outlined fill text-[24px]">${icon}</span></div>
        <div class="flex flex-col min-w-0"><span class="text-[16px] font-bold">${title}</span><span class="text-[12px] text-on-surface-variant">${desc}</span></div></div>`;
    };
    if (![2, 3, 6].includes(v.length)) { show('error', 'bg-error/15 text-error', 'กรอกเลขไม่ครบ', 'ใส่เลข 6 หลัก เลข 3 ตัว หรือเลข 2 ตัว'); return; }
    const date = selDate, when = 'งวดวันที่ ' + RS.thDate(date);
    const finish = () => {
      if (date !== selDate) return;
      const res = RS.checkTicket(v, date);
      if (res.total) {
        show('emoji_events', 'bg-secondary/20 text-secondary', 'ถูกรางวัล ' + RS.baht(res.total),
          res.wins.map(w => w.name + ' (' + w.amt.toLocaleString('th-TH') + ')').join(' + ') + ' · ' + when);
      } else {
        const extra = !res.partial ? ''
          : RS.getDraw(date).manual ? ' (งวดนี้ตรวจได้เฉพาะรางวัลที่ 1, ข้างเคียง, เลขหน้า/ท้าย เพราะกรอกผลเอง)'
          : ' (ยังตรวจรางวัลที่ 2–5 ไม่ได้ เพราะโหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง หรือดูใบตรวจผล PDF)';
        show(res.partial ? 'help' : 'sentiment_neutral', 'bg-surface-container-lowest text-on-surface-variant',
          res.partial ? 'ยังตรวจไม่ครบ' : 'เลข ' + v + ' ไม่ถูกรางวัล', when + extra);
      }
    };
    if (v.length === 6 && RS.fullState(date) !== 'ready' && RS.fullState(date) !== 'manual') {
      show('hourglass_top', 'bg-surface-container-lowest text-on-surface-variant', 'กำลังตรวจ...', 'โหลดรางวัลที่ 2–5 ของ' + when);
      RS.ensureFull(date).then(finish);
    } else finish();
  }

  // ----- manual result entry -----
  function fillManualForm() {
    const r = RS.getDraw(selDate);
    const vals = [r.first, r.front3[0], r.front3[1], r.back3[0], r.back3[1], r.last2];
    MANUAL_IDS.forEach((id, i) => { $('#' + id).value = vals[i]; });
    $('#manualReset').hidden = !r.manual; $('#manualError').hidden = true;
    $('#manualReset').textContent = RS.source === 'real' ? 'ใช้ผลจริงจากระบบ' : 'ใช้ข้อมูลตัวอย่าง';
  }
  function submitManual(e) {
    e.preventDefault();
    const g = id => $('#' + id).value.trim();
    const o = { first: g('m-first'), front3: [g('m-f1'), g('m-f2')], back3: [g('m-b1'), g('m-b2')], last2: g('m-l2') };
    const ok = o.first.length === 6 && o.front3.every(x => x.length === 3) && o.back3.every(x => x.length === 3) && o.last2.length === 2;
    if (!ok) {
      const er = $('#manualError');
      er.textContent = 'กรอกให้ครบ: รางวัลที่ 1 หกหลัก เลขหน้าและเลขท้ายช่องละ 3 หลัก และเลขท้าย 2 ตัว 2 หลัก'; er.hidden = false;
      return;
    }
    RS.setOverride(selDate, o);
    RS.toast('บันทึกผลงวด ' + RS.thDate(selDate, true) + ' แล้ว');
  }

  function renderAll() {
    renderSelector(); renderDrawCard(); renderInsight(); fillManualForm();
    if ($('#lotteryNumberInput').value) runCheck();
  }

  RS.tabs.check = {
    mount(root) {
      el = root; el.innerHTML = TEMPLATE;
      ref = {}; RS.$$('[data-ref]', el).forEach(n => { ref[n.dataset.ref] = n; });
      selDate = RS.PAST[0].date;

      const input = $('#lotteryNumberInput');
      $('#submitCheckBtn').addEventListener('click', runCheck);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') runCheck(); });
      input.addEventListener('input', () => {
        const clean = input.value.replace(/\D/g, '').slice(0, 6);
        if (input.value !== clean) input.value = clean;
        $('#clearInputBtn').hidden = !clean;
        if (!clean) $('#checkResultFeedback').hidden = true;
      });
      $('#clearInputBtn').addEventListener('click', () => {
        input.value = ''; $('#clearInputBtn').hidden = true; $('#checkResultFeedback').hidden = true; input.focus();
      });
      $('#drawSelector').addEventListener('change', e => { selDate = e.target.value; renderAll(); });

      MANUAL_IDS.forEach(id => $('#' + id).addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); }));
      $('#manualForm').addEventListener('submit', submitManual);
      $('#manualReset').addEventListener('click', () => {
        RS.clearOverride(selDate);
        RS.toast(RS.source === 'real' ? 'กลับไปใช้ผลจริงของงวดนี้' : 'กลับไปใช้ข้อมูลตัวอย่างของงวดนี้');
      });

      RS.on('results', renderAll);
      renderAll();
    }
  };
})(window.RS);

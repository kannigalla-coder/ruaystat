// Tab: เลขที่บันทึก — saved numbers with automatic win/lose status, delete and clear-all.
(function (RS) {
  'use strict';
  RS.tabs = RS.tabs || {};

  const TEMPLATE = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined fill text-primary text-[22px]">bookmark</span>
        <h2 class="text-[18px] font-bold">เลขที่บันทึก</h2>
      </div>
      <button type="button" data-ref="clearBtn" class="px-3 py-1.5 rounded-full bg-surface-container-high text-tertiary text-[11px] font-semibold">ลบทั้งหมด</button>
    </div>
    <div class="flex flex-col gap-2.5" data-ref="list"></div>`;

  const EMPTY = `<div class="rounded-2xl bg-surface-container p-6 flex flex-col items-center text-center gap-2">
    <span class="material-symbols-outlined text-on-surface-variant text-[36px]">star</span>
    <p class="text-[14px] font-semibold">ยังไม่มีเลขที่บันทึก</p>
    <p class="text-[12px] text-on-surface-variant">กดรูปดาวบนเลขที่สุ่มได้ในแท็บสุ่มเลข เลขจะถูกเก็บไว้ที่นี่ และตรวจผลให้อัตโนมัติเมื่อถึงงวด</p>
    <a href="#generate" class="mt-1 px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-[12px] font-bold">ไปสุ่มเลข</a></div>`;

  const STATUS_STYLE = {
    waiting: ['bg-surface-container-lowest text-on-surface-variant', 'schedule'],
    win: ['bg-secondary/15 text-secondary', 'emoji_events'],
    lose: ['bg-surface-container-lowest text-on-surface-variant', 'close']
  };

  let el, ref, armed = false, armTimer;

  function item(x) {
    const st = RS.saved.status(x), [cls, icon] = STATUS_STYLE[st.state], T = RS.TYPES[x.type];
    return `<div class="rounded-2xl bg-surface-container p-3 flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1 flex-wrap">${RS.balls(x.num, 'ball-xs')}</div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button type="button" data-act="copy" data-num="${x.num}" aria-label="คัดลอกเลข ${x.num}" class="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[16px]">content_copy</span></button>
          <button type="button" data-act="del" data-id="${x.id}" aria-label="ลบเลข ${x.num}" class="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-tertiary"><span class="material-symbols-outlined text-[16px]">delete</span></button>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-[11px] text-on-surface-variant">${T.label}${x.algo ? ' · ' + RS.ALGOS[x.algo].label : ''}</span>
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}"><span class="material-symbols-outlined text-[13px]">${icon}</span>${st.text}</span>
      </div>
    </div>`;
  }

  function render() {
    const list = RS.saved.list();
    const badge = RS.$('#savedBadge');
    badge.hidden = !list.length; badge.textContent = list.length;
    ref.clearBtn.hidden = !list.length;
    ref.list.innerHTML = list.length ? list.map(item).join('') : EMPTY;
  }

  function disarm() { armed = false; ref.clearBtn.textContent = 'ลบทั้งหมด'; ref.clearBtn.classList.remove('ring-1', 'ring-tertiary'); }

  RS.tabs.saved = {
    mount(root) {
      el = root; el.innerHTML = TEMPLATE;
      ref = {}; RS.$$('[data-ref]', el).forEach(n => { ref[n.dataset.ref] = n; });

      // Two-tap confirm (the viewer blocks confirm() dialogs).
      ref.clearBtn.addEventListener('click', () => {
        if (!armed) {
          armed = true; ref.clearBtn.textContent = 'แตะอีกครั้งเพื่อยืนยัน'; ref.clearBtn.classList.add('ring-1', 'ring-tertiary');
          armTimer = setTimeout(disarm, 3000); return;
        }
        clearTimeout(armTimer); disarm();
        RS.saved.clear(); RS.toast('ลบเลขที่บันทึกทั้งหมดแล้ว');
      });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'copy') RS.copy(b.dataset.num);
        if (b.dataset.act === 'del') { RS.saved.remove(b.dataset.id); RS.toast('ลบแล้ว'); }
      });

      RS.on('saved', refresh);
      RS.on('results', refresh);
      refresh();
    },
    onShow: () => refresh()
  };

  // Render now, then again once prizes 2-5 for saved 6-digit numbers have loaded.
  function refresh() {
    render();
    const dates = RS.saved.drawDates().filter(d => RS.fullState(d) !== 'ready');
    if (dates.length) RS.ensureFullAll(dates).then(render);
  }
})(window.RS);

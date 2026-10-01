// App shell: mounts each tab, handles tab switching and the header countdown. Loaded last.
(function (RS) {
  'use strict';

  const TABS = ['generate', 'stats', 'saved', 'check'];

  function showTab(name) {
    if (!TABS.includes(name)) name = 'generate';
    TABS.forEach(t => { RS.$('#tab-' + t).hidden = t !== name; });
    RS.$$('[data-nav]').forEach(a => {
      const on = a.dataset.nav === name;
      a.classList.toggle('text-primary-container', on);
      a.classList.toggle('text-on-surface-variant', !on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      a.querySelector('.material-symbols-outlined').classList.toggle('fill', on);
    });
    const tab = RS.tabs[name];
    if (tab.onShow) tab.onShow();
    RS.store.set('tab', name);
    window.scrollTo(0, 0);
  }

  function renderCountdown() {
    const ms = RS.NEXT.t - Date.now();
    const days = Math.floor(ms / 864e5), hrs = Math.floor(ms / 36e5);
    RS.$('#hdrCountdownText').textContent = days >= 1 ? 'อีก ' + days + ' วัน' : hrs >= 1 ? 'อีก ' + hrs + ' ชม.' : 'ใกล้ออกผล';
  }

  // Footer note: says where the results come from.
  function renderSourceNote() {
    const note = RS.$('#sourceNote');
    if (RS.source === 'real') {
      const upd = RS.dataUpdated ? new Date(RS.dataUpdated) : null;
      note.innerHTML = 'ผลรางวัลดึงจากเว็บไซต์สำนักงานสลากกินแบ่งรัฐบาล (glo.or.th) อัตโนมัติ' +
        (upd ? ' อัปเดตล่าสุด ' + RS.thDate(RS.iso(upd), true) + ' ' + RS.pad(upd.getHours(), 2) + ':' + RS.pad(upd.getMinutes(), 2) + ' น.' : '') +
        ' ก่อนขึ้นเงินรางวัลให้ตรวจกับใบตรวจผลทางการ (PDF) ทุกครั้ง';
    } else {
      note.innerHTML = 'โหลดผลรางวัลจริงไม่ได้ ตอนนี้จึงแสดง<strong class="text-on-surface-variant">ข้อมูลตัวอย่างที่สร้างขึ้น</strong> ไม่ใช่ผลจริง ยกเว้นงวดที่คุณกรอกเอง';
    }
  }

  async function boot() {
    await RS.loadDraws();          // falls back to sample data on failure
    TABS.forEach(t => RS.tabs[t].mount(RS.$('#tab-' + t)));
    renderSourceNote();
    renderCountdown(); setInterval(renderCountdown, 60000);
    window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));
    showTab(location.hash.slice(1) || RS.store.get('tab', 'generate'));
  }
  boot();
})(window.RS);

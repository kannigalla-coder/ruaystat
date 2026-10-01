// Theme picker: อัตโนมัติ / สว่าง / มืด. Loaded in the page head so the saved theme applies before first paint.
// Sets data-app-theme on <html> ("light" | "dark"); "auto" removes it and follows the device. Colors live in css/style.css.
(function () {
  'use strict';
  const KEY = 'ruaystat.theme';
  const OPTIONS = [
    { val: 'auto', label: 'อัตโนมัติ', hint: 'ตามการตั้งค่าเครื่อง', icon: 'brightness_auto' },
    { val: 'light', label: 'โหมดสว่าง', hint: 'พื้นหลังสีอ่อน', icon: 'light_mode' },
    { val: 'dark', label: 'โหมดมืด', hint: 'พื้นหลังสีเข้ม', icon: 'dark_mode' }
  ];
  const read = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } };
  const write = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  function apply(v) {
    if (v === 'light' || v === 'dark') document.documentElement.setAttribute('data-app-theme', v);
    else document.documentElement.removeAttribute('data-app-theme');
  }
  let current = read();
  apply(current);

  function wire() {
    const btn = document.getElementById('themeBtn'), menu = document.getElementById('themeMenu');
    if (!btn || !menu) return;

    function render() {
      const opt = OPTIONS.find(o => o.val === current) || OPTIONS[0];
      btn.querySelector('.material-symbols-outlined').textContent = opt.icon;
      btn.setAttribute('aria-label', 'ธีม: ' + opt.label);
      menu.innerHTML = OPTIONS.map(o => `<button type="button" role="menuitemradio" aria-checked="${o.val === current}" data-theme-val="${o.val}"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${o.val === current ? 'bg-surface-container-high text-primary' : 'text-on-surface hover:bg-surface-container-high'}">
          <span class="material-symbols-outlined text-[20px] ${o.val === current ? 'fill' : ''}">${o.icon}</span>
          <span class="flex flex-col flex-1 min-w-0"><span class="text-[13px] font-semibold">${o.label}</span><span class="text-[11px] text-on-surface-variant">${o.hint}</span></span>
          ${o.val === current ? '<span class="material-symbols-outlined text-[18px]">check</span>' : ''}</button>`).join('');
    }
    const open = on => { menu.hidden = !on; btn.setAttribute('aria-expanded', on); };

    btn.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
    menu.addEventListener('click', e => {
      const b = e.target.closest('[data-theme-val]'); if (!b) return;
      current = b.dataset.themeVal; write(current); apply(current); render(); open(false);
      btn.focus();
    });
    document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) open(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();

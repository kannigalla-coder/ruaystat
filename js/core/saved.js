// Saved numbers: each is tied to the draw it was saved for, and checked once that draw is out.
(function (RS) {
  'use strict';

  let saved = RS.store.get('saved', []);
  const persist = () => { RS.store.set('saved', saved); RS.emit('saved'); };

  RS.saved = {
    list: () => saved,
    isSaved: (num, type) => saved.some(x => x.num === num && x.type === type && x.target === RS.NEXT.date),

    // Returns true if the number is now saved.
    toggle(num, type, algo) {
      if (this.isSaved(num, type)) {
        saved = saved.filter(x => !(x.num === num && x.type === type && x.target === RS.NEXT.date));
        persist(); return false;
      }
      saved.unshift({ id: Date.now() + '-' + num, num, type, target: RS.NEXT.date, algo: algo || null, savedAt: Date.now() });
      persist(); return true;
    },
    remove(id) { saved = saved.filter(x => x.id !== id); persist(); },
    clear() { saved = []; persist(); },

    // -> { state: 'waiting'|'win'|'lose', text, total }
    // 6-digit numbers also need prizes 2-5; the saved tab calls RS.ensureFullAll(saved.drawDates()) before rendering.
    status(x) {
      const d = RS.resolveDraw(x.target);
      if (!d) return { state: 'waiting', text: 'รอผล ' + RS.thDate(x.target, true) };
      const res = RS.checkTicket(x.num, d.date, x.type === 'first' ? null : x.type);
      if (res.total) return { state: 'win', text: res.wins.map(w => w.name).join(' + ') + ' · ' + RS.baht(res.total), total: res.total };
      if (res.partial) return { state: 'waiting', text: 'ยังตรวจรางวัลที่ 2–5 งวด ' + RS.thDate(d.date, true) + ' ไม่ได้' };
      return { state: 'lose', text: 'ไม่ถูกรางวัล งวด ' + RS.thDate(d.date, true) };
    },
    // Draw dates whose prizes 2-5 are needed to check the saved 6-digit numbers.
    drawDates() {
      return saved.filter(x => x.type === 'first').map(x => RS.resolveDraw(x.target)).filter(Boolean).map(d => d.date);
    }
  };
})(window.RS);

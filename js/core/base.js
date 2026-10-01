// Shared namespace, DOM shortcuts, safe storage and a tiny event bus.
// Events: 'results' (draw results changed), 'saved' (saved numbers changed).
window.RS = window.RS || {};
(function (RS) {
  'use strict';

  RS.$ = (s, root) => (root || document).querySelector(s);
  RS.$$ = (s, root) => Array.from((root || document).querySelectorAll(s));

  // localStorage may be blocked; the app must still work without it.
  RS.store = {
    get(k, fallback) {
      try { const v = localStorage.getItem('ruaystat.' + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem('ruaystat.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  const handlers = {};
  RS.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  RS.emit = (ev, ...args) => { (handlers[ev] || []).forEach(fn => fn(...args)); };
})(window.RS);

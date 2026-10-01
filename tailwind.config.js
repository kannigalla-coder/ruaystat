// Tailwind build config (npm run build:css -> css/app.css).
// Every color reads a CSS variable (RGB triplet) defined in css/style.css, so light/dark themes swap without touching markup.
const names = [
    'background', 'surface-dim', 'surface-tint', 'surface-bright',
    'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest',
    'on-surface', 'on-surface-variant',
    'primary', 'primary-container', 'primary-fixed', 'primary-fixed-dim',
    'on-primary', 'on-primary-container', 'on-primary-fixed', 'on-primary-fixed-variant',
    'secondary', 'secondary-container', 'secondary-fixed',
    'tertiary', 'error', 'cold'
  ];
const colors = {};
names.forEach(n => { colors[n] = 'rgb(var(--c-' + n + ') / <alpha-value>)'; });

module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        disp: ['Space Grotesk', 'Noto Sans Thai', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Noto Sans Thai', 'sans-serif']
      }
    }
  }
};

// One-off normaliser that put app/globals.css and app/needle-eye.css on the design tokens
// declared at the top of globals.css (type scale, 4 px spacing grid, body font, motion, states).
// Kept so the mapping is on record; rerunning it on normalised CSS changes nothing.
import fs from 'node:fs';

const TEXT = [[11, 'caption'], [13, 'footnote'], [15, 'body'], [17, 'callout'], [22, 'title'], [28, 'large']];
const textToken = (px) => {
  const [, name] = px <= 11.5 ? TEXT[0] : px <= 13 ? TEXT[1] : px <= 15 ? TEXT[2] : px <= 19 ? TEXT[3] : px <= 24 ? TEXT[4] : TEXT[5];
  return `var(--text-${name})`;
};
// Kept at their own size: the top-left title, the display code numerals, and SVG text (viewBox units, not px).
const TEXT_EXEMPT = /(^|[\s,>])h1(?![\w-])(?!\s*\.)|\.atlas-point-identifier>strong|\.scrub-card strong|\.compass-plot/;
const snap = (px) => { const a = Math.abs(px); if (a <= 2) return px; const v = Math.floor(a / 4 + 0.5) * 4; return px < 0 ? -v : v; };
const duration = (value) => { const ms = value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000; return ms <= 180 ? 'var(--dur-fast)' : ms <= 300 ? 'var(--dur-base)' : 'var(--dur-slow)'; };
// var(--ease-out, cubic-bezier(…)) first, so its nested curve is removed with it.
const EASE = /var\(--ease-out(?:,[^)]*\))?\)|cubic-bezier\([^)]*\)|ease-in-out|ease-out|ease-in|\bease\b/;
const stats = {};
const count = (key) => { stats[key] = (stats[key] ?? 0) + 1; };

function declarations(selector, body) {
  return body
    .replace(/font-size:\s*([\d.]+)px/g, (all, px) => { if (TEXT_EXEMPT.test(selector)) return all; count('font-size'); return `font-size:${textToken(+px)}`; })
    .replace(/((?:padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?:\s*)([^;}!]+)/g, (all, prop, value) => {
      if (value.includes('(')) return all;
      const next = value.replace(/-?[\d.]+px/g, (token) => `${snap(parseFloat(token))}px`);
      if (next !== value) count('spacing');
      return prop + next;
    })
    .replace(/font-family:\s*([^;}]+?)(\s*!important)?(?=[;}]|$)/g, (all, family, important = '') => {
      if (/^inherit|Bebas/.test(family.trim())) return all;
      count('font-family');
      return `font-family:var(--font-body)${important}${/monospace/.test(family) ? `;font-variant-numeric:tabular-nums${important}` : ''}`;
    })
    .replace(/transition:\s*([^;}]+?)(\s*!important)?(?=[;}]|$)/g, (all, value, important = '') => {
      if (/^none/.test(value.trim())) return all;
      count('transition');
      const parts = value.replace(new RegExp(EASE.source, 'g'), '').split(/,(?![^(]*\))/).map((part) => {
        const tokens = part.trim().replace(EASE, '').trim().split(/\s+/);
        const prop = tokens.find((t) => !/^[\d.]+m?s$/.test(t)) ?? 'all';
        const time = tokens.find((t) => /^[\d.]+m?s$/.test(t)) ?? '.2s';
        return `${prop} ${duration(time)} var(--ease)`;
      });
      return `transition:${parts.join(',')}${important}`;
    })
    .replace(/animation:\s*([^;}]+)/g, (all, value) => {
      if (/infinite|none|refuse|locator-pop/.test(value)) return all;
      const next = value.replace(EASE, 'var(--ease)');
      if (next !== value) count('animation');
      return `animation:${next}`;
    });
}

const normalise = (css) => css.replace(/([^{}]+)\{([^{}]*)\}/g, (all, selector, body) => `${selector}{${declarations(selector, body)}}`);

const TOKENS = `/* Design tokens (2026-09-26). Type: six steps; the top-left title, the display code numerals and
   SVG text keep their own sizes. Spacing: a 4 px grid, 1-2 px only as optical nudges. One body font,
   tabular numerals for figures. Motion: one decelerating curve, three durations. */
:root{--text-caption:11px;--text-footnote:13px;--text-body:15px;--text-callout:17px;--text-title:22px;--text-large:28px;--font-body:'S-Core Dream',Inter,ui-sans-serif,sans-serif;--ease:cubic-bezier(.32,.72,0,1);--dur-fast:140ms;--dur-base:240ms;--dur-slow:400ms;--focus-ring:2px solid #538d9a;--focus-offset:3px;--disabled-opacity:.4}
:where([data-slot=button],[data-slot=badge],[data-slot=input],[data-slot=combobox-input],[data-slot=combobox-item]){font-size:var(--text-footnote)}
`;
const STATES = `
/* Interaction states: one disabled look and one focus ring for every control. */
:where(button,[role=switch],[role=slider],a,summary):focus-visible{outline:var(--focus-ring);outline-offset:var(--focus-offset)}
`;

for (const file of ['app/globals.css', 'app/needle-eye.css']) {
  let css = fs.readFileSync(file, 'utf8');
  if (css.includes('--text-caption')) { console.log(file, 'already normalised'); continue; }
  css = normalise(css);
  if (file === 'app/globals.css') {
    css = css.replace(/@media\(prefers-color-scheme:dark\)\{\.locator-guide\{[^}]*\}\}/, () => { count('dark-mode'); return ''; });
    css = css
      .replace(/(button:focus-visible,a:focus-visible\{)outline:2px solid #538d9a;outline-offset:4px/, '$1outline:var(--focus-ring);outline-offset:var(--focus-offset)')
      .replace(/(\.acupuncture-panel-head:focus-visible\{)outline:2px solid #538d9a;outline-offset:5px/, '$1outline:var(--focus-ring);outline-offset:var(--focus-offset)')
      .replace(/(\.strata-core:focus-visible\{)outline:2px solid var\(--strata-accent\);outline-offset:3px/, '$1outline:var(--focus-ring);outline-offset:var(--focus-offset)')
      .replace(/(\.meridian-rail:focus-visible\{)outline:1px solid #b4c1ad;outline-offset:2px/, '$1outline:var(--focus-ring);outline-offset:var(--focus-offset)')
      .replace(/(\.acupoint-scrubber:focus-visible\{)box-shadow:inset 0 0 0 1px #465e4555/, '$1outline:var(--focus-ring);outline-offset:var(--focus-offset)')
      .replace(/(\.view-controls button:disabled\{)opacity:\.22/, '$1opacity:var(--disabled-opacity)')
      .replace(/(\.atlas-point-identifier button:disabled\{)opacity:\.35/, '$1opacity:var(--disabled-opacity)')
      .replace(/(\.auxiliary-tools button:disabled\{)opacity:\.35/, '$1opacity:var(--disabled-opacity)')
      .replace(/(\.meridian-tab:disabled\{)opacity:\.4/, '$1opacity:var(--disabled-opacity)')
      .replace(/(button:disabled\{)opacity:\.4/, '$1opacity:var(--disabled-opacity)')
      .replace(/(\.binary-toggle:disabled\{)background:#edf0f2!important/, '$1opacity:var(--disabled-opacity)');
    // After the leading @import/@custom-variant lines: a rule before an @import invalidates the import.
    css = css.replace(/^((?:@(?:import|custom-variant)[^\n]*\n)*)/, (head) => head + TOKENS) + STATES;
  } else {
    css = css.replace(/(\.needle-eye-launcher button:disabled \{\s*)opacity: \.28;/, '$1opacity: var(--disabled-opacity);');
  }
  fs.writeFileSync(file, css);
}
console.log(stats);

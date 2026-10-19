// logo.js — the AIPMS mark: a graduation cap tassel forming a subtle
// circuit/spark, inside a brass seal. Pure inline SVG so it themes with
// the existing CSS variables and needs no image assets.

const AIPMS_LOGO_SVG = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AIPMS logo">
  <defs>
    <linearGradient id="aipmsSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d9b15c"/>
      <stop offset="100%" stop-color="#b8862b"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="23" fill="url(#aipmsSealGrad)" stroke="#8a691f" stroke-width="1"/>
  <circle cx="24" cy="24" r="19" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1"/>
  <!-- graduation cap -->
  <path d="M24 13 L40 19.5 L24 26 L8 19.5 Z" fill="#16233d"/>
  <path d="M17 22.3 V29 c0 2.2 3.2 4 7 4 s7 -1.8 7 -4 v-6.7 L24 26 Z" fill="#16233d" opacity="0.92"/>
  <!-- tassel forming a small spark / node, hinting at AI -->
  <line x1="36" y1="19.5" x2="36" y2="27" stroke="#16233d" stroke-width="1.6"/>
  <circle cx="36" cy="29.2" r="2.1" fill="#fff"/>
  <circle cx="36" cy="29.2" r="1" fill="#16233d"/>
</svg>`.trim();

// Compact variant used at small sizes (topbar/sidebar) — same art, simpler viewBox handling via CSS sizing.
function logoMarkup(sizePx) {
  return `<span class="seal" style="width:${sizePx}px;height:${sizePx}px;background:none;box-shadow:none;display:inline-flex;">${AIPMS_LOGO_SVG}</span>`;
}

/* Small, monochrome navigation glyphs. Artwork lives in assets/home-reference. */
(function () {
  const paths = {
    home: '<path d="m2 11 10-8 10 8-2 2-8-6-8 6Z" fill="currentColor" stroke="none"/><path d="M5 11v10h5v-6h4v6h5V11"/>',
    split: '<circle cx="12" cy="6" r="3" fill="currentColor"/><circle cx="4.5" cy="8" r="2"/><circle cx="19.5" cy="8" r="2"/><path d="M7 21v-5a5 5 0 0 1 10 0v5ZM2 19v-4a3 3 0 0 1 4-3m16 7v-4a3 3 0 0 0-4-3" fill="currentColor"/>',
    debt: '<path d="M4 23c-1-5 1-8 5-11L5 10l4-2-4-5 7 3-1-6 5 6c3 0 3 2 4 3l3 2-1 5-5-1-2-2-2 4 4 3v3Z" fill="currentColor" stroke="none"/><path d="m3 20-2-4 4 1m-1-4-3-3 6 1M10 6 7 1l6 5" fill="currentColor" stroke="none"/><path d="m17 9 2 1m-2 3 3 1" stroke="var(--icon-cutout,#39271b)" stroke-width="1.1"/>',
    castle: '<path d="M1 24v-8h3v-4L1 9h4V4L9 0l4 4v5h3l-3 3v12Zm13 0V14h2v-4h2V8l3-3 3 3v2h2v4h2v10ZM5 5v3h7V5m2 3 4-3V1l7 2-7 2M0 23h28" fill="currentColor" stroke="none"/>',
    compare: '<path d="M12 3v18M7 21h10M3 7l9-2 9 2M4 8l-3 8h6Zm16 0-3 8h6Z"/><path d="M1 16a3 3 0 0 0 6 0m10 0a3 3 0 0 0 6 0"/><circle cx="12" cy="4" r="1.6" fill="currentColor"/>',
    treasury: '<path d="m2 8 10-6 10 6v2H2ZM3 20h18v2H3ZM5 12v6m5-6v6m4-6v6m5-6v6"/><circle cx="12" cy="7" r="1" fill="currentColor"/>',
    moon: '<path d="M20.5 14.2A9 9 0 0 1 9.8 3.5a9 9 0 1 0 10.7 10.7Z" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    bell: '<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z" fill="currentColor"/><path d="M10 20h4M12 2v2"/>',
    play: '<path d="m7 3 14 9-14 9Z" fill="currentColor" stroke="none"/>',
    scroll: '<path d="M6 3h13a2 2 0 0 1 2 2v2h-4V5a2 2 0 0 0-4 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2h6v2a2 2 0 0 0 4 0M6 17V5a2 2 0 0 0-4 0v2h4M8 8h3m-3 3h3m-3 3h3"/>',
    arrow: '<path d="M3 12h17m-6-6 6 6-6 6"/>',
    swords: '<path d="m3 2 4 1 13 14-3 3L3 7Zm18 0-4 1-5 5m-4 4-5 5 3 3 5-5M2 16l6 6m8-20L22 8M16 16l6 6M2 22l3-3m14 0 3 3"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    more: '<circle cx="12" cy="4" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="20" r="1.6" fill="currentColor"/>',
    close: '<path d="m5 5 14 14M5 19 19 5"/>',
    star: '<path d="m12 2 3 6.5 7 .8-5.2 5 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.3l7-.8Z" fill="#ffe49a" stroke="#c68a12"/>',
    flame: '<path d="M13 2c2 6-3 6-1 11 2-1 3-3 3-5 8 9 3 14-3 14C3 22 2 14 7 9c-1 5 3 5 3 2s3-6 3-9Z" fill="#e54d20" stroke="none"/><path d="M12 14c4 4 3 6 0 6s-3-3 0-6" fill="#ffd36b" stroke="none"/>',
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 14v5m-5 2h10l-2-3H9Z" fill="#eebd54" stroke="#92611e"/>',
    shield: '<path d="m12 2 9 4-1 8-8 8-8-8-1-8Z" fill="currentColor"/><path d="m8 12 3 3 5-6" stroke="var(--icon-cutout,#fff)"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8H9v4h6v4H9m3-10v12"/>',
    link: '<path d="m10 14 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2" transform="translate(2 0) scale(.85 1)"/>',
    eye: '<path d="M2 12S6 5 12 5s10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="m3 3 18 18M9.5 5.3A10 10 0 0 1 12 5c6 0 10 7 10 7a21 21 0 0 1-3.2 3.9M6 6.7A23 23 0 0 0 2 12s4 7 10 7c1.7 0 3.3-.6 4.7-1.5M10 10a3 3 0 0 0 4 4"/>',
    lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>',
    toolbox: '<path d="M8 7V4h8v3" stroke="#554236" stroke-width="2"/><rect x="2" y="7" width="20" height="14" rx="2" fill="#b5382a" stroke="#70271d"/><path d="M2 12h20M3 18h18" stroke="#edaa7e"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#ecdac1" stroke="#705845"/>',
    coins: '<g fill="#efbc40" stroke="#916518" stroke-width="1.1"><path d="M2 15v5c0 3 12 3 12 0v-5"/><ellipse cx="8" cy="15" rx="6" ry="2.5"/><path d="M11 5v14c0 3 11 3 11 0V5"/><ellipse cx="16.5" cy="5" rx="5.5" ry="2.5"/><path d="M11 9c2 3 9 3 11 0m-11 5c2 3 9 3 11 0M3 19c3 2 6 2 10 0"/></g>',
    compass: '<circle cx="12" cy="13" r="9" fill="#f5e5b8" stroke="#8b5c23"/><circle cx="12" cy="13" r="6.7" stroke="#9d742e"/><path d="m15 6-1 8-5 6 1-8Z" fill="#984730" stroke="#653619"/><path d="m15 6-5 6 4 2Z" fill="#f9f1d6"/><path d="M12 4V2m-2 0h4M3 13h3m12 0h3" stroke="#8b5c23"/>',
    profile: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    settings: '<path d="m9 3 1-2h4l1 2 3 2 2 1 2 4-2 2v3l1 2-3 4-3-1-3 1-2 2-4-2v-3l-2-3-2-1V9l3-1 2-3Z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M10 3H3v18h7M9 12h13m-5-5 5 5-5 5"/>'
  };
  window.CoinQuestIcons = (name, className = '') => `<svg class="cq-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.scroll}</svg>`;
})();

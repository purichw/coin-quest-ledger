(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function steps(copy) {
    return [
      { ic: '⚔️', bg: 255, t: copy.tourT0, b: copy.tourB0 },
      { ic: '💸', bg: 150, t: copy.tourT1, b: copy.tourB1 },
      { ic: '🐉', bg: 25, t: copy.tourT2, b: copy.tourB2 },
      { ic: '⚖️', bg: 42, t: copy.tourT3, b: copy.tourB3 },
      { ic: '🏦', bg: 78, t: copy.tourT4, b: copy.tourB4 }
    ];
  }

  function render({ steps: tourSteps, index, copy }) {
    const st = tourSteps[index];
    return `<div class="tour-overlay"><div class="tour-card">
      <button class="tour-skip" type="button" data-done>${h(copy.tourSkip)}</button>
      <div class="tour-art" style="background:radial-gradient(120% 90% at 50% 18%, oklch(0.6 0.13 ${st.bg}), oklch(0.22 0.06 ${st.bg}) 82%)"><span class="tour-emoji">${h(st.ic)}</span></div>
      <div class="tour-t">${h(st.t)}</div><div class="tour-b">${h(st.b)}</div>
      <div class="tour-dots">${tourSteps.map((_, i) => `<button type="button" class="tour-dot ${i === index ? 'on' : ''}" data-step="${i}" aria-label="step ${i + 1}"></button>`).join('')}</div>
      <div class="tour-nav">${index > 0 ? `<button class="tour-btn tour-back" type="button" data-back>← ${h(copy.tourBack)}</button>` : '<span></span>'}<button class="tour-btn tour-next" type="button" data-next>${index === tourSteps.length - 1 ? h(copy.tourDone) : h(copy.tourNext) + ' →'}</button></div>
    </div></div>`;
  }

  window.PointyProfileTour = {
    steps,
    render
  };
})();

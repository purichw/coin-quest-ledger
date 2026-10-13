(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function steps(copy) {
    return [
      { id: 'welcome', t: copy.tourT0, b: copy.tourB0 },
      { id: 'party', t: copy.tourT3, b: copy.tourB3, points: copy.tourPartyPoints },
      { id: 'debt', t: copy.tourT2, b: copy.tourB2, points: copy.tourDebtPoints },
      { id: 'treasury', t: copy.tourT4, b: copy.tourB4, points: copy.tourTreasuryPoints },
      { id: 'compare', t: copy.tourT1, b: copy.tourB1, points: copy.tourComparePoints }
    ];
  }

  function render({ steps: tourSteps, index, copy, contentOnly = false }) {
    const st = tourSteps[index];
    const icon = window.CoinQuestIcons;
    const features = ['tour/friends', 'home-reference/dragon', 'tour/budget', 'home-reference/scales'];
    const card = `<section class="tour-card tour-${st.id}${contentOnly ? '' : ' tour-enter'}" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
      <div class="tour-scroll">
        <div class="tour-scene">
          <div class="tour-art"><img src="/assets/tour/${st.id}.webp" alt="" width="${st.id === 'debt' ? 1536 : 1881}" height="${st.id === 'debt' ? 1024 : 836}" decoding="async"></div>
          <button class="tour-skip" type="button" data-done>${h(copy.tourSkip)} ${icon('close')}</button>
          <div class="tour-copy">
            <h2 class="tour-t" id="tour-title" tabindex="-1"><span class="tour-sr">${h(copy.tourStep)} ${index + 1} / ${tourSteps.length}: </span>${h(st.t)}</h2>
            <p class="tour-b" id="tour-description">${h(st.b)}</p>
            ${st.points ? `<ul class="tour-points">${st.points.map(point => `<li><span aria-hidden="true">✓</span>${h(point)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
        ${index === 0 ? `<ul class="tour-features">${features.map((asset, i) => `<li><span class="tour-feature-icon"><img src="/assets/${asset}.webp" alt="" width="48" height="48"></span><strong>${h(copy.tourFeatures[i][0])}</strong><span>${h(copy.tourFeatures[i][1])}</span></li>`).join('')}</ul>` : ''}
      </div>
      <footer class="tour-controls">
        <div class="tour-dots" aria-label="${h(copy.tourProgress)}">${tourSteps.map((step, i) => `<button type="button" class="tour-dot ${i === index ? 'on' : ''}" data-step="${i}" ${i === index ? 'aria-current="step"' : ''} aria-label="${h(copy.tourStep)} ${i + 1}: ${h(step.t)}"><span></span></button>`).join('')}</div>
        <div class="tour-nav"><button class="tour-btn tour-back" type="button" data-back ${index === 0 ? 'disabled' : ''}>${icon('arrow')} ${h(copy.tourBack)}</button><button class="tour-btn tour-next" type="button" data-next>${h(index === tourSteps.length - 1 ? copy.tourDone : copy.tourNext)} ${icon('arrow')}</button></div>
      </footer>
    </section>`;
    return contentOnly ? card : `<div class="tour-overlay">${card}</div>`;
  }

  window.PointyProfileTour = {
    steps,
    render
  };
})();

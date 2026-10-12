(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderPicker({ copy, pickerGender, options }) {
    return `<div class="picker-overlay" data-picker-close>
      <div class="picker" role="dialog" aria-modal="true" aria-label="${h(copy.chooseHero)}" data-picker-dialog>
        <div class="picker-head">
          <div>
            <div class="picker-title">⚔️ ${h(copy.chooseHero)}</div>
            <div class="picker-sub">${h(copy.chooseHeroSub)}</div>
          </div>
          <button type="button" class="picker-close" data-picker-close aria-label="Close">×</button>
        </div>
        <div class="picker-filter" role="group" aria-label="Hero filter">
          <button type="button" class="${pickerGender === 'all' ? 'on' : ''}" data-picker-gender="all">${h(copy.allHeroes)}</button>
          <button type="button" class="${pickerGender === 'female' ? 'on' : ''}" data-picker-gender="female">♀ ${h(copy.female)}</button>
          <button type="button" class="${pickerGender === 'male' ? 'on' : ''}" data-picker-gender="male">♂ ${h(copy.male)}</button>
        </div>
        <div class="picker-grid">
          ${options.map(opt => `<button type="button" class="picker-cell ${opt.selected ? 'on' : ''}" data-char-class="${h(opt.classId)}" data-char-gender="${h(opt.gender)}">
            ${opt.artHtml}
            <div class="pc-name"><span class="pc-gender">${opt.gender === 'female' ? '♀' : '♂'}</span>${h(opt.label)}</div>
            ${opt.selected ? '<div class="pc-check">✓</div>' : ''}
          </button>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function render({ copy, langKey, userId, name, lootChestSrc, picked, pickerOpen, pickerGender, options }) {
    return `<div class="login-wrap">
      <div class="login-langs">
        <button type="button" class="${langKey === 'th' ? 'on' : ''}" data-login-lang="th">TH</button>
        <button type="button" class="${langKey === 'en' ? 'on' : ''}" data-login-lang="en">EN</button>
      </div>
        <form class="login-card cc-card" data-char-form>
        <div class="login-crest" aria-hidden="true"><img src="${h(lootChestSrc)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">🎁</span></div>
        <h1 class="login-title">${h(copy.charTitle)}</h1>
        <p class="login-sub">${h(copy.charSub)}</p>
        <div class="cc-uid">${h(copy.yourUserId)} · <b>${h(userId)}</b></div>

        <div class="cc-hero">
          <button type="button" class="cc-portrait ${picked ? 'has' : ''}" data-char-open-picker aria-label="${h(copy.tapToChoose)}">
            ${picked ? picked.portraitHtml : `<span class="cc-q"><span class="cc-q-mark">?</span><span class="cc-q-lab">${h(copy.tapToChoose)}</span></span>`}
          </button>
          ${picked ? `<div class="cc-cls">${h(picked.glyph || '')} ${h(picked.label)}</div>` : ''}
        </div>

        <label class="login-field">
          <span>${h(copy.charName)}</span>
          <input type="text" maxlength="30" autocomplete="nickname" data-char-name value="${h(name || '')}" placeholder="${h(copy.charNamePlaceholder)}">
        </label>
        <div class="login-err" data-char-error hidden></div>
        <button type="submit" class="login-btn" ${picked ? '' : 'disabled'}>⚔️ ${h(copy.charCreate)}</button>
      </form>
      ${pickerOpen ? renderPicker({ copy, pickerGender, options }) : ''}
    </div>`;
  }

  window.PointyProfileCharacterCreate = {
    render
  };
})();

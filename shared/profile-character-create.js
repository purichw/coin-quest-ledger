(function () {
  function h(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const icon = name => window.CoinQuestIcons(name);

  function renderChoices(options) {
    return options.map(opt => '<button type="button" class="picker-cell ' + (opt.selected ? 'on' : '') + '" data-char-class="' + h(opt.classId) + '" data-char-gender="' + h(opt.gender) + '" aria-pressed="' + !!opt.selected + '">' +
      opt.artHtml + '<span class="pc-name"><span class="pc-gender" aria-hidden="true">' + (opt.gender === 'female' ? '♀' : '♂') + '</span>' + h(opt.label) + '<span class="cc-sr-only"> · ' + h(opt.genderLabel) + '</span></span>' +
      (opt.selected ? '<span class="pc-check" aria-hidden="true">✓</span>' : '') + '</button>').join('');
  }

  function renderPicker({ copy, pickerGender, options, langKey }) {
    return '<div class="picker-overlay creation-picker" lang="' + h(langKey) + '" data-picker-close>' +
      '<div class="picker" role="dialog" aria-modal="true" aria-labelledby="cc-picker-title" aria-describedby="cc-picker-sub" data-picker-dialog>' +
        '<div class="picker-head"><div><h2 class="picker-title" id="cc-picker-title" tabindex="-1">' + icon('swords') + h(copy.chooseHero) + '</h2>' +
        '<p class="picker-sub" id="cc-picker-sub">' + h(copy.chooseHeroSub) + '</p></div>' +
        '<button type="button" class="picker-close" data-picker-close aria-label="' + h(copy.closeHeroPicker) + '">×</button></div>' +
        '<div class="picker-filter" role="group" aria-label="' + h(copy.heroFilter) + '">' +
          [['all', copy.allHeroes], ['female', '♀ ' + copy.female], ['male', '♂ ' + copy.male]].map(([id, label]) =>
            '<button type="button" class="' + (pickerGender === id ? 'on' : '') + '" data-picker-gender="' + id + '" aria-pressed="' + (pickerGender === id) + '" aria-controls="cc-picker-grid">' + h(label) + '</button>').join('') +
        '</div><div class="picker-grid" id="cc-picker-grid">' + renderChoices(options) + '</div>' +
      '</div></div>';
  }

  function render({ copy, langKey, theme, userId, name, picked }) {
    const content = '<button class="cc-back" type="button" data-char-back aria-label="' + h(copy.signOut) + '" title="' + h(copy.signOut) + '">←</button>' +
      '<div class="auth-main"><form class="login-card cc-card" data-char-form aria-labelledby="auth-title" novalidate>' +
        '<div class="login-crest" aria-hidden="true">' + icon('toolbox') + '</div>' +
        '<h1 class="login-title" id="auth-title">' + h(copy.charTitle) + '</h1>' +
        '<p class="login-sub">' + h(copy.charSub) + '</p>' +
        '<div class="cc-uid">' + h(copy.yourUserId) + ' · <b>' + h(userId) + '</b></div>' +
        '<div class="cc-hero"><button type="button" class="cc-portrait ' + (picked ? 'has' : '') + '" data-char-open-picker aria-haspopup="dialog" aria-label="' + h(picked ? copy.changeHero + ': ' + picked.label : copy.tapToChoose) + '">' +
          (picked ? picked.portraitHtml : '<span class="cc-q"><span class="cc-q-mark" aria-hidden="true">?</span><span class="cc-q-lab">' + h(copy.tapToChoose) + '</span></span>') +
        '</button>' + (picked ? '<div class="cc-cls">' + h(picked.label) + '</div>' : '') + '</div>' +
        '<div class="login-field"><label for="cc-name">' + h(copy.charName) + '</label>' +
          '<input id="cc-name" type="text" maxlength="30" autocomplete="nickname" data-char-name value="' + h(name || '') + '" placeholder="' + h(copy.charNamePlaceholder) + '" aria-describedby="cc-error"></div>' +
        '<div class="login-err" id="cc-error" data-char-error role="alert" tabindex="-1" hidden></div>' +
        '<button type="submit" class="login-btn" ' + (picked ? '' : 'disabled') + '>' + icon('swords') + '<span>' + h(copy.charCreate) + '</span></button>' +
      '</form></div>';
    return window.PointyProfileLogin.renderFrame({ copy, langKey, theme, content, mode: 'character' });
  }

  window.PointyProfileCharacterCreate = { render, renderPicker, renderChoices };
})();

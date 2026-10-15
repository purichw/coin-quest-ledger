/* Static shell components, shared by every player route; no account/data ownership. */
(function () {
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const language = () => { try { return localStorage.getItem('lang') === 'en' ? 'en' : 'th'; } catch (_) { return document.documentElement.lang === 'en' ? 'en' : 'th'; } };
  class PlayerHeader extends HTMLElement {
    connectedCallback() {
      if (this.querySelector('.topbar')) return;
      const profile = this.hasAttribute('profile');
      const lang = language();
      if (this.hasAttribute('public')) {
        this.innerHTML = `<header class="info-header"><a class="info-brand" href="/about/"><img src="/assets/home-reference/crest.webp" width="46" height="46" alt=""><span>Coin Quest Ledger</span></a><nav aria-label="ข้อมูลเว็บไซต์"><a href="/about/">เกี่ยวกับเว็บ</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/" class="info-enter">เข้าใช้งาน ↗</a></nav></header>`;
        return;
      }
      this.innerHTML = `<header class="topbar"><div class="tb-inner">
        <div class="tb-left"><a class="cq-brand" href="/" data-mtab="home"><img src="/assets/home-reference/crest.webp" width="46" height="46" alt=""><span>Coin Quest Ledger</span></a></div>
        <nav class="cq-nav" aria-label="Main navigation"></nav>
        <div class="tb-right">${profile ? `<button class="theme-toggle" type="button" aria-label="${lang === 'en' ? 'Toggle theme' : 'สลับธีม'}" data-profile-theme>${window.CoinQuestIcons(document.documentElement.dataset.theme === 'dungeon' ? 'sun' : 'moon')}</button>` : ''}
          <div class="lang-toggle">${['th','en'].map(l=>`<button class="lang-btn ${l===lang?'lang-active':''}" type="button" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>
        </div></div></header>`;
      this.addEventListener('click', event => {
        const langButton = event.target.closest('.lang-btn');
        if (langButton) (profile ? window.setProfileLanguage : window.setLang)?.(langButton.dataset.lang);
        if (event.target.closest('[data-profile-theme]')) window.toggleProfileTheme?.();
      });
    }
  }
  class PlayerFooter extends HTMLElement {
    connectedCallback() { this.render(); }
    render() {
      const lang = language();
      if (this.dataset.language === lang) return;
      this.dataset.language = lang;
      const quote = lang === 'en' ? 'Every expense is another step in your adventure.' : 'ทุกการใช้จ่าย คืออีกก้าวของการผจญภัย';
      this.innerHTML = `<footer class="cq-footer"><p>${escape(quote)}</p><strong>Coin Quest Ledger</strong><nav class="cq-policy-links" aria-label="${lang === 'en' ? 'About and policies' : 'เกี่ยวกับเว็บและนโยบาย'}"><a href="/about/">${lang === 'en' ? 'About' : 'เกี่ยวกับเว็บ'}</a><a href="/privacy/">${lang === 'en' ? 'Privacy' : 'ความเป็นส่วนตัว'}</a><a href="/terms/">${lang === 'en' ? 'Terms' : 'ข้อกำหนด'}</a></nav></footer>`;
    }
  }
  customElements.define('cq-player-header', PlayerHeader);
  customElements.define('cq-footer', PlayerFooter);
  window.CoinQuestLayout = { refresh() {
    document.querySelectorAll('cq-footer').forEach(el=>el.render());
    document.querySelectorAll('.topbar .lang-btn').forEach(el=>el.classList.toggle('lang-active',el.dataset.lang===language()));
    const themeButton=document.querySelector('[data-profile-theme]');
    if(themeButton) themeButton.innerHTML=window.CoinQuestIcons(document.documentElement.dataset.theme==='dungeon'?'sun':'moon');
  } };
})();

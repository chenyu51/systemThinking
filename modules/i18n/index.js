class I18n {
  constructor(messages = window.CANVAS_I18N_MESSAGES || {}) {
    this.messages = messages;
    this.currentLang = this.getSavedLanguage() || this.getSystemLanguage();
  }

  getSavedLanguage() {
    return localStorage.getItem('canvas-language');
  }

  saveLanguage(lang) {
    localStorage.setItem('canvas-language', lang);
  }

  getSystemLanguage() {
    const lang = navigator.language || 'en-US';
    return this.messages[lang] ? lang : 'en-US';
  }

  setLanguage(lang) {
    if (!this.messages[lang]) return false;
    this.currentLang = lang;
    this.saveLanguage(lang);
    return true;
  }

  t(key, params = {}) {
    const template = this.messages[this.currentLang]?.[key] || key;
    return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);
  }

  getLanguages() {
    return Object.keys(this.messages);
  }

  applyTranslations(root = document) {
    document.documentElement.lang = this.currentLang;
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = this.t(element.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = this.t(element.dataset.i18nPlaceholder);
    });
    root.querySelector('title')?.replaceChildren(this.t('app.title'));
  }
}

const i18n = new I18n();
window.I18n = I18n;
window.i18n = i18n;

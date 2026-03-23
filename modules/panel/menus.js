const POPUP_SELECTORS = ['.export-menu', '.saved-menu', '.settings-menu', '.archetype-menu', '.canvas-context-menu'];
const POPUP_TRIGGER_SELECTORS = ['#btnExport', '#btnSaved', '#btnSettings', '#btnTemplate'];
let popupCloseHandlerBound = false;

function getCanvasInstance() {
  return window.canvas instanceof Canvas ? window.canvas : null;
}

function closeAllPopups() {
  POPUP_SELECTORS.forEach((selector) => document.querySelector(selector)?.remove());
}

function toggleMenu() {
  let menu = document.querySelector('.export-menu');
  if (menu) return menu.remove();
  menu = buildPopup('export-menu', 'position:absolute;top:60px;right:20px;background:white;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1000;min-width:150px;');
  [{ label: i18n.t('menu.exportPng'), action: exportPNG }, { label: i18n.t('menu.exportSvg'), action: exportSVG }, { label: i18n.t('menu.exportJson'), action: exportJSON }].forEach((option) => {
    const item = buildMenuItem(option.label, () => { option.action(); menu.remove(); });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
}

async function showSavedMenu() {
  let menu = document.querySelector('.saved-menu');
  if (menu) return menu.remove();
  menu = buildPopup('saved-menu', 'position:fixed;top:70px;right:180px;background:white;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:1000;width:320px;max-height:420px;overflow-y:auto;');
  menu.appendChild(buildTitle(i18n.t('menu.savedCanvases')));
  const snapshots = await store.getSavedSnapshots();
  if (!snapshots.length) menu.appendChild(buildEmptyRow(i18n.t('menu.emptySaved')));
  snapshots.forEach((snapshot) => menu.appendChild(buildSavedRow(snapshot, menu)));
  document.body.appendChild(menu);
}

function openSettings() {
  let settings = document.querySelector('.settings-menu');
  if (settings) return settings.remove();
  settings = buildPopup('settings-menu', 'position:fixed;top:70px;right:20px;background:white;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:1000;width:240px;padding:12px 0;');
  settings.appendChild(buildTitle(i18n.t('toolbar.settings'), 'padding:8px 16px;font-weight:600;color:#333;font-size:12px;text-transform:uppercase;letter-spacing:.5px;'));
  settings.appendChild(buildTitle('Language / 语言', 'padding:8px 16px;font-size:12px;color:#666;'));
  i18n.getLanguages().forEach((lang) => settings.appendChild(buildLanguageItem(lang, settings)));
  document.body.appendChild(settings);
}

async function showArchetypeMenu() {
  console.log('showArchetypeMenu');
  let menu = document.querySelector('.archetype-menu');
  if (menu) return menu.remove();
  menu = buildPopup('archetype-menu', 'position:fixed;top:70px;left:20px;background:white;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:1000;width:300px;max-height:600px;overflow-y:auto;');
  menu.appendChild(buildTitle(`📚 ${i18n.t('toolbar.templates')}`));
  const customTemplates = await store.getSavedTemplates();
  menu.appendChild(buildSectionTitle(i18n.t('menu.customTemplates')));
  if (!customTemplates.length) menu.appendChild(buildEmptyRow(i18n.t('menu.emptyTemplates'), true));
  customTemplates.forEach((template) => menu.appendChild(buildTemplateRow(template, menu)));
  menu.appendChild(buildSectionTitle(i18n.t('menu.builtInTemplates')));
  Object.entries(window.ARCHETYPES).forEach(([key]) => menu.appendChild(buildArchetypeRow(key, menu)));
  document.body.appendChild(menu);
}

function buildPopup(className, style) {
  const popup = document.createElement('div');
  popup.className = className;
  popup.style.cssText = style;
  popup.addEventListener('click', (event) => event.stopPropagation());
  return popup;
}

function buildTitle(text, style = 'padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#333;') {
  const title = document.createElement('div');
  title.style.cssText = style;
  title.textContent = text;
  return title;
}

function buildSectionTitle(text) {
  return buildTitle(text, 'padding:10px 16px;font-size:12px;color:#666;background:#fafafa;border-bottom:1px solid #f0f0f0;');
}

function buildEmptyRow(text, withBorder = false) {
  return buildTitle(text, `padding:12px 16px;color:#999;font-size:13px;${withBorder ? 'border-bottom:1px solid #f0f0f0;' : ''}`);
}

function buildMenuItem(text, onClick) {
  const item = document.createElement('div');
  item.style.cssText = 'padding:10px 16px;cursor:pointer;border-bottom:1px solid #f0f0f0;transition:all .2s ease;';
  item.textContent = text;
  item.onmouseover = () => { item.style.background = '#f5f5f5'; };
  item.onmouseout = () => { item.style.background = 'white'; };
  item.onclick = onClick;
  return item;
}

function buildSavedRow(snapshot, menu) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f5f5f5;';
  const loadButton = document.createElement('button');
  loadButton.type = 'button';
  loadButton.style.cssText = 'flex:1;background:transparent;color:#333;justify-content:flex-start;padding:8px 10px;';
  loadButton.textContent = `${snapshot.name} · ${new Date(snapshot.updated).toLocaleString()}`;
  loadButton.onclick = async () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    const data = await store.loadSnapshot(snapshot.id);
    if (!data) return;
    await store.save();
    resetCanvasUIState();
    syncCanvasFromStore();
    canvas.updateStatus(i18n.t('message.snapshotLoaded', { name: snapshot.name }));
    menu.remove();
  };
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.style.cssText = 'padding:8px 10px;background:#fff2f0;color:#c0392b;';
  deleteButton.textContent = i18n.t('menu.delete');
  deleteButton.onclick = async (event) => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    event.stopPropagation();
    if (!confirm(i18n.t('dialog.deleteSavedConfirm'))) return;
    await store.deleteSnapshot(snapshot.id);
    canvas.updateStatus(i18n.t('message.snapshotDeleted'));
    menu.remove();
    showSavedMenu();
  };
  row.append(loadButton, deleteButton);
  return row;
}

function buildLanguageItem(lang, settings) {
  const item = document.createElement('div');
  const active = i18n.currentLang === lang;
  item.style.cssText = `padding:8px 16px;cursor:pointer;transition:all .2s ease;border-left:3px solid ${active ? '#4A90E2' : 'transparent'};background:${active ? '#f0f5ff' : 'white'};font-weight:${active ? '500' : '400'};color:${active ? '#4A90E2' : '#333'};`;
  item.textContent = lang === 'zh-CN' ? '中文' : 'English';
  item.onmouseover = () => { if (!active) item.style.background = '#f9f9f9'; };
  item.onmouseout = () => { if (!active) item.style.background = 'white'; };
  item.onclick = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    if (!i18n.setLanguage(lang)) return;
    initializeEventListeners();
    i18n.applyTranslations();
    canvas.render();
    canvas.updateProperties();
    canvas.updateStatus(i18n.t('message.saved'));
    settings.remove();
  };
  return item;
}

function buildTemplateRow(template, menu) {
  const item = buildMenuItem(template.name, async () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    const data = await store.loadTemplate(template.id);
    if (!data) return;
    store.data.templateInfo = { name: template.name, description: template.data?.templateInfo?.description || '' };
    await store.save();
    resetCanvasUIState();
    canvas.currentTool = 'select';
    syncCanvasFromStore({ centerGraph: true });
    canvas.saveHistory();
    canvas.updateStatus(i18n.t('message.templateLoadedLocal', { name: template.name }));
    menu.remove();
  });
  item.innerHTML = `<div style="font-weight:500;color:#333;margin-bottom:4px;">${template.name}</div><div style="font-size:12px;color:#999;line-height:1.4;">${new Date(template.updated).toLocaleString()}</div>`;
  return item;
}

function buildArchetypeRow(key, menu) {
  const item = buildMenuItem(i18n.t(`template.${key}`), () => {
    loadArchetype(key);
    menu.remove();
  });
  item.innerHTML = `<div style="font-weight:500;color:#333;margin-bottom:4px;">${i18n.t(`template.${key}`)}</div><div style="font-size:12px;color:#999;line-height:1.4;">${i18n.t(`template.${key}Desc`)}</div>`;
  return item;
}

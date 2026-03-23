const POPUP_SELECTORS = ['.export-menu', '.saved-menu', '.settings-menu', '.archetype-menu', '.graph-info-menu', '.canvas-context-menu'];
const POPUP_TRIGGER_SELECTORS = ['#btnExport', '#btnSaved', '#btnSettings', '#btnTemplate', '#btnAI', '#btnGraphInfo'];
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
  settings.appendChild(buildTitle(i18n.t('settings.ai'), 'padding:12px 16px 8px;font-size:12px;color:#666;'));
  settings.appendChild(buildAISettingsSection());
  document.body.appendChild(settings);
}

async function showArchetypeMenu() {
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

function showGraphInfoMenu() {
  let menu = document.querySelector('.graph-info-menu');
  if (menu) return menu.remove();
  menu = buildPopup('graph-info-menu', 'position:fixed;top:70px;right:20px;background:white;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.16);z-index:1000;width:380px;max-height:calc(100vh - 100px);overflow-y:auto;');
  const labels = getGraphInfoLabels();
  menu.appendChild(buildTitle(labels.title));
  menu.appendChild(buildGraphInfoSummary(labels));
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

function buildAISettingsForm() {
  const container = document.createElement('div');
  container.style.cssText = 'padding:0 16px 8px;';

  const baseUrlLabel = document.createElement('div');
  baseUrlLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  baseUrlLabel.textContent = i18n.t('settings.apiBaseUrl');

  const baseUrlInput = document.createElement('input');
  baseUrlInput.type = 'text';
  baseUrlInput.placeholder = 'https://api.openai.com/v1/responses';
  baseUrlInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const apiKeyLabel = document.createElement('div');
  apiKeyLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  apiKeyLabel.textContent = i18n.t('settings.apiKey');

  const apiKeyInput = document.createElement('input');
  apiKeyInput.type = 'password';
  apiKeyInput.placeholder = 'sk-...';
  apiKeyInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = i18n.t('settings.saveConfig');
  saveButton.style.cssText = 'width:100%;justify-content:center;background:#667eea;color:#fff;';

  chrome.storage.local.get(['aiConfig'], (result) => {
    const aiConfig = result.aiConfig || {};
    baseUrlInput.value = aiConfig.baseUrl || '';
    apiKeyInput.value = aiConfig.apiKey || '';
  });

  saveButton.onclick = () => {
    const aiConfig = {
      baseUrl: baseUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim()
    };
    chrome.storage.local.set({ aiConfig }, () => {
      const canvas = getCanvasInstance();
      canvas?.updateStatus(i18n.t('message.aiConfigSaved'));
    });
  };

  container.append(baseUrlLabel, baseUrlInput, apiKeyLabel, apiKeyInput, saveButton);
  return container;
}

function getGraphInfoLabels() {
  return i18n.currentLang === 'zh-CN'
    ? {
        title: '图信息',
        basic: '基础信息',
        stats: '图统计',
        template: '模板来源',
        ai: 'AI 洞察',
        concepts: '系统思维要素',
        nodeCount: '节点',
        edgeCount: '连线',
        textCount: '文本',
        empty: '暂无',
        noTemplate: '当前图不是从模板加载',
        noAI: '当前图还没有 AI 信息',
        desc: '描述',
        patterns: '关键模式',
        leverage: '杠杆点'
      }
    : {
        title: 'Graph Info',
        basic: 'Basic Info',
        stats: 'Stats',
        template: 'Template Source',
        ai: 'AI Insights',
        concepts: 'System Concepts',
        nodeCount: 'Nodes',
        edgeCount: 'Edges',
        textCount: 'Texts',
        empty: 'None',
        noTemplate: 'This graph was not loaded from a template',
        noAI: 'No AI information available yet',
        desc: 'Description',
        patterns: 'Patterns',
        leverage: 'Leverage Points'
      };
}

function buildGraphInfoSummary(labels) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px;';
  wrapper.append(
    buildGraphInfoSection(labels.basic, [
      buildGraphInfoRow(i18n.t('properties.graphTitle'), store.data.name || labels.empty),
      buildGraphInfoRow(labels.desc, store.data.description || labels.empty)
    ]),
    buildGraphInfoSection(labels.stats, [
      buildGraphInfoRow(labels.nodeCount, String(store.getNodes().length)),
      buildGraphInfoRow(labels.edgeCount, String(store.getEdges().length)),
      buildGraphInfoRow(labels.textCount, String(store.getTexts().length))
    ]),
    buildGraphInfoSection(labels.template, store.data.templateInfo?.name
      ? [
          buildGraphInfoRow(i18n.t('properties.graphTitle'), store.data.templateInfo.name),
          buildGraphInfoRow(labels.desc, store.data.templateInfo.description || labels.empty)
        ]
      : [buildGraphInfoText(labels.noTemplate)]),
    buildGraphInfoSection(labels.ai, buildAIInfoRows(labels)),
    buildGraphInfoSection(labels.concepts, buildConceptRows(labels))
  );
  return wrapper;
}

function buildGraphInfoSection(title, rows) {
  const section = document.createElement('div');
  section.style.cssText = 'border:1px solid #e8edf3;border-radius:10px;background:#fafcff;padding:12px;';
  section.appendChild(buildTitle(title, 'padding:0 0 8px;border:none;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;'));
  rows.forEach((row, index) => {
    if (index > 0) row.style.marginTop = '8px';
    section.appendChild(row);
  });
  return section;
}

function buildGraphInfoRow(label, value) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding:8px 10px;background:white;border:1px solid #e8edf3;border-radius:8px;';
  row.innerHTML = `<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">${escapeGraphInfoHTML(label)}</div><div style="font-size:13px;line-height:1.6;color:#1f2937;">${escapeGraphInfoHTML(value)}</div>`;
  return row;
}

function buildGraphInfoText(text) {
  const row = document.createElement('div');
  row.style.cssText = 'padding:8px 10px;background:white;border:1px solid #e8edf3;border-radius:8px;font-size:13px;line-height:1.6;color:#64748b;';
  row.textContent = text;
  return row;
}

function buildAIInfoRows(labels) {
  const aiInfo = store.data.aiInfo || {};
  if (!aiInfo.description && !aiInfo.patterns?.length && !aiInfo.leveragePoints?.length) return [buildGraphInfoText(labels.noAI)];
  return [
    buildGraphInfoRow(labels.desc, aiInfo.description || labels.empty),
    buildGraphInfoRow(labels.patterns, (aiInfo.patterns || []).join('\n') || labels.empty),
    buildGraphInfoRow(labels.leverage, (aiInfo.leveragePoints || []).join('\n') || labels.empty)
  ];
}

function buildConceptRows(labels) {
  const concepts = store.data.aiInfo?.systemConcepts || {};
  const entries = [
    [i18n.t('properties.feedbackLoops'), concepts.feedbackLoops],
    [i18n.t('properties.stocks'), concepts.stocks],
    [i18n.t('properties.flows'), concepts.flows],
    [i18n.t('properties.variables'), concepts.variables],
    [i18n.t('properties.delays'), concepts.delays],
    [i18n.t('properties.boundaries'), concepts.boundaries],
    [i18n.t('properties.archetypes'), concepts.archetypes]
  ].filter(([, items]) => Array.isArray(items) && items.length);
  return entries.length
    ? entries.map(([label, items]) => buildGraphInfoRow(label, items.join('\n')))
    : [buildGraphInfoText(labels.empty)];
}

function escapeGraphInfoHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('\n', '<br>');
}

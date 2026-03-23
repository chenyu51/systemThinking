function showGraphInfoMenu() {
  let menu = document.querySelector('.graph-info-menu');
  if (menu) return menu.remove();
  menu = buildPopup('graph-info-menu', 'position:fixed;right:20px;bottom:40px;background:white;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.16);z-index:1000;width:420px;max-height:calc(100vh - 140px);overflow-y:auto;');
  menu.appendChild(buildTitle(i18n.t('properties.graphInfo')));
  menu.appendChild(buildGraphInfoPanel());
  document.body.appendChild(menu);
}

function buildGraphInfoPanel() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px;';
  wrapper.append(
    buildGraphInfoCard(i18n.t('properties.graphInfo'), buildGraphInfoBasics()),
    buildGraphInfoCard(i18n.currentLang === 'zh-CN' ? '图统计' : 'Stats', buildGraphInfoStats()),
    buildGraphInfoCard(i18n.t('properties.templateSource'), buildGraphInfoTemplate()),
    buildGraphInfoCard(i18n.t('properties.aiGenerated'), buildGraphInfoAI()),
    buildGraphInfoCard(i18n.t('properties.systemConcepts'), buildGraphInfoConcepts())
  );
  return wrapper;
}

function buildGraphInfoCard(title, sections) {
  const card = document.createElement('div');
  card.className = 'info-card';
  const titleNode = document.createElement('div');
  titleNode.className = 'info-title';
  titleNode.textContent = title;
  card.appendChild(titleNode);
  sections.forEach((section) => card.appendChild(section));
  return card;
}

function buildInfoSection(title, content) {
  const section = document.createElement('div');
  section.className = 'info-section';
  const titleNode = document.createElement('div');
  titleNode.className = 'info-section-title';
  titleNode.textContent = title;
  section.append(titleNode, content);
  return section;
}

function buildInfoBody(value) {
  const body = document.createElement('div');
  body.className = 'info-body';
  body.innerHTML = renderGraphInfoText(value || '-');
  return body;
}

function buildInfoList(items = []) {
  const list = document.createElement('div');
  list.className = 'info-list';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'info-empty';
    empty.textContent = '-';
    list.appendChild(empty);
    return list;
  }
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'info-list-item';
    row.innerHTML = renderGraphInfoText(item);
    list.appendChild(row);
  });
  return list;
}

function buildGraphInfoBasics() {
  return [
    buildInfoSection(i18n.t('properties.graphTitle'), buildInfoBody(store.data.name || '-')),
    buildInfoSection(i18n.t('properties.graphDescription'), buildInfoBody(store.data.description || '-'))
  ];
}

function buildGraphInfoStats() {
  const stats = store.getStats();
  const textCount = store.getTexts().length;
  return [buildInfoSection(i18n.currentLang === 'zh-CN' ? '数量概览' : 'Counts', buildInfoList([
    `${i18n.t('status.nodes', { count: stats.nodeCount })}`,
    `${i18n.t('status.edges', { count: stats.edgeCount })}`,
    `${i18n.currentLang === 'zh-CN' ? '文本' : 'Texts'}: ${textCount}`
  ]))];
}

function buildGraphInfoTemplate() {
  const info = store.data.templateInfo;
  if (!info?.name) return [buildInfoSection(i18n.t('properties.templateSource'), buildInfoBody(i18n.currentLang === 'zh-CN' ? '当前图不是从模板加载' : 'This graph was not loaded from a template'))];
  return [
    buildInfoSection(i18n.t('properties.graphTitle'), buildInfoBody(info.name)),
    buildInfoSection(i18n.t('properties.graphDescription'), buildInfoBody(info.description || i18n.t('template.noDescription')))
  ];
}

function buildGraphInfoAI() {
  const aiInfo = store.data.aiInfo || {};
  if (!aiInfo.description && !aiInfo.patterns?.length && !aiInfo.leveragePoints?.length) {
    return [buildInfoSection(i18n.t('properties.aiGenerated'), buildInfoBody(i18n.currentLang === 'zh-CN' ? '当前图还没有 AI 信息' : 'No AI information available yet'))];
  }
  return [
    buildInfoSection(i18n.t('properties.aiGenerated'), buildInfoBody(aiInfo.description || '-')),
    buildInfoSection(i18n.t('properties.aiPatterns'), buildInfoList(aiInfo.patterns)),
    buildInfoSection(i18n.t('properties.aiLeveragePoints'), buildInfoList(aiInfo.leveragePoints))
  ];
}

function buildGraphInfoConcepts() {
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
  if (!entries.length) return [buildInfoSection(i18n.t('properties.systemConcepts'), buildInfoBody('-'))];
  return entries.map(([title, items]) => buildInfoSection(title, buildInfoList(items)));
}

function renderGraphInfoText(value) {
  const canvas = getCanvasInstance();
  if (canvas?.renderEmphasisText) return canvas.renderEmphasisText(value);
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('\n', '<br>');
}

window.showGraphInfoMenu = showGraphInfoMenu;

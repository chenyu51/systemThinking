let panelEventsInitialized = false;

function getCanvasInstance() {
  return window.canvas instanceof Canvas ? window.canvas : null;
}

function initializeEventListeners() {
  if (panelEventsInitialized) {
    return;
  }
  panelEventsInitialized = true;
  i18n.applyTranslations();
  document.getElementById('btnFile').textContent = `${i18n.currentLang === 'zh-CN' ? '文件' : 'File'} ▼`;
  document.getElementById('btnView').textContent = `${i18n.currentLang === 'zh-CN' ? '查看' : 'View'} ▼`;
  document.getElementById('btnEdit').textContent = `${i18n.currentLang === 'zh-CN' ? '编辑' : 'Edit'} ▼`;
  document.getElementById('btnAI').textContent = i18n.t('toolbar.ai');
  document.getElementById('btnSync').title = i18n.currentLang === 'zh-CN' ? '同步数据' : 'Sync data';
  document.getElementById('btnSync').textContent = '⇅';
  document.getElementById('btnGraphInfo').title = i18n.t('properties.graphInfo');
  document.getElementById('btnGraphInfo').textContent = 'ⓘ';
  document.getElementById('btnSettings').textContent = i18n.t('toolbar.settings');
  document.getElementById('btnHideLeftPanel').title = i18n.currentLang === 'zh-CN' ? '隐藏左栏' : 'Hide left panel';
  document.getElementById('btnHideRightPanel').title = i18n.currentLang === 'zh-CN' ? '隐藏右栏' : 'Hide right panel';
  document.getElementById('btnShowLeftPanel').title = i18n.currentLang === 'zh-CN' ? '展开左栏' : 'Show left panel';
  document.getElementById('btnShowRightPanel').title = i18n.currentLang === 'zh-CN' ? '展开右栏' : 'Show right panel';
  document.getElementById('btnFile').onclick = (event) => { event.stopPropagation(); showFileMenu(); };
  document.getElementById('btnView').onclick = (event) => { event.stopPropagation(); showViewMenu(); };
  document.getElementById('btnEdit').onclick = (event) => { event.stopPropagation(); showEditMenu(); };
  document.getElementById('btnAI').onclick = (event) => { event.stopPropagation(); showAIAssistant(); };
  document.getElementById('btnSync').onclick = (event) => { event.stopPropagation(); showSyncMenu(); };
  document.getElementById('btnGraphInfo').onclick = (event) => { event.stopPropagation(); showGraphInfoMenu(); };
  document.getElementById('btnSettings').onclick = (event) => { event.stopPropagation(); openSettings(); };
  document.getElementById('btnHideLeftPanel').onclick = () => togglePanel('left');
  document.getElementById('btnHideRightPanel').onclick = () => togglePanel('right');
  document.getElementById('btnShowLeftPanel').onclick = () => togglePanel('left');
  document.getElementById('btnShowRightPanel').onclick = () => togglePanel('right');
  document.querySelectorAll('.tool-item[data-tool]').forEach((item) => {
    item.onclick = () => {
      const canvas = getCanvasInstance();
      if (!canvas) return;
      canvas.handleToolClick(item);
    };
  });
  document.querySelectorAll('.tool-item[data-type]').forEach((item) => {
    item.onclick = () => {
      const canvas = getCanvasInstance();
      if (!canvas) return;
      canvas.handleNodeTypeClick(item);
    };
  });
  if (!popupCloseHandlerBound) {
    document.addEventListener('click', (event) => {
      const clickedPopup = event.target.closest(POPUP_SELECTORS.join(', '));
      const clickedTrigger = event.target.closest(POPUP_TRIGGER_SELECTORS.join(', '));
      if (!clickedPopup && !clickedTrigger) closeAllPopups();
    });
    popupCloseHandlerBound = true;
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isSaveShortcut = isMac ? (event.metaKey && event.key === 's') : (event.ctrlKey && event.key === 's');
    
    if (isSaveShortcut) {
      event.preventDefault();
      saveCanvas();
    }
  });
}

Object.assign(window, {
  newCanvas,
  openCanvas,
  saveCanvas,
  saveAsTemplate,
  relayoutCanvas,
  showSavedMenu,
  showFileMenu,
  showViewMenu,
  showEditMenu,
  toggleMenu,
  undo,
  redo,
  openSettings,
  showArchetypeMenu,
  showGraphInfoMenu,
  loadArchetype,
  initializeEventListeners
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.initializeCanvasApp();
  });
} else {
  window.initializeCanvasApp();
}

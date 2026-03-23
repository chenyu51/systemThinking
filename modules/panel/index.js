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
  document.getElementById('btnTemplate').textContent = i18n.t('toolbar.templates');
  document.getElementById('btnNew').textContent = i18n.t('toolbar.new');
  document.getElementById('btnOpen').textContent = i18n.t('toolbar.open');
  document.getElementById('btnSave').textContent = i18n.t('toolbar.save');
  document.getElementById('btnSaved').textContent = i18n.t('toolbar.saved');
  document.getElementById('btnSaveTemplate').textContent = i18n.t('toolbar.saveTemplate');
  document.getElementById('btnAI').textContent = i18n.t('toolbar.ai');
  document.getElementById('btnGraphInfo').textContent = i18n.t('properties.graphInfo');
  document.getElementById('btnLayout').textContent = i18n.t('toolbar.layout');
  document.getElementById('btnToggleLeft').textContent = i18n.t('toolbar.leftPanel');
  document.getElementById('btnToggleRight').textContent = i18n.t('toolbar.rightPanel');
  document.getElementById('btnExport').textContent = `${i18n.t('toolbar.export')} ▼`;
  document.getElementById('btnUndo').textContent = i18n.t('toolbar.undo');
  document.getElementById('btnRedo').textContent = i18n.t('toolbar.redo');
  document.getElementById('btnSettings').textContent = i18n.t('toolbar.settings');
  document.getElementById('btnTemplate').onclick = (event) => { event.stopPropagation(); showArchetypeMenu(); };
  document.getElementById('btnNew').onclick = newCanvas;
  document.getElementById('btnOpen').onclick = openCanvas;
  document.getElementById('btnSave').onclick = saveCanvas;
  document.getElementById('btnSaved').onclick = (event) => { event.stopPropagation(); showSavedMenu(); };
  document.getElementById('btnSaveTemplate').onclick = saveAsTemplate;
  document.getElementById('btnAI').onclick = (event) => { event.stopPropagation(); showAIAssistant(); };
  document.getElementById('btnGraphInfo').onclick = (event) => { event.stopPropagation(); showGraphInfoMenu(); };
  document.getElementById('btnLayout').onclick = relayoutCanvas;
  document.getElementById('btnToggleLeft').onclick = () => togglePanel('left');
  document.getElementById('btnToggleRight').onclick = () => togglePanel('right');
  document.getElementById('btnExport').onclick = (event) => { event.stopPropagation(); toggleMenu(); };
  document.getElementById('btnUndo').onclick = undo;
  document.getElementById('btnRedo').onclick = redo;
  document.getElementById('btnSettings').onclick = (event) => { event.stopPropagation(); openSettings(); };
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
}

Object.assign(window, {
  newCanvas,
  openCanvas,
  saveCanvas,
  saveAsTemplate,
  relayoutCanvas,
  showSavedMenu,
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

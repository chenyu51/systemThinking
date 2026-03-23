function getCanvasInstance() {
  return window.canvas instanceof Canvas ? window.canvas : null;
}

function resetCanvasUIState() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  canvas.selectedNodeId = null;
  canvas.selectedEdgeId = null;
  canvas.selectedTextId = null;
}

function syncCanvasFromStore({ centerGraph = false } = {}) {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  canvas.currentTool = store.data.canvas.currentTool || 'select';
  canvas.currentNodeType = store.data.canvas.currentNodeType || 'variable';
  canvas.syncToolSelection();
  canvas.syncNodeTypeSelection();
  if (centerGraph) {
    canvas.centerGraph();
  } else {
    canvas.render();
    canvas.syncViewport();
  }
  canvas.render();
  canvas.updateProperties();
  applyPanelVisibility();
}

async function newCanvas() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  if (!confirm(i18n.t('dialog.newCanvasConfirm'))) return;
  store.clear();
  await store.save();
  resetCanvasUIState();
  syncCanvasFromStore();
  canvas.saveHistory();
  canvas.updateStatus(i18n.t('message.newCanvas'));
}

function openCanvas() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (!store.importJSON(loadEvent.target.result)) return alert(i18n.t('dialog.openError'));
      store.save();
      resetCanvasUIState();
      syncCanvasFromStore();
      canvas.persistCanvasState();
      canvas.updateStatus(i18n.t('message.canvasOpened'));
    };
    reader.readAsText(file);
  };
  input.click();
}

async function saveCanvas() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const defaultName = store.data.name || '未命名画布';
  const name = window.prompt(i18n.t('dialog.saveNamePrompt'), defaultName);
  if (!name) return;
  store.data.name = name.trim() || defaultName;
  Object.assign(store.data.canvas, { zoom: canvas.zoom, offsetX: canvas.offsetX, offsetY: canvas.offsetY });
  await store.save();
  await store.saveSnapshot(store.data.name);
  canvas.updateStatus(i18n.t('message.snapshotSaved', { name: store.data.name }));
}

async function saveAsTemplate() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const defaultName = store.data.name || '未命名模板';
  const name = window.prompt(i18n.t('dialog.templateNamePrompt'), defaultName);
  if (!name) return;
  Object.assign(store.data.canvas, { zoom: canvas.zoom, offsetX: canvas.offsetX, offsetY: canvas.offsetY });
  await store.save();
  const template = await store.saveTemplate(name.trim() || defaultName);
  canvas.updateStatus(i18n.t('message.templateSavedLocal', { name: template.name }));
}

function exportPNG() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const svg = document.getElementById('canvas');
  const svgData = new XMLSerializer().serializeToString(svg);
  const bitmap = document.createElement('canvas');
  const img = new Image();
  img.onload = () => {
    bitmap.width = img.width;
    bitmap.height = img.height;
    const ctx = bitmap.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, bitmap.width, bitmap.height);
    ctx.drawImage(img, 0, 0);
    const link = document.createElement('a');
    link.href = bitmap.toDataURL('image/png');
    link.download = `canvas-${Date.now()}.png`;
    link.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  canvas.updateStatus(i18n.t('message.pngExported'));
}

function exportSVG() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const svgData = new XMLSerializer().serializeToString(document.getElementById('canvas'));
  const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.svg`;
  link.click();
  URL.revokeObjectURL(url);
  canvas.updateStatus(i18n.t('message.svgExported'));
}

function exportJSON() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const url = URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  canvas.updateStatus(i18n.t('message.jsonExported'));
}

function undo() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  canvas.undo();
  canvas.updateStatus(i18n.t('message.undone'));
}

function redo() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  canvas.redo();
  canvas.updateStatus(i18n.t('message.redone'));
}

function relayoutCanvas() {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  canvas.relayoutGraph();
  canvas.saveHistory();
  canvas.persistCanvasState();
  canvas.updateProperties();
  canvas.updateStatus(i18n.t('message.layoutApplied'));
}

function applyPanelVisibility() {
  const leftHidden = !!store.data.canvas.leftPanelHidden;
  const rightHidden = !!store.data.canvas.rightPanelHidden;
  document.querySelector('.sidebar')?.classList.toggle('is-hidden', leftHidden);
  document.querySelector('.properties-panel')?.classList.toggle('is-hidden', rightHidden);
  document.getElementById('btnShowLeftPanel')?.classList.toggle('is-hidden', !leftHidden);
  document.getElementById('btnShowRightPanel')?.classList.toggle('is-hidden', !rightHidden);
}

function togglePanel(side) {
  const key = side === 'left' ? 'leftPanelHidden' : 'rightPanelHidden';
  store.data.canvas[key] = !store.data.canvas[key];
  applyPanelVisibility();
  store.save();
}

function loadArchetype(archetypeKey) {
  const canvas = getCanvasInstance();
  if (!canvas) return;
  const archetype = window.ARCHETYPES[archetypeKey];
  if (!archetype) return alert(i18n.t('dialog.templateMissing'));
  const archetypeName = window.getArchetypeDisplayName?.(archetypeKey) || archetype.name;
  const archetypeDescription = window.getArchetypeDisplayDescription?.(archetypeKey) || archetype.description;
  if ((store.getNodes().length > 0 || store.getEdges().length > 0) && !confirm(i18n.t('dialog.templateReplaceConfirm'))) return;
  store.clear();
  store.data.templateInfo = { key: archetypeKey, name: archetypeName, description: archetypeDescription };
  store.data.aiInfo = {
    ...store.createDefaultAIInfo(),
    description: archetypeDescription,
    patterns: Array.isArray(archetype.patterns) ? [...archetype.patterns] : [],
    leveragePoints: Array.isArray(archetype.leveragePoints) ? [...archetype.leveragePoints] : [],
    systemConcepts: JSON.parse(JSON.stringify(archetype.systemConcepts || store.createDefaultAIInfo().systemConcepts))
  };
  const nodeIdMap = {};
  archetype.nodes.forEach((nodeData, index) => {
    const node = new CanvasNode({
      label: nodeData.label,
      x: nodeData.x,
      y: nodeData.y,
      color: nodeData.color,
      type: nodeData.type || 'variable',
      shape: nodeData.shape || 'rectangle',
      description: nodeData.description || ''
    });
    nodeIdMap[index] = node.id;
    store.addNode(node.toJSON());
  });
  archetype.edges.forEach((edgeData) => {
    store.addEdge(new CanvasEdge({ source: nodeIdMap[edgeData.source], target: nodeIdMap[edgeData.target], type: edgeData.type, label: edgeData.label || '' }).toJSON());
  });
  resetCanvasUIState();
  canvas.currentTool = 'select';
  canvas.currentNodeType = 'variable';
  canvas.syncToolSelection();
  canvas.syncNodeTypeSelection();
  canvas.centerGraph();
  canvas.render();
  canvas.updateProperties();
  canvas.saveHistory();
  canvas.persistCanvasState();
  canvas.updateStatus(i18n.t('message.templateLoaded', { name: archetypeName }));
}

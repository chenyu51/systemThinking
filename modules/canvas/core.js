class Canvas {
  constructor() {
    this.baseViewWidth = 1600;
    this.baseViewHeight = 900;
    this.svgElement = document.getElementById('canvas');
    this.currentTool = 'select';
    this.currentNodeType = 'variable';
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.selectedTextId = null;
    this.isDrawingEdge = false;
    this.edgeStartNode = null;
    this.edgeHoverTargetId = null;
    this.tempLine = null;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.history = [];
    this.historyIndex = -1;
    this.isCanvasDragging = false;
    this.canvasDragStartX = 0;
    this.canvasDragStartY = 0;
    this.canvasDragStartOffsetX = 0;
    this.canvasDragStartOffsetY = 0;
    this.init();
  }

  async init() {
    this.svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svgElement.setAttribute('viewBox', `0 0 ${this.baseViewWidth} ${this.baseViewHeight}`);
    this.svgElement.appendChild(CanvasEdge.createArrowMarkerDefs());
    await store.load();
    this.zoom = store.data.canvas.zoom || 1;
    this.offsetX = store.data.canvas.offsetX || 0;
    this.offsetY = store.data.canvas.offsetY || 0;
    this.currentTool = store.data.canvas.currentTool || 'select';
    this.currentNodeType = store.data.canvas.currentNodeType || 'variable';
    this.render();
    this.syncViewport();
    this.syncToolSelection();
    this.syncNodeTypeSelection();
    i18n.applyTranslations();
    this.updateProperties();
    this.updateCanvasCursor();
    this.bindEvents();
    this.saveHistory();
  }
}

window.Canvas = Canvas;

let canvas;
let canvasAppBootstrapped = false;

window.initializeCanvasApp = function initializeCanvasApp() {
  if (canvasAppBootstrapped || window.canvas instanceof Canvas) {
    return;
  }
  canvasAppBootstrapped = true;
  canvas = new Canvas();
  window.canvas = canvas;
  if (typeof initializeEventListeners === 'function') {
    initializeEventListeners();
  }
};

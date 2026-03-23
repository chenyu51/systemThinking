Object.assign(Canvas.prototype, {
  addNode(x, y) {
    const defaults = this.getNodeTypeDefaults(this.currentNodeType);
    const node = new CanvasNode({ x, y, type: this.currentNodeType, label: defaults.label, color: defaults.color, shape: defaults.shape });
    store.addNode(node.toJSON());
    this.selectNode(node.id);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.nodeAdded'));
  },

  deleteNode(nodeId) {
    store.deleteNode(nodeId);
    this.selectedNodeId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
  },

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.selectedEdgeId = null;
    this.selectedTextId = null;
    this.render();
    this.updateProperties();
  },

  addText(x, y) {
    const text = new CanvasText({ x, y, text: '新文本', color: '#333333', fontSize: 24 });
    store.addText(text.toJSON());
    this.selectText(text.id);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.textAdded'));
  },

  selectText(textId) {
    this.selectedTextId = textId;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.render();
    this.updateProperties();
  },

  deleteText(textId) {
    store.deleteText(textId);
    this.selectedTextId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
  },

  addEdge(sourceId, targetId) {
    if (sourceId === targetId) return;
    const edge = new CanvasEdge({ source: sourceId, target: targetId, type: 'neutral' });
    store.addEdge(edge.toJSON());
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.edgeAdded'));
  },

  deleteEdge(edgeId) {
    store.deleteEdge(edgeId);
    this.selectedEdgeId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
  },

  selectEdge(edgeId) {
    this.selectedEdgeId = edgeId;
    this.selectedNodeId = null;
    this.selectedTextId = null;
    this.render();
    this.updateProperties();
  },

  clearCanvas() {
    if (!confirm(i18n.t('dialog.clearCanvasConfirm'))) return;
    store.clear();
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.selectedTextId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.canvasCleared'));
  },

  startDrawingEdge(nodeId, side = 'right') {
    if (this.currentTool !== 'edge') return;
    this.isDrawingEdge = true;
    this.edgeHoverTargetId = null;
    const node = store.getNodes().find((item) => item.id === nodeId);
    if (!node) return;
    const position = new CanvasNode(node).getPortPosition(side);
    this.edgeStartNode = { id: nodeId, side, x: position.x, y: position.y };
  },

  endDrawingEdge(targetId) {
    if (!this.isDrawingEdge || !this.edgeStartNode) return;
    if (this.edgeStartNode.id !== targetId) this.addEdge(this.edgeStartNode.id, targetId);
    this.cancelEdgeDrawing();
  },

  cancelEdgeDrawing() {
    this.isDrawingEdge = false;
    this.edgeStartNode = null;
    this.edgeHoverTargetId = null;
    this.tempLine?.remove();
    this.tempLine = null;
    this.render();
  },

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex -= 1;
      this.restoreFromHistory(this.historyIndex);
    }
  },

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex += 1;
      this.restoreFromHistory(this.historyIndex);
    }
  },

  saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(store.data)));
    this.historyIndex += 1;
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex -= 1;
    }
  },

  restoreFromHistory(index) {
    if (index < 0 || index >= this.history.length) return;
    store.data = JSON.parse(JSON.stringify(this.history[index]));
    this.syncToolSelection();
    this.currentNodeType = store.data.canvas.currentNodeType || 'variable';
    this.syncNodeTypeSelection();
    this.persistCanvasState();
    this.render();
  }
});

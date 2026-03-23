Object.assign(Canvas.prototype, {
  render() {
    const defs = this.svgElement.querySelector('defs');
    this.svgElement.innerHTML = '';
    if (defs) this.svgElement.appendChild(defs);
    this.renderEdges();
    this.renderNodes();
    this.renderTexts();
    const stats = store.getStats();
    document.getElementById('nodeCount').textContent = i18n.t('status.nodes', { count: stats.nodeCount });
    document.getElementById('edgeCount').textContent = i18n.t('status.edges', { count: stats.edgeCount });
  },

  renderEdges() {
    const edges = store.getEdges();
    const nodes = store.getNodes();
    const edgeMultiplicity = new Map();
    edges.forEach((edgeData, index) => {
      const key = [edgeData.source, edgeData.target].sort().join('::');
      if (!edgeMultiplicity.has(key)) edgeMultiplicity.set(key, []);
      edgeMultiplicity.get(key).push(index);
    });
    edges.forEach((edgeData, index) => {
      const sourceNode = nodes.find((node) => node.id === edgeData.source);
      const targetNode = nodes.find((node) => node.id === edgeData.target);
      if (!sourceNode || !targetNode) return;
      const pairKey = [edgeData.source, edgeData.target].sort().join('::');
      const pairEdges = edgeMultiplicity.get(pairKey) || [];
      const pairNodeIds = [edgeData.source, edgeData.target].sort();
      const svgEdge = new CanvasEdge(edgeData).createSVGElement(new CanvasNode(sourceNode), new CanvasNode(targetNode), pairEdges.indexOf(index), pairEdges.length, edgeData.source === pairNodeIds[0] ? 1 : -1);
      if (this.selectedEdgeId === edgeData.id) svgEdge.querySelector('line, path').setAttribute('stroke-width', '4');
      svgEdge.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectEdge(edgeData.id);
      });
      this.svgElement.appendChild(svgEdge);
    });
  },

  renderNodes() {
    store.getNodes().forEach((nodeData) => {
      const svgNode = new CanvasNode(nodeData).createSVGElement({ showPorts: this.currentTool === 'edge' || this.isDrawingEdge });
      if (this.selectedNodeId === nodeData.id) {
        svgNode.querySelector('.node-shape').setAttribute('stroke', '#FFD700');
        svgNode.querySelector('.node-shape').setAttribute('stroke-width', '3');
      }
      this.makeDraggable(svgNode, nodeData.id);
      if (this.currentTool === 'select') {
        svgNode.addEventListener('click', (event) => {
          event.stopPropagation();
          this.selectNode(nodeData.id);
        });
      }
      if (this.currentTool === 'edge') this.bindNodeHover(svgNode, nodeData.id);
      svgNode.querySelectorAll('.link-port').forEach((port) => {
        port.addEventListener('mousedown', (event) => {
          event.stopPropagation();
          this.startDrawingEdge(nodeData.id, port.dataset.side);
        });
      });
      this.svgElement.appendChild(svgNode);
    });
  },

  bindNodeHover(svgNode, nodeId) {
    svgNode.addEventListener('mouseenter', () => {
      if (this.isDrawingEdge && this.edgeStartNode?.id !== nodeId) {
        this.edgeHoverTargetId = nodeId;
        svgNode.style.cursor = 'crosshair';
      }
    });
    svgNode.addEventListener('mouseleave', () => {
      if (this.edgeHoverTargetId === nodeId) this.edgeHoverTargetId = null;
    });
  },

  renderTexts() {
    store.getTexts().forEach((textData) => {
      const svgText = new CanvasText(textData).createSVGElement(this.selectedTextId === textData.id);
      this.makeTextDraggable(svgText, textData.id);
      svgText.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectText(textData.id);
      });
      this.svgElement.appendChild(svgText);
    });
  },

  makeDraggable(element, nodeId) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let isDraggingSaved = false;
    element.addEventListener('mousedown', (event) => {
      if (this.currentTool !== 'select') return;
      this.selectNode(nodeId);
      isDragging = true;
      isDraggingSaved = false;
      startX = event.clientX;
      startY = event.clientY;
    });
    document.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const node = store.getNodes().find((item) => item.id === nodeId);
      if (!node) return;
      node.x += event.clientX - startX;
      node.y += event.clientY - startY;
      store.updateNode(nodeId, { x: node.x, y: node.y });
      this.render();
      isDraggingSaved = true;
      startX = event.clientX;
      startY = event.clientY;
    });
    document.addEventListener('mouseup', () => {
      if (isDragging && isDraggingSaved) this.persistCanvasState();
      isDragging = false;
      if (this.selectedNodeId === nodeId) this.saveHistory();
    });
  },

  makeTextDraggable(element, textId) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let isDraggingSaved = false;
    element.addEventListener('mousedown', (event) => {
      if (this.currentTool !== 'select') return;
      this.selectText(textId);
      isDragging = true;
      isDraggingSaved = false;
      startX = event.clientX;
      startY = event.clientY;
      event.stopPropagation();
    });
    document.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const rect = this.svgElement.getBoundingClientRect();
      const viewWidth = this.baseViewWidth / this.zoom;
      const viewHeight = this.baseViewHeight / this.zoom;
      const dx = ((event.clientX - startX) / rect.width) * viewWidth;
      const dy = ((event.clientY - startY) / rect.height) * viewHeight;
      const text = store.getTexts().find((item) => item.id === textId);
      if (!text) return;
      text.x += dx;
      text.y += dy;
      store.updateText(textId, { x: text.x, y: text.y });
      this.render();
      isDraggingSaved = true;
      startX = event.clientX;
      startY = event.clientY;
    });
    document.addEventListener('mouseup', () => {
      if (isDragging && isDraggingSaved) this.persistCanvasState();
      isDragging = false;
      if (this.selectedTextId === textId) this.saveHistory();
    });
  }
});

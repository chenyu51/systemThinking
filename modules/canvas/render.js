Object.assign(Canvas.prototype, {
  isClickSuppressed() {
    return Date.now() < this.suppressClickUntil;
  },

  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  },

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
    const edgeMultiplicity = this.getEdgeMultiplicity(edges);
    edges.forEach((edgeData, index) => {
      const svgEdge = this.createEdgeElement(edgeData, index, nodes, edgeMultiplicity);
      if (svgEdge) this.svgElement.appendChild(svgEdge);
    });
  },

  getEdgeMultiplicity(edges) {
    const edgeMultiplicity = new Map();
    edges.forEach((edgeData, index) => {
      const key = [edgeData.source, edgeData.target].sort().join('::');
      if (!edgeMultiplicity.has(key)) edgeMultiplicity.set(key, []);
      edgeMultiplicity.get(key).push(index);
    });
    return edgeMultiplicity;
  },

  createEdgeElement(edgeData, index, nodes, edgeMultiplicity) {
    const sourceNode = nodes.find((node) => node.id === edgeData.source);
    const targetNode = nodes.find((node) => node.id === edgeData.target);
    if (!sourceNode || !targetNode) return null;
    const pairKey = [edgeData.source, edgeData.target].sort().join('::');
    const pairEdges = edgeMultiplicity.get(pairKey) || [];
    const pairNodeIds = [edgeData.source, edgeData.target].sort();
    const svgEdge = new CanvasEdge(edgeData).createSVGElement(
      new CanvasNode(sourceNode),
      new CanvasNode(targetNode),
      pairEdges.indexOf(index),
      pairEdges.length,
      edgeData.source === pairNodeIds[0] ? 1 : -1
    );
    if (this.selectedEdgeId === edgeData.id) svgEdge.querySelector('line, path').setAttribute('stroke-width', '4');
    return svgEdge;
  },

  updateDraggedNode(nodeId) {
    const nodeData = store.getNodes().find((item) => item.id === nodeId);
    const nodeElement = this.svgElement.querySelector(`.node[data-id="${nodeId}"]`);
    if (!nodeData || !nodeElement) return;
    const node = new CanvasNode(nodeData);
    nodeElement.setAttribute('transform', `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`);
    this.updateEdgesForNode(nodeId);
  },

  updateDraggedText(textId) {
    const textData = store.getTexts().find((item) => item.id === textId);
    const textElement = this.svgElement.querySelector(`.canvas-text[data-id="${textId}"]`);
    if (!textData || !textElement) return;
    textElement.setAttribute('transform', `translate(${textData.x}, ${textData.y})`);
  },

  updateEdgesForNode(nodeId) {
    const edges = store.getEdges();
    const nodes = store.getNodes();
    const edgeMultiplicity = this.getEdgeMultiplicity(edges);
    edges.forEach((edgeData, index) => {
      if (edgeData.source !== nodeId && edgeData.target !== nodeId) return;
      const currentEdge = this.svgElement.querySelector(`.edge[data-id="${edgeData.id}"]`);
      const nextEdge = this.createEdgeElement(edgeData, index, nodes, edgeMultiplicity);
      if (!currentEdge || !nextEdge) return;
      currentEdge.replaceWith(nextEdge);
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
    element.addEventListener('mousedown', (event) => {
      if (this.currentTool !== 'select') return;
      event.stopPropagation();
      event.preventDefault();
      document.body.style.userSelect = 'none';
      this.selectNode(nodeId);
      this.dragState = {
        type: 'node',
        id: nodeId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
    });
  },

  makeTextDraggable(element, textId) {
    element.addEventListener('mousedown', (event) => {
      if (this.currentTool !== 'select') return;
      event.preventDefault();
      document.body.style.userSelect = 'none';
      this.selectText(textId);
      this.dragState = {
        type: 'text',
        id: textId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
      event.stopPropagation();
    });
  }
});

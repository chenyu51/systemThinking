Object.assign(Canvas.prototype, {
  bindEvents() {
    this.svgElement.addEventListener('click', (event) => this.handleCanvasClick(event));
    this.svgElement.addEventListener('contextmenu', (event) => this.handleCanvasContextMenu(event));
    this.svgElement.addEventListener('wheel', (event) => this.handleCanvasWheel(event), { passive: false });
    this.svgElement.addEventListener('mousedown', (event) => this.handleCanvasMouseDown(event));
    this.svgElement.addEventListener('mousemove', (event) => this.handleCanvasMouseMove(event));
    document.addEventListener('mouseup', () => this.handlePointerUp());
    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.hideContextMenu();
    });
  },

  handleToolClick(item) {
    this.cancelEdgeDrawing();
    this.currentTool = item.dataset.tool;
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.selectedTextId = null;
    this.syncToolSelection();
    this.render();
    this.updateProperties();
    this.updateCanvasCursor();
    this.persistCanvasState();
  },

  handleNodeTypeClick(item) {
    this.currentNodeType = item.dataset.type;
    this.currentTool = 'node';
    this.syncNodeTypeSelection();
    this.syncToolSelection();
    this.updateProperties();
    this.persistCanvasState();
  },

  handleCanvasClick(event) {
    this.hideContextMenu();
    if (event.target === this.svgElement && this.currentTool === 'node') {
      const { x, y } = this.screenToWorld(event.clientX, event.clientY);
      this.addNode(x, y);
      return;
    }
    if (event.target === this.svgElement && this.currentTool === 'text') {
      const { x, y } = this.screenToWorld(event.clientX, event.clientY);
      this.addText(x, y);
      return;
    }
    if (event.target === this.svgElement) {
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.selectedTextId = null;
      this.render();
      this.updateProperties();
    }
  },

  handleCanvasContextMenu(event) {
    event.preventDefault();
    this.showContextMenu(event.clientX, event.clientY);
  },

  handleCanvasWheel(event) {
    event.preventDefault();
    const rect = this.svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const { x: worldX, y: worldY } = this.screenToWorld(event.clientX, event.clientY);
    const zoomDelta = event.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(3, Math.max(0.2, this.zoom * zoomDelta));
    if (nextZoom === this.zoom) return;
    this.zoom = nextZoom;
    const viewWidth = this.baseViewWidth / this.zoom;
    const viewHeight = this.baseViewHeight / this.zoom;
    this.offsetX = worldX - (mouseX / rect.width) * viewWidth;
    this.offsetY = worldY - (mouseY / rect.height) * viewHeight;
    this.syncViewport();
    this.persistCanvasState();
  },

  handleKeyDown(event) {
    if (this.isEditingTextInput(event.target)) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedNodeId) this.deleteNode(this.selectedNodeId);
      if (this.selectedEdgeId) this.deleteEdge(this.selectedEdgeId);
      if (this.selectedTextId) this.deleteText(this.selectedTextId);
    }
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'z') {
      event.preventDefault();
      this.undo();
    }
    if (event.key === 'y') {
      event.preventDefault();
      this.redo();
    }
    if (event.key === 's') {
      event.preventDefault();
      saveCanvas();
    }
  },

  handleCanvasMouseDown(event) {
    const clickedCanvasElement = event.target.closest('.node, .edge, .canvas-text');
    const canPanCanvas = this.currentTool !== 'node' && !clickedCanvasElement;
    if (!canPanCanvas) return;
    this.isCanvasDragging = true;
    this.canvasDragStartX = event.clientX;
    this.canvasDragStartY = event.clientY;
    this.canvasDragStartOffsetX = this.offsetX;
    this.canvasDragStartOffsetY = this.offsetY;
    this.svgElement.style.cursor = 'grabbing';
    event.preventDefault();
  },

  handleCanvasMouseMove(event) {
    if (this.isCanvasDragging) {
      const rect = this.svgElement.getBoundingClientRect();
      const viewWidth = this.baseViewWidth / this.zoom;
      const viewHeight = this.baseViewHeight / this.zoom;
      const dx = ((event.clientX - this.canvasDragStartX) / rect.width) * viewWidth;
      const dy = ((event.clientY - this.canvasDragStartY) / rect.height) * viewHeight;
      this.offsetX = this.canvasDragStartOffsetX - dx;
      this.offsetY = this.canvasDragStartOffsetY - dy;
      this.syncViewport();
      return;
    }
    if (!this.isDrawingEdge || !this.edgeStartNode) return;
    const { x, y } = this.screenToWorld(event.clientX, event.clientY);
    if (!this.tempLine) {
      this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.tempLine.setAttribute('stroke', '#999');
      this.tempLine.setAttribute('stroke-width', '2');
      this.tempLine.setAttribute('fill', 'none');
      this.svgElement.appendChild(this.tempLine);
    }
    this.tempLine.setAttribute('x1', this.edgeStartNode.x);
    this.tempLine.setAttribute('y1', this.edgeStartNode.y);
    this.tempLine.setAttribute('x2', x);
    this.tempLine.setAttribute('y2', y);
  },

  handlePointerUp() {
    if (this.isCanvasDragging) {
      this.isCanvasDragging = false;
      this.updateCanvasCursor();
      this.persistCanvasState();
    }
    if (this.isDrawingEdge) {
      if (this.edgeHoverTargetId && this.edgeStartNode?.id !== this.edgeHoverTargetId) {
        this.addEdge(this.edgeStartNode.id, this.edgeHoverTargetId);
      }
      this.cancelEdgeDrawing();
    }
  }
});

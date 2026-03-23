Object.assign(Canvas.prototype, {
  updateProperties() {
    const templateInfoGroup = document.getElementById('templateInfoGroup');
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const selectedInfo = document.getElementById('selectedInfo');
    const nodeProperties = document.getElementById('nodeProperties');
    const edgeProperties = document.getElementById('edgeProperties');
    const textProperties = document.getElementById('textProperties');
    this.updateTemplateInfo(templateInfoGroup, templateName, templateDescription);
    nodeProperties.style.display = 'none';
    edgeProperties.style.display = 'none';
    textProperties.style.display = 'none';
    if (this.selectedNodeId) return this.updateNodeProperties(selectedInfo, nodeProperties);
    if (this.selectedEdgeId) return this.updateEdgeProperties(selectedInfo, edgeProperties);
    if (this.selectedTextId) return this.updateTextProperties(selectedInfo, textProperties);
    selectedInfo.textContent = i18n.t('selected.none');
  },

  updateTemplateInfo(group, name, description) {
    if (!store.data.templateInfo?.name) {
      group.style.display = 'none';
      name.textContent = '';
      description.textContent = '';
      return;
    }
    group.style.display = 'block';
    name.textContent = store.data.templateInfo.name;
    description.textContent = store.data.templateInfo.description || i18n.t('template.noDescription');
  },

  updateNodeProperties(selectedInfo, nodeProperties) {
    const node = store.getNodes().find((item) => item.id === this.selectedNodeId);
    if (!node) return;
    selectedInfo.textContent = i18n.t('selected.node', { label: node.label });
    nodeProperties.style.display = 'block';
    this.bindNodePropertyField('nodeLabel', node.label, (value) => ({ label: value }));
    this.bindNodePropertyField('nodeType', node.type || 'variable', (value) => {
      this.currentNodeType = value;
      this.syncNodeTypeSelection();
      return { type: value };
    });
    this.bindNodePropertyField('nodeColor', node.color, (value) => ({ color: value }));
    this.bindNodePropertyField('nodeShape', node.shape, (value) => ({ shape: value }));
  },

  bindNodePropertyField(id, value, updater) {
    const field = document.getElementById(id);
    field.value = value;
    field.onchange = () => this.applyNodeUpdates(updater(field.value));
  },

  applyNodeUpdates(updates) {
    store.updateNode(this.selectedNodeId, updates);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
  },

  updateEdgeProperties(selectedInfo, edgeProperties) {
    const edge = store.getEdges().find((item) => item.id === this.selectedEdgeId);
    if (!edge) return;
    selectedInfo.textContent = i18n.t('selected.edge');
    edgeProperties.style.display = 'block';
    document.getElementById('edgeType').value = edge.type;
    document.getElementById('edgeLabel').value = edge.label;
    document.getElementById('edgeDelay').checked = edge.hasDelay;
    document.getElementById('edgeType').onchange = () => this.applyEdgeUpdates({ type: document.getElementById('edgeType').value, color: new CanvasEdge({ type: document.getElementById('edgeType').value }).color });
    document.getElementById('edgeLabel').onchange = () => this.applyEdgeUpdates({ label: document.getElementById('edgeLabel').value });
    document.getElementById('edgeDelay').onchange = () => this.applyEdgeUpdates({ hasDelay: document.getElementById('edgeDelay').checked });
  },

  applyEdgeUpdates(updates) {
    store.updateEdge(this.selectedEdgeId, updates);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
  },

  updateTextProperties(selectedInfo, textProperties) {
    const text = store.getTexts().find((item) => item.id === this.selectedTextId);
    if (!text) return;
    selectedInfo.textContent = i18n.t('selected.text', { text: text.text });
    textProperties.style.display = 'block';
    document.getElementById('textContent').value = text.text;
    document.getElementById('textColor').value = text.color;
    document.getElementById('textSize').value = text.fontSize;
    document.getElementById('textContent').onchange = () => this.applyTextUpdates({ text: document.getElementById('textContent').value || '新文本' }, true);
    document.getElementById('textColor').onchange = () => this.applyTextUpdates({ color: document.getElementById('textColor').value });
    document.getElementById('textSize').onchange = () => this.applyTextUpdates({ fontSize: Math.max(12, Math.min(72, Number(document.getElementById('textSize').value) || 24)) }, true);
  },

  applyTextUpdates(updates, refreshProperties = false) {
    store.updateText(this.selectedTextId, updates);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    if (refreshProperties) this.updateProperties();
  },

  syncToolSelection() {
    document.querySelectorAll('.tool-item[data-tool]').forEach((item) => {
      item.classList.toggle('active', item.dataset.tool === this.currentTool);
    });
  },

  syncNodeTypeSelection() {
    document.querySelectorAll('.tool-item[data-type]').forEach((item) => {
      item.classList.toggle('active', item.dataset.type === this.currentNodeType);
    });
  }
});

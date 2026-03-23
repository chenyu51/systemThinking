Object.assign(Canvas.prototype, {
  updateProperties() {
    this.updateGraphInfo();
    const templateInfoGroup = document.getElementById('templateInfoGroup');
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const aiInfoGroup = document.getElementById('aiInfoGroup');
    const aiDescription = document.getElementById('aiDescription');
    const aiPatterns = document.getElementById('aiPatterns');
    const aiLeveragePoints = document.getElementById('aiLeveragePoints');
    const selectedInfo = document.getElementById('selectedInfo');
    const nodeProperties = document.getElementById('nodeProperties');
    const edgeProperties = document.getElementById('edgeProperties');
    const textProperties = document.getElementById('textProperties');
    this.updateTemplateInfo(templateInfoGroup, templateName, templateDescription);
    this.updateAIInfo(aiInfoGroup, aiDescription, aiPatterns, aiLeveragePoints);
    this.updateSystemConceptPanel();
    nodeProperties.style.display = 'none';
    edgeProperties.style.display = 'none';
    textProperties.style.display = 'none';
    if (this.selectedNodeId) return this.updateNodeProperties(selectedInfo, nodeProperties);
    if (this.selectedEdgeId) return this.updateEdgeProperties(selectedInfo, edgeProperties);
    if (this.selectedTextId) return this.updateTextProperties(selectedInfo, textProperties);
    selectedInfo.textContent = i18n.t('selected.none');
  },

  updateGraphInfo() {
    const titleField = document.getElementById('graphTitle');
    const descriptionField = document.getElementById('graphDescription');
    titleField.value = store.data.name || '';
    descriptionField.value = store.data.description || '';
    titleField.onchange = () => this.applyGraphInfoUpdates({
      name: titleField.value.trim() || '未命名画布'
    });
    descriptionField.onchange = () => this.applyGraphInfoUpdates({
      description: descriptionField.value.trim()
    });
  },

  applyGraphInfoUpdates(updates) {
    Object.assign(store.data, updates);
    this.persistCanvasState();
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

  updateAIInfo(group, description, patterns, leveragePoints) {
    const aiInfo = store.data.aiInfo;
    if (!aiInfo?.description && !aiInfo?.patterns?.length && !aiInfo?.leveragePoints?.length) {
      group.style.display = 'none';
      description.textContent = '';
      patterns.innerHTML = '';
      leveragePoints.innerHTML = '';
      return;
    }
    group.style.display = 'block';
    description.innerHTML = this.renderEmphasisText(aiInfo.description || '');
    patterns.innerHTML = this.renderInfoList(aiInfo.patterns);
    leveragePoints.innerHTML = this.renderInfoList(aiInfo.leveragePoints);
  },

  renderInfoList(items = []) {
    if (!items.length) {
      return '<div class="info-empty">-</div>';
    }
    return items.map((item) => `<div class="info-list-item">${this.renderEmphasisText(item)}</div>`).join('');
  },

  renderEmphasisText(value) {
    let text = this.escapeHTML(value);
    text = text.replace(/^([^：:\n]{2,16})([：:])/gm, '<strong>$1</strong>$2');
    text = text.replace(/([“「《][^”」》\n]{1,24}[”」》])/g, '<strong>$1</strong>');
    text = text.replace(/(关键模式|杠杆点|正反馈|负反馈|风险|机会|瓶颈|建议|干预点)/g, '<strong>$1</strong>');
    return text;
  },

  escapeHTML(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
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

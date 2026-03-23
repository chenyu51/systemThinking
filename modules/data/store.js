class CanvasStore {
  constructor() {
    this.data = this.createDefaultData();
  }

  createDefaultData() {
    return {
      version: '1.0',
      id: this.generateId(),
      name: '未命名画布',
      description: '',
      templateInfo: null,
      aiInfo: this.createDefaultAIInfo(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      canvas: { zoom: 1, offsetX: 0, offsetY: 0, currentTool: 'select', currentNodeType: 'variable', nodes: [], edges: [], texts: [] }
    };
  }

  generateId() {
    return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createDefaultAIInfo() {
    return {
      description: '',
      patterns: [],
      leveragePoints: [],
      systemConcepts: {
        feedbackLoops: [],
        stocks: [],
        flows: [],
        variables: [],
        delays: [],
        boundaries: [],
        archetypes: []
      },
      prompt: '',
      provider: '',
      model: ''
    };
  }

  ensureCanvasData() {
    this.data.name ||= '未命名画布';
    this.data.description ||= '';
    this.data.aiInfo = { ...this.createDefaultAIInfo(), ...(this.data.aiInfo || {}) };
    this.data.aiInfo.patterns = Array.isArray(this.data.aiInfo.patterns) ? this.data.aiInfo.patterns : [];
    this.data.aiInfo.leveragePoints = Array.isArray(this.data.aiInfo.leveragePoints) ? this.data.aiInfo.leveragePoints : [];
    this.data.aiInfo.systemConcepts = {
      ...this.createDefaultAIInfo().systemConcepts,
      ...(this.data.aiInfo.systemConcepts || {})
    };
    Object.keys(this.data.aiInfo.systemConcepts).forEach((key) => {
      this.data.aiInfo.systemConcepts[key] = Array.isArray(this.data.aiInfo.systemConcepts[key]) ? this.data.aiInfo.systemConcepts[key] : [];
    });
    this.data.canvas ||= {};
    this.data.canvas.currentTool ||= 'select';
    this.data.canvas.currentNodeType ||= 'variable';
    this.data.canvas.zoom ||= 1;
    this.data.canvas.offsetX ||= 0;
    this.data.canvas.offsetY ||= 0;
    this.data.canvas.leftPanelHidden ||= false;
    this.data.canvas.rightPanelHidden ||= false;
    this.data.canvas.nodes = Array.isArray(this.data.canvas.nodes) ? this.data.canvas.nodes : [];
    this.data.canvas.edges = Array.isArray(this.data.canvas.edges) ? this.data.canvas.edges : [];
    this.data.canvas.texts = Array.isArray(this.data.canvas.texts) ? this.data.canvas.texts : [];
  }

  async load() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['canvas'], (result) => {
        if (result.canvas) this.data = result.canvas;
        this.ensureCanvasData();
        resolve(this.data);
      });
    });
  }

  async save() {
    this.data.updated = new Date().toISOString();
    return new Promise((resolve) => {
      chrome.storage.local.set({ canvas: this.data }, () => resolve(this.data));
    });
  }

  cloneData(data = this.data) {
    return JSON.parse(JSON.stringify(data));
  }

  async getCollection(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(Array.isArray(result[key]) ? result[key] : []));
    });
  }

  async setCollection(key, items) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: items }, () => resolve(items));
    });
  }

  async saveSnapshot(name) {
    const snapshots = await this.getCollection('savedCanvases');
    const snapshot = { id: this.generateId(), name, created: new Date().toISOString(), updated: new Date().toISOString(), data: this.cloneData() };
    snapshots.unshift(snapshot);
    await this.setCollection('savedCanvases', snapshots);
    return snapshot;
  }

  getSavedSnapshots() {
    return this.getCollection('savedCanvases');
  }

  async loadSnapshot(snapshotId) {
    const snapshot = (await this.getSavedSnapshots()).find((item) => item.id === snapshotId);
    if (!snapshot) return null;
    this.data = this.cloneData(snapshot.data);
    this.data.id = this.generateId();
    this.data.name = snapshot.name;
    this.data.updated = new Date().toISOString();
    this.ensureCanvasData();
    return this.data;
  }

  async deleteSnapshot(snapshotId) {
    const nextSnapshots = (await this.getSavedSnapshots()).filter((item) => item.id !== snapshotId);
    await this.setCollection('savedCanvases', nextSnapshots);
    return nextSnapshots;
  }

  async saveTemplate(name) {
    const templates = await this.getCollection('savedTemplates');
    const template = { id: this.generateId(), name, created: new Date().toISOString(), updated: new Date().toISOString(), data: this.cloneData() };
    templates.unshift(template);
    await this.setCollection('savedTemplates', templates);
    return template;
  }

  getSavedTemplates() {
    return this.getCollection('savedTemplates');
  }

  async loadTemplate(templateId) {
    const template = (await this.getSavedTemplates()).find((item) => item.id === templateId);
    if (!template) return null;
    this.data = this.cloneData(template.data);
    this.data.id = this.generateId();
    this.data.name = template.name;
    this.data.created = new Date().toISOString();
    this.data.updated = new Date().toISOString();
    this.ensureCanvasData();
    return this.data;
  }

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonStr) {
    try {
      this.data = JSON.parse(jsonStr);
      this.ensureCanvasData();
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  getNodes() {
    return this.data.canvas.nodes;
  }

  addNode(node) {
    this.data.canvas.nodes.push(node);
    return node;
  }

  updateNode(nodeId, updates) {
    const node = this.data.canvas.nodes.find((item) => item.id === nodeId);
    if (node) Object.assign(node, updates);
    return node;
  }

  deleteNode(nodeId) {
    this.data.canvas.nodes = this.data.canvas.nodes.filter((item) => item.id !== nodeId);
    this.data.canvas.edges = this.data.canvas.edges.filter((item) => item.source !== nodeId && item.target !== nodeId);
  }

  getEdges() {
    return this.data.canvas.edges;
  }

  addEdge(edge) {
    this.data.canvas.edges.push(edge);
    return edge;
  }

  updateEdge(edgeId, updates) {
    const edge = this.data.canvas.edges.find((item) => item.id === edgeId);
    if (edge) Object.assign(edge, updates);
    return edge;
  }

  deleteEdge(edgeId) {
    this.data.canvas.edges = this.data.canvas.edges.filter((item) => item.id !== edgeId);
  }

  getTexts() {
    return this.data.canvas.texts;
  }

  addText(text) {
    this.data.canvas.texts.push(text);
    return text;
  }

  updateText(textId, updates) {
    const text = this.data.canvas.texts.find((item) => item.id === textId);
    if (text) Object.assign(text, updates);
    return text;
  }

  deleteText(textId) {
    this.data.canvas.texts = this.data.canvas.texts.filter((item) => item.id !== textId);
  }

  clear() {
    const canvasState = this.data.canvas || {};
    const nextData = this.createDefaultData();
    nextData.canvas.leftPanelHidden = !!canvasState.leftPanelHidden;
    nextData.canvas.rightPanelHidden = !!canvasState.rightPanelHidden;
    this.data = nextData;
  }

  getStats() {
    return { nodeCount: this.data.canvas.nodes.length, edgeCount: this.data.canvas.edges.length };
  }
}

const store = new CanvasStore();
window.CanvasStore = CanvasStore;
window.store = store;

/**
 * 数据存储模块 - Chrome Storage API 封装
 */

class CanvasStore {
  constructor() {
    this.data = {
      version: '1.0',
      id: this.generateId(),
      name: '未命名画布',
      templateInfo: null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      canvas: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        currentTool: 'select',
        nodes: [],
        edges: []
      }
    };
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'canvas_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 从本地存储加载数据
   */
  async load() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['canvas'], (result) => {
        if (result.canvas) {
          this.data = result.canvas;
        }
        resolve(this.data);
      });
    });
  }

  /**
   * 保存数据到本地存储
   */
  async save() {
    this.data.updated = new Date().toISOString();
    return new Promise((resolve) => {
      chrome.storage.local.set({ canvas: this.data }, () => {
        console.log('Canvas saved:', this.data);
        resolve(this.data);
      });
    });
  }

  cloneData(data = this.data) {
    return JSON.parse(JSON.stringify(data));
  }

  async getCollection(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(Array.isArray(result[key]) ? result[key] : []);
      });
    });
  }

  async setCollection(key, items) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: items }, () => resolve(items));
    });
  }

  async saveSnapshot(name) {
    const snapshots = await this.getCollection('savedCanvases');
    const snapshot = {
      id: this.generateId(),
      name,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      data: this.cloneData()
    };
    snapshots.unshift(snapshot);
    await this.setCollection('savedCanvases', snapshots);
    return snapshot;
  }

  async getSavedSnapshots() {
    return this.getCollection('savedCanvases');
  }

  async loadSnapshot(snapshotId) {
    const snapshots = await this.getSavedSnapshots();
    const snapshot = snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return null;

    this.data = this.cloneData(snapshot.data);
    this.data.id = this.generateId();
    this.data.name = snapshot.name;
    this.data.updated = new Date().toISOString();
    return this.data;
  }

  async deleteSnapshot(snapshotId) {
    const snapshots = await this.getSavedSnapshots();
    const nextSnapshots = snapshots.filter(item => item.id !== snapshotId);
    await this.setCollection('savedCanvases', nextSnapshots);
    return nextSnapshots;
  }

  async saveTemplate(name) {
    const templates = await this.getCollection('savedTemplates');
    const template = {
      id: this.generateId(),
      name,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      data: this.cloneData()
    };
    templates.unshift(template);
    await this.setCollection('savedTemplates', templates);
    return template;
  }

  async getSavedTemplates() {
    return this.getCollection('savedTemplates');
  }

  async loadTemplate(templateId) {
    const templates = await this.getSavedTemplates();
    const template = templates.find(item => item.id === templateId);
    if (!template) return null;

    this.data = this.cloneData(template.data);
    this.data.id = this.generateId();
    this.data.name = template.name;
    this.data.created = new Date().toISOString();
    this.data.updated = new Date().toISOString();
    return this.data;
  }

  /**
   * 导出为JSON
   */
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * 从JSON导入
   */
  importJSON(jsonStr) {
    try {
      this.data = JSON.parse(jsonStr);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  /**
   * 获取节点
   */
  getNodes() {
    return this.data.canvas.nodes || [];
  }

  /**
   * 添加节点
   */
  addNode(node) {
    if (!this.data.canvas.nodes) {
      this.data.canvas.nodes = [];
    }
    this.data.canvas.nodes.push(node);
    return node;
  }

  /**
   * 更新节点
   */
  updateNode(nodeId, updates) {
    const node = this.data.canvas.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
    }
    return node;
  }

  /**
   * 删除节点
   */
  deleteNode(nodeId) {
    this.data.canvas.nodes = this.data.canvas.nodes.filter(n => n.id !== nodeId);
    // 同时删除相关连线
    this.data.canvas.edges = this.data.canvas.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    );
  }

  /**
   * 获取连线
   */
  getEdges() {
    return this.data.canvas.edges || [];
  }

  /**
   * 添加连线
   */
  addEdge(edge) {
    if (!this.data.canvas.edges) {
      this.data.canvas.edges = [];
    }
    this.data.canvas.edges.push(edge);
    return edge;
  }

  /**
   * 更新连线
   */
  updateEdge(edgeId, updates) {
    const edge = this.data.canvas.edges.find(e => e.id === edgeId);
    if (edge) {
      Object.assign(edge, updates);
    }
    return edge;
  }

  /**
   * 删除连线
   */
  deleteEdge(edgeId) {
    this.data.canvas.edges = this.data.canvas.edges.filter(e => e.id !== edgeId);
  }

  /**
   * 清空画布
   */
  clear() {
    this.data.canvas.nodes = [];
    this.data.canvas.edges = [];
    this.data.templateInfo = null;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      nodeCount: this.data.canvas.nodes.length,
      edgeCount: this.data.canvas.edges.length
    };
  }
}

// 全局实例
const store = new CanvasStore();

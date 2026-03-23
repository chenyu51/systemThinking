/**
 * 面板交互脚本 - 处理顶部工具栏和菜单
 */

const POPUP_SELECTORS = [
  '.export-menu',
  '.saved-menu',
  '.settings-menu',
  '.archetype-menu',
  '.canvas-context-menu'
];

const POPUP_TRIGGER_SELECTORS = [
  '#btnExport',
  '#btnSaved',
  '#btnSettings',
  '#btnTemplate'
];

let popupCloseHandlerBound = false;

function closeAllPopups() {
  POPUP_SELECTORS.forEach((selector) => {
    document.querySelector(selector)?.remove();
  });
}

/**
 * 新建画布
 */
function newCanvas() {
  if (confirm(i18n.t('dialog.newCanvasConfirm'))) {
    store.clear();
    store.data.name = '未命名画布';
    store.save();
    canvas.selectedNodeId = null;
    canvas.selectedEdgeId = null;
    canvas.render();
    canvas.updateProperties();
    canvas.updateStatus(i18n.t('message.newCanvas'));
  }
}

/**
 * 打开画布
 */
function openCanvas() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (store.importJSON(event.target.result)) {
        store.save(); // 自动保存
        canvas.render();
        canvas.updateProperties();
        canvas.persistCanvasState();
        canvas.updateStatus(i18n.t('message.canvasOpened'));
      } else {
        alert(i18n.t('dialog.openError'));
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

/**
 * 保存画布
 */
async function saveCanvas() {
  const defaultName = store.data.name || '未命名画布';
  const name = window.prompt(i18n.t('dialog.saveNamePrompt'), defaultName);
  if (!name) return;

  store.data.name = name.trim() || defaultName;
  store.data.canvas.zoom = canvas.zoom;
  store.data.canvas.offsetX = canvas.offsetX;
  store.data.canvas.offsetY = canvas.offsetY;

  await store.save();
  await store.saveSnapshot(store.data.name);
  canvas.updateStatus(i18n.t('message.snapshotSaved', { name: store.data.name }));
}

async function saveAsTemplate() {
  const defaultName = store.data.name || '未命名模板';
  const name = window.prompt(i18n.t('dialog.templateNamePrompt'), defaultName);
  if (!name) return;

  store.data.canvas.zoom = canvas.zoom;
  store.data.canvas.offsetX = canvas.offsetX;
  store.data.canvas.offsetY = canvas.offsetY;
  await store.save();
  const template = await store.saveTemplate(name.trim() || defaultName);
  canvas.updateStatus(i18n.t('message.templateSavedLocal', { name: template.name }));
}

async function showSavedMenu() {
  let menu = document.querySelector('.saved-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const snapshots = await store.getSavedSnapshots();
  menu = document.createElement('div');
  menu.className = 'saved-menu';
  menu.style.cssText = `
    position: fixed;
    top: 70px;
    right: 180px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    width: 320px;
    max-height: 420px;
    overflow-y: auto;
  `;

  const title = document.createElement('div');
  title.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-weight: 600; color: #333;';
  title.textContent = i18n.t('menu.savedCanvases');
  menu.appendChild(title);

  if (snapshots.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding: 16px; color: #999; font-size: 13px;';
    empty.textContent = i18n.t('menu.emptySaved');
    menu.appendChild(empty);
  }

  snapshots.forEach((snapshot) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid #f5f5f5;
    `;

    const loadButton = document.createElement('button');
    loadButton.type = 'button';
    loadButton.style.cssText = `
      flex: 1;
      background: transparent;
      color: #333;
      justify-content: flex-start;
      padding: 8px 10px;
    `;
    loadButton.textContent = `${snapshot.name} · ${new Date(snapshot.updated).toLocaleString()}`;
    loadButton.onclick = async () => {
      const data = await store.loadSnapshot(snapshot.id);
      if (!data) return;
      await store.save();
      canvas.selectedNodeId = null;
      canvas.selectedEdgeId = null;
      canvas.currentTool = store.data.canvas.currentTool || 'select';
      canvas.syncToolSelection();
      canvas.render();
      canvas.updateProperties();
      canvas.syncViewport();
      canvas.updateStatus(i18n.t('message.snapshotLoaded', { name: snapshot.name }));
      menu.remove();
    };

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.style.cssText = 'padding: 8px 10px; background: #fff2f0; color: #c0392b;';
    deleteButton.textContent = i18n.t('menu.delete');
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(i18n.t('dialog.deleteSavedConfirm'))) return;
      await store.deleteSnapshot(snapshot.id);
      canvas.updateStatus(i18n.t('message.snapshotDeleted'));
      menu.remove();
      showSavedMenu();
    };

    row.appendChild(loadButton);
    row.appendChild(deleteButton);
    menu.appendChild(row);
  });

  menu.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(menu);
}

/**
 * 导出菜单
 */
function toggleMenu(button) {
  // 创建菜单
  let menu = document.querySelector('.export-menu');
  if (menu) {
    menu.remove();
    return;
  }

  menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.style.cssText = `
    position: absolute;
    top: 60px;
    right: 20px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 150px;
  `;

  const options = [
    { label: i18n.t('menu.exportPng'), action: exportPNG },
    { label: i18n.t('menu.exportSvg'), action: exportSVG },
    { label: i18n.t('menu.exportJson'), action: exportJSON }
  ];

  options.forEach(option => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s ease;
    `;
    item.textContent = option.label;
    item.onmouseover = () => item.style.background = '#f5f5f5';
    item.onmouseout = () => item.style.background = 'white';
    item.onclick = () => {
      option.action();
      menu.remove();
    };
    menu.appendChild(item);
  });

  menu.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(menu);
}

/**
 * 导出为PNG
 */
function exportPNG() {
  // 使用 HTML2Canvas 或原生SVG的方式
  const svg = document.getElementById('canvas');
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `canvas-${Date.now()}.png`;
    link.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  window.canvas?.updateStatus(i18n.t('message.pngExported'));
}

/**
 * 导出为SVG
 */
function exportSVG() {
  const svg = document.getElementById('canvas');
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.svg`;
  link.click();

  URL.revokeObjectURL(url);
  canvas.updateStatus(i18n.t('message.svgExported'));
}

/**
 * 导出为JSON
 */
function exportJSON() {
  const jsonData = store.exportJSON();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
  canvas.updateStatus(i18n.t('message.jsonExported'));
}

/**
 * 撤销
 */
function undo() {
  canvas.undo();
  canvas.updateStatus(i18n.t('message.undone'));
}

/**
 * 重做
 */
function redo() {
  canvas.redo();
  canvas.updateStatus(i18n.t('message.redone'));
}

/**
 * 打开设置
 */
function openSettings() {
  let settings = document.querySelector('.settings-menu');
  if (settings) {
    settings.remove();
    return;
  }

  settings = document.createElement('div');
  settings.className = 'settings-menu';
  settings.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    width: 240px;
    padding: 12px 0;
  `;

  // 语言选项
  const languages = i18n.getLanguages();
  
  const title = document.createElement('div');
  title.style.cssText = 'padding: 8px 16px; font-weight: 600; color: #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;';
  title.textContent = i18n.t('toolbar.settings');
  settings.appendChild(title);

  // 语言选择器
  const langLabel = document.createElement('div');
  langLabel.style.cssText = 'padding: 8px 16px; font-size: 12px; color: #666;';
  langLabel.textContent = 'Language / 语言';
  settings.appendChild(langLabel);

  languages.forEach(lang => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid ${i18n.currentLang === lang ? '#4A90E2' : 'transparent'};
      background: ${i18n.currentLang === lang ? '#f0f5ff' : 'white'};
      font-weight: ${i18n.currentLang === lang ? '500' : '400'};
      color: ${i18n.currentLang === lang ? '#4A90E2' : '#333'};
    `;
    const langName = lang === 'zh-CN' ? '中文' : 'English';
    item.textContent = langName;
    item.onmouseover = () => {
      if (i18n.currentLang !== lang) {
        item.style.background = '#f9f9f9';
      }
    };
    item.onmouseout = () => {
      if (i18n.currentLang !== lang) {
        item.style.background = 'white';
      }
    };
    item.onclick = () => {
      if (i18n.setLanguage(lang)) {
        // 重新初始化按钮文本
        initializeEventListeners();
        i18n.applyTranslations();
        canvas.render();
        canvas.updateProperties();
        // 刷新状态显示
        canvas.updateStatus(i18n.t('message.saved'));
        // 关闭菜单并重新打开以更新语言
        settings.remove();
      }
    };
    settings.appendChild(item);
  });

  settings.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(settings);
}

/**
 * 第五项修炼基模模版库
 */
const ARCHETYPES = {
  // 1. 成长极限 (Limits to Growth)
  limitsToGrowth: {
    name: '成长极限',
    description: '成长停滞：成长因素最终因限制因素而衰减',
    nodes: [
      { label: '期望效果', x: 200, y: 100, color: '#FFD700' },
      { label: '结果', x: 400, y: 100, color: '#FFD700' },
      { label: '实际结果', x: 400, y: 300, color: '#4A90E2' },
      { label: '差距', x: 200, y: 300, color: '#E74C3C' },
      { label: '限制因素', x: 600, y: 200, color: '#E74C3C' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '加强' },
      { source: 1, target: 2, type: 'positive', label: '' },
      { source: 0, target: 3, type: 'negative', label: '比较' },
      { source: 3, target: 1, type: 'positive', label: '调整' },
      { source: 4, target: 2, type: 'negative', label: '限制' }
    ]
  },
  
  // 2. 衰退螺旋 (Shifting the Burden)
  shiftingTheBurden: {
    name: '衰退螺旋',
    description: '转嫁负担：通过权宜之计解决症状，导致根本原因恶化',
    nodes: [
      { label: '问题症状', x: 200, y: 150, color: '#E74C3C' },
      { label: '权宜之计', x: 100, y: 300, color: '#FFD700' },
      { label: '根本原因', x: 400, y: 300, color: '#E74C3C' },
      { label: '副作用', x: 300, y: 450, color: '#E74C3C' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '应用' },
      { source: 1, target: 0, type: 'negative', label: '缓解' },
      { source: 2, target: 0, type: 'positive', label: '恶化' },
      { source: 1, target: 2, type: 'negative', label: '遮掩' },
      { source: 1, target: 3, type: 'positive', label: '产生' },
      { source: 3, target: 2, type: 'positive', label: '加重' }
    ]
  },
  
  // 3. 成功到失败 (Success to the Successful)
  successToSuccessful: {
    name: '成功到失败',
    description: '成功者获得更多资源，导致其他部分衰退',
    nodes: [
      { label: 'A的成功', x: 200, y: 150, color: '#51CF66' },
      { label: 'A获得资源', x: 100, y: 300, color: '#FFD700' },
      { label: 'B获得资源', x: 300, y: 300, color: '#FFD700' },
      { label: 'B的衰退', x: 400, y: 450, color: '#E74C3C' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '增加' },
      { source: 1, target: 0, type: 'positive', label: '反馈' },
      { source: 1, target: 2, type: 'negative', label: '竞争' },
      { source: 2, target: 3, type: 'negative', label: '减少' }
    ]
  },
  
  // 4. 竞争升级 (Escalation)
  escalation: {
    name: '竞争升级',
    description: '一方的行动引发另一方的反制，相互升级形成对抗',
    nodes: [
      { label: '我的行动', x: 200, y: 150, color: '#4A90E2' },
      { label: '对方威胁度', x: 400, y: 150, color: '#E74C3C' },
      { label: '对方反制', x: 400, y: 300, color: '#E74C3C' },
      { label: '我的威胁度', x: 200, y: 300, color: '#E74C3C' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '增加' },
      { source: 1, target: 2, type: 'positive', label: '促进' },
      { source: 2, target: 3, type: 'positive', label: '增加' },
      { source: 3, target: 0, type: 'positive', label: '正当化' }
    ]
  },
  
  // 5. 富者愈富 (Rich Get Richer)
  richGetRicher: {
    name: '富者愈富',
    description: '初始优势导致积累优势，贫富分化扩大',
    nodes: [
      { label: '初始资源', x: 150, y: 150, color: '#FFD700' },
      { label: '收益率', x: 350, y: 150, color: '#51CF66' },
      { label: '累积资源', x: 250, y: 300, color: '#FFD700' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '决定' },
      { source: 1, target: 2, type: 'positive', label: '生成' },
      { source: 2, target: 0, type: 'positive', label: '反馈' }
    ]
  },
  
  // 6. 目标侵蚀 (Goal Erosion)
  goalErosion: {
    name: '目标侵蚀',
    description: '目标与现实差距过大时，为消除不适感而降低目标',
    nodes: [
      { label: '原始目标', x: 200, y: 100, color: '#FFD700' },
      { label: '实际表现', x: 400, y: 100, color: '#4A90E2' },
      { label: '不适感', x: 300, y: 250, color: '#E74C3C' },
      { label: '调整后目标', x: 200, y: 400, color: '#FFD700' }
    ],
    edges: [
      { source: 0, target: 2, type: 'negative', label: '对比' },
      { source: 1, target: 2, type: 'positive', label: '' },
      { source: 2, target: 3, type: 'negative', label: '压力下降' },
      { source: 3, target: 2, type: 'negative', label: '缓解' }
    ]
  },
  
  // 7. 解决无效 (Fixes that Fail)
  fixesThatFail: {
    name: '解决无效',
    description: '短期解决方案会延迟问题并使其最后变得更糟',
    nodes: [
      { label: '问题', x: 150, y: 150, color: '#E74C3C' },
      { label: '应急解决方案', x: 350, y: 150, color: '#FFD700' },
      { label: '根本解决方案', x: 250, y: 350, color: '#51CF66' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '促进' },
      { source: 1, target: 0, type: 'negative', label: '缓解' },
      { source: 1, target: 2, type: 'negative', label: '延迟' },
      { source: 2, target: 0, type: 'negative', label: '解决' }
    ]
  },
  
  // 8. 意外对手 (Accidental Adversaries)
  accidentalAdversaries: {
    name: '意外对手',
    description: '两个独立的系统为了各自目标而相互冲突',
    nodes: [
      { label: 'A的目标', x: 150, y: 150, color: '#4A90E2' },
      { label: 'A的行动', x: 150, y: 300, color: '#FFD700' },
      { label: 'B的影响', x: 400, y: 300, color: '#E74C3C' },
      { label: 'B的目标', x: 400, y: 150, color: '#4A90E2' }
    ],
    edges: [
      { source: 0, target: 1, type: 'positive', label: '促进' },
      { source: 1, target: 2, type: 'positive', label: '产生' },
      { source: 2, target: 3, type: 'negative', label: '阻碍' }
    ]
  }
};

/**
 * 加载基模模版
 */
function loadArchetype(archetypeKey) {
  const archetype = ARCHETYPES[archetypeKey];
  if (!archetype) {
    alert(i18n.t('dialog.templateMissing'));
    return;
  }

  // 确认是否清空当前画布
  if (store.getNodes().length > 0 || store.getEdges().length > 0) {
    if (!confirm(i18n.t('dialog.templateReplaceConfirm'))) {
      return;
    }
  }

  // 清空画布
  store.clear();
  store.data.templateInfo = {
    name: archetype.name,
    description: archetype.description
  };

  // 创建节点映射
  const nodeIdMap = {};
  archetype.nodes.forEach((nodeData, idx) => {
    const node = new CanvasNode({
      label: nodeData.label,
      x: nodeData.x,
      y: nodeData.y,
      color: nodeData.color,
      type: 'variable'
    });
    nodeIdMap[idx] = node.id;
    store.addNode(node.toJSON());
  });

  // 创建连线
  archetype.edges.forEach(edgeData => {
    const sourceId = nodeIdMap[edgeData.source];
    const targetId = nodeIdMap[edgeData.target];
    const edge = new CanvasEdge({
      source: sourceId,
      target: targetId,
      type: edgeData.type,
      label: edgeData.label || ''
    });
    store.addEdge(edge.toJSON());
  });

  // 刷新画布
  canvas.selectedNodeId = null;
  canvas.selectedEdgeId = null;
  canvas.currentTool = 'select';
  canvas.syncToolSelection();
  canvas.centerGraph();
  canvas.render();
  canvas.updateProperties();
  canvas.saveHistory();
  canvas.persistCanvasState();
  canvas.updateStatus(i18n.t('message.templateLoaded', { name: archetype.name }));
}

/**
 * 打开模版选择器
 */
async function showArchetypeMenu() {
  let menu = document.querySelector('.archetype-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const customTemplates = await store.getSavedTemplates();

  menu = document.createElement('div');
  menu.className = 'archetype-menu';
  menu.style.cssText = `
    position: fixed;
    top: 70px;
    left: 20px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    width: 300px;
    max-height: 600px;
    overflow-y: auto;
  `;

  // 添加标题
  const title = document.createElement('div');
  title.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    color: #333;
  `;
  title.textContent = '📚 ' + i18n.t('toolbar.templates');
  menu.appendChild(title);

  if (customTemplates.length > 0) {
    const customTitle = document.createElement('div');
    customTitle.style.cssText = 'padding: 10px 16px; font-size: 12px; color: #666; background: #fafafa; border-bottom: 1px solid #f0f0f0;';
    customTitle.textContent = i18n.t('menu.customTemplates');
    menu.appendChild(customTitle);

    customTemplates.forEach((template) => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s ease;
      `;

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-weight: 500; color: #333; margin-bottom: 4px;';
      nameEl.textContent = template.name;

      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 12px; color: #999; line-height: 1.4;';
      descEl.textContent = new Date(template.updated).toLocaleString();

      item.appendChild(nameEl);
      item.appendChild(descEl);
      item.onmouseover = () => item.style.background = '#f9f9f9';
      item.onmouseout = () => item.style.background = 'white';
      item.onclick = async () => {
        const data = await store.loadTemplate(template.id);
        if (!data) return;
        store.data.templateInfo = {
          name: template.name,
          description: template.data?.templateInfo?.description || ''
        };
        await store.save();
        canvas.selectedNodeId = null;
        canvas.selectedEdgeId = null;
        canvas.currentTool = 'select';
        canvas.syncToolSelection();
        canvas.centerGraph();
        canvas.render();
        canvas.updateProperties();
        canvas.saveHistory();
        canvas.updateStatus(i18n.t('message.templateLoadedLocal', { name: template.name }));
        menu.remove();
      };

      menu.appendChild(item);
    });
  } else {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding: 12px 16px; color: #999; font-size: 13px; border-bottom: 1px solid #f0f0f0;';
    empty.textContent = i18n.t('menu.emptyTemplates');
    menu.appendChild(empty);
  }

  const builtInTitle = document.createElement('div');
  builtInTitle.style.cssText = 'padding: 10px 16px; font-size: 12px; color: #666; background: #fafafa; border-bottom: 1px solid #f0f0f0;';
  builtInTitle.textContent = i18n.t('menu.builtInTemplates');
  menu.appendChild(builtInTitle);

  // 添加每个基模
  Object.entries(ARCHETYPES).forEach(([key, archetype]) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s ease;
    `;
    
    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-weight: 500; color: #333; margin-bottom: 4px;';
    nameEl.textContent = i18n.t('template.' + key);
    
    const descEl = document.createElement('div');
    descEl.style.cssText = 'font-size: 12px; color: #999; line-height: 1.4;';
    descEl.textContent = i18n.t('template.' + key + 'Desc');
    
    item.appendChild(nameEl);
    item.appendChild(descEl);
    
    item.onmouseover = () => item.style.background = '#f9f9f9';
    item.onmouseout = () => item.style.background = 'white';
    item.onclick = () => {
      loadArchetype(key);
      menu.remove();
    };
    
    menu.appendChild(item);
  });

  menu.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(menu);
}

// 修复canvas.js中的调用
window.newCanvas = newCanvas;
window.openCanvas = openCanvas;
window.saveCanvas = saveCanvas;
window.saveAsTemplate = saveAsTemplate;
window.showSavedMenu = showSavedMenu;
window.toggleMenu = toggleMenu;
window.undo = undo;
window.redo = redo;
window.openSettings = openSettings;
window.showArchetypeMenu = showArchetypeMenu;
window.loadArchetype = loadArchetype;

/**
 * 初始化事件监听
 */
function initializeEventListeners() {
  i18n.applyTranslations();

  // 设置按钮文本为国际化版本
  document.getElementById('btnTemplate').textContent = i18n.t('toolbar.templates');
  document.getElementById('btnNew').textContent = i18n.t('toolbar.new');
  document.getElementById('btnOpen').textContent = i18n.t('toolbar.open');
  document.getElementById('btnSave').textContent = i18n.t('toolbar.save');
  document.getElementById('btnSaved').textContent = i18n.t('toolbar.saved');
  document.getElementById('btnSaveTemplate').textContent = i18n.t('toolbar.saveTemplate');
  document.getElementById('btnExport').textContent = i18n.t('toolbar.export') + ' ▼';
  document.getElementById('btnUndo').textContent = i18n.t('toolbar.undo');
  document.getElementById('btnRedo').textContent = i18n.t('toolbar.redo');
  document.getElementById('btnSettings').textContent = i18n.t('toolbar.settings');
  
  // 绑定按钮事件
  document.getElementById('btnTemplate').onclick = function(e) {
    e.stopPropagation();
    showArchetypeMenu();
  };
  document.getElementById('btnNew').onclick = newCanvas;
  document.getElementById('btnOpen').onclick = openCanvas;
  document.getElementById('btnSave').onclick = saveCanvas;
  document.getElementById('btnSaved').onclick = function(e) {
    e.stopPropagation();
    showSavedMenu();
  };
  document.getElementById('btnSaveTemplate').onclick = saveAsTemplate;
  document.getElementById('btnExport').onclick = function(e) {
    e.stopPropagation();
    toggleMenu(this);
  };
  document.getElementById('btnUndo').onclick = undo;
  document.getElementById('btnRedo').onclick = redo;
  document.getElementById('btnSettings').onclick = function(e) {
    e.stopPropagation();
    openSettings();
  };

  if (!popupCloseHandlerBound) {
    document.addEventListener('click', (e) => {
      const clickedPopup = e.target.closest(POPUP_SELECTORS.join(', '));
      const clickedTrigger = e.target.closest(POPUP_TRIGGER_SELECTORS.join(', '));
      if (!clickedPopup && !clickedTrigger) {
        closeAllPopups();
      }
    });
    popupCloseHandlerBound = true;
  }
}

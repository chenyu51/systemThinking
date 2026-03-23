/**
 * 国际化（i18n）模块
 */

class I18n {
  constructor() {
    // 获取系统语言或使用保存的语言设置
    this.currentLang = this.getSavedLanguage() || this.getSystemLanguage();
    
    this.messages = {
      'zh-CN': {
        // 工具栏
        'toolbar.templates': '📚 模版',
        'toolbar.new': '➕ 新建',
        'toolbar.open': '📂 打开',
        'toolbar.save': '💾 保存',
        'toolbar.export': '📤 导出',
        'toolbar.undo': '↶ 撤销',
        'toolbar.redo': '↷ 重做',
        'toolbar.settings': '⚙️ 设置',
        'menu.exportPng': '导出为 PNG',
        'menu.exportSvg': '导出为 SVG',
        'menu.exportJson': '导出为 JSON',

        // 侧边栏
        'sidebar.tools': '工具',
        'sidebar.nodeTypes': '节点类型',
        'tool.select.full': '👆 选择工具',
        'tool.node': '⭕ 添加节点',
        'tool.edge': '➜ 绘制连线',
        'tool.text': '📝 添加文本',
        'nodeType.variable': '变量',
        'nodeType.stock': '存量 (Stock)',
        'nodeType.flow': '流量 (Flow)',

        // 工具模式
        'tool.select': '选择',
        'tool.addNode': '添加节点',
        'tool.addEdge': '添加连线',
        'tool.addPositive': '正反馈',
        'tool.addNegative': '负反馈',
        
        // 对话框
        'dialog.nodeLabel': '节点标签',
        'dialog.edgeLabel': '连线标签',
        'dialog.confirm': '确认',
        'dialog.cancel': '取消',
        'dialog.delete': '确定要删除吗？',
        'dialog.newCanvasConfirm': '确定要新建画布？当前画布未保存的更改将丢失。',
        'dialog.openError': '文件格式错误，无法打开',
        'dialog.templateMissing': '模版不存在',
        'dialog.templateReplaceConfirm': '当前画布将清空，确定要加载模版吗？',

        // 模版
        'template.limitsToGrowth': '成长极限',
        'template.limitsToGrowthDesc': '系统增长时遇到的限制因素',
        'template.shiftingTheBurden': '衰退螺旋',
        'template.shiftingTheBurdenDesc': '应急方案导致的长期衰退',
        'template.successToSuccessful': '成功到失加',
        'template.successToSuccessfulDesc': '成功的表现导致过度投入',
        'template.escalation': '竞争升级',
        'template.escalationDesc': '相互竞争导致的持续升级',
        'template.richGetRicher': '富者愈富',
        'template.richGetRicherDesc': '优势越来越明显的强化循环',
        'template.goalErosion': '目标侵蚀',
        'template.goalErosionDesc': '目标逐渐被弱化和妥协',
        'template.fixesThatFail': '解决无效',
        'template.fixesThatFailDesc': '应急方案最终失效',
        'template.accidentalAdversaries': '意外对手',
        'template.accidentalAdversariesDesc': '无意中创造了对手',
        
        // 操作提示
        'message.saved': '已保存',
        'message.loading': '加载中...',
        'message.error': '错误',
        'message.success': '成功',
        'message.unsavedChanges': '您有未保存的更改',
        'message.ready': '准备就绪',
        'message.nodeAdded': '节点已添加',
        'message.edgeAdded': '连线已添加',
        'message.newCanvas': '新建画布',
        'message.canvasOpened': '画布已打开',
        'message.canvasSaved': '画布已保存 ✓',
        'message.pngExported': 'PNG已导出',
        'message.svgExported': 'SVG已导出',
        'message.jsonExported': 'JSON已导出',
        'message.undone': '已撤销',
        'message.redone': '已重做',
        'message.templateLoaded': '已加载模版: {name}',
        'status.nodes': '节点: {count}',
        'status.edges': '连线: {count}',
        'status.zoom': '缩放: {percent}%',
        'selected.none': '无',
        'selected.node': '节点: {label}',
        'selected.edge': '连线',
        'properties.selected': '选中元素',
        'properties.nodeLabel': '节点标签',
        'properties.nodeLabelPlaceholder': '输入节点名称',
        'properties.color': '颜色',
        'properties.shape': '形状',
        'properties.edgeType': '连线类型',
        'properties.edgeLabel': '标签',
        'properties.edgeLabelPlaceholder': '输入连线标签',
        'properties.edgeDelay': '有延迟 (//)',
        'shape.rectangle': '矩形',
        'shape.circle': '圆形',
        'shape.diamond': '菱形',
        'edgeType.positive': '正反馈 (+)',
        'edgeType.negative': '负反馈 (-)',
        'edgeType.neutral': '中立',
        'app.title': 'SystemCanvas - 主画布'
      },
      'en-US': {
        // Toolbar
        'toolbar.templates': '📚 Templates',
        'toolbar.new': '➕ New',
        'toolbar.open': '📂 Open',
        'toolbar.save': '💾 Save',
        'toolbar.export': '📤 Export',
        'toolbar.undo': '↶ Undo',
        'toolbar.redo': '↷ Redo',
        'toolbar.settings': '⚙️ Settings',
        'menu.exportPng': 'Export as PNG',
        'menu.exportSvg': 'Export as SVG',
        'menu.exportJson': 'Export as JSON',

        // Sidebar
        'sidebar.tools': 'Tools',
        'sidebar.nodeTypes': 'Node Types',
        'tool.select.full': '👆 Select Tool',
        'tool.node': '⭕ Add Node',
        'tool.edge': '➜ Draw Edge',
        'tool.text': '📝 Add Text',
        'nodeType.variable': 'Variable',
        'nodeType.stock': 'Stock',
        'nodeType.flow': 'Flow',

        // Tools
        'tool.select': 'Select',
        'tool.addNode': 'Add Node',
        'tool.addEdge': 'Add Edge',
        'tool.addPositive': 'Positive Feedback',
        'tool.addNegative': 'Negative Feedback',
        
        // Dialogs
        'dialog.nodeLabel': 'Node Label',
        'dialog.edgeLabel': 'Edge Label',
        'dialog.confirm': 'Confirm',
        'dialog.cancel': 'Cancel',
        'dialog.delete': 'Are you sure you want to delete?',
        'dialog.newCanvasConfirm': 'Create a new canvas? Unsaved changes on the current canvas will be lost.',
        'dialog.openError': 'Invalid file format, unable to open',
        'dialog.templateMissing': 'Template does not exist',
        'dialog.templateReplaceConfirm': 'The current canvas will be cleared. Continue loading the template?',

        // Templates
        'template.limitsToGrowth': 'Limits to Growth',
        'template.limitsToGrowthDesc': 'Growth is limited by constraining factors',
        'template.shiftingTheBurden': 'Shifting the Burden',
        'template.shiftingTheBurdenDesc': 'Quick fix leads to long-term decline',
        'template.successToSuccessful': 'Success to Successful',
        'template.successToSuccessfulDesc': 'Success leads to over-investment',
        'template.escalation': 'Escalation',
        'template.escalationDesc': 'Mutual escalation in competition',
        'template.richGetRicher': 'Rich Get Richer',
        'template.richGetRicherDesc': 'Advantage creates more advantage',
        'template.goalErosion': 'Goal Erosion',
        'template.goalErosionDesc': 'Goals gradually become compromised',
        'template.fixesThatFail': 'Fixes That Fail',
        'template.fixesThatFailDesc': 'Quick fix eventually fails',
        'template.accidentalAdversaries': 'Accidental Adversaries',
        'template.accidentalAdversariesDesc': 'Inadvertently creating opponents',
        
        // Messages
        'message.saved': 'Saved',
        'message.loading': 'Loading...',
        'message.error': 'Error',
        'message.success': 'Success',
        'message.unsavedChanges': 'You have unsaved changes',
        'message.ready': 'Ready',
        'message.nodeAdded': 'Node added',
        'message.edgeAdded': 'Edge added',
        'message.newCanvas': 'New canvas',
        'message.canvasOpened': 'Canvas opened',
        'message.canvasSaved': 'Canvas saved ✓',
        'message.pngExported': 'PNG exported',
        'message.svgExported': 'SVG exported',
        'message.jsonExported': 'JSON exported',
        'message.undone': 'Undone',
        'message.redone': 'Redone',
        'message.templateLoaded': 'Template loaded: {name}',
        'status.nodes': 'Nodes: {count}',
        'status.edges': 'Edges: {count}',
        'status.zoom': 'Zoom: {percent}%',
        'selected.none': 'None',
        'selected.node': 'Node: {label}',
        'selected.edge': 'Edge',
        'properties.selected': 'Selected Item',
        'properties.nodeLabel': 'Node Label',
        'properties.nodeLabelPlaceholder': 'Enter node name',
        'properties.color': 'Color',
        'properties.shape': 'Shape',
        'properties.edgeType': 'Edge Type',
        'properties.edgeLabel': 'Label',
        'properties.edgeLabelPlaceholder': 'Enter edge label',
        'properties.edgeDelay': 'Has Delay (//)',
        'shape.rectangle': 'Rectangle',
        'shape.circle': 'Circle',
        'shape.diamond': 'Diamond',
        'edgeType.positive': 'Positive Feedback (+)',
        'edgeType.negative': 'Negative Feedback (-)',
        'edgeType.neutral': 'Neutral',
        'app.title': 'SystemCanvas - Main Canvas'
      }
    };
  }

  /**
   * 获取保存的语言设置
   */
  getSavedLanguage() {
    return localStorage.getItem('canvas-language');
  }

  /**
   * 保存语言设置
   */
  saveLanguage(lang) {
    localStorage.setItem('canvas-language', lang);
  }

  /**
   * 获取系统语言
   */
  getSystemLanguage() {
    const lang = navigator.language || 'en-US';
    // 检查是否支持该语言，不支持则使用 en-US
    return this.messages[lang] ? lang : 'en-US';
  }

  /**
   * 设置当前语言
   */
  setLanguage(lang) {
    if (this.messages[lang]) {
      this.currentLang = lang;
      this.saveLanguage(lang);
      return true;
    }
    return false;
  }

  /**
   * 获取翻译文本
   */
  t(key, params = {}) {
    const messages = this.messages[this.currentLang];
    const template = messages[key] || key;
    return Object.entries(params).reduce((text, [name, value]) => {
      return text.replaceAll(`{${name}}`, value);
    }, template);
  }

  /**
   * 获取所有支持的语言
   */
  getLanguages() {
    return Object.keys(this.messages);
  }

  applyTranslations(root = document) {
    document.documentElement.lang = this.currentLang;

    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = this.t(element.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = this.t(element.dataset.i18nPlaceholder);
    });

    const title = root.querySelector('title');
    if (title) {
      title.textContent = this.t('app.title');
    }
  }
}

// 全局实例
const i18n = new I18n();

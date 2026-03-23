/**
 * 连线模型类
 */

class CanvasEdge {
  constructor(options = {}) {
    this.id = options.id || 'edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.source = options.source; // 源节点ID
    this.target = options.target; // 目标节点ID
    this.type = options.type || 'neutral'; // positive | negative | neutral
    this.hasDelay = options.hasDelay || false;
    this.label = options.label || '';
    this.color = this.getColorByType(options.type);
  }

  /**
   * 根据类型获取颜色
   */
  getColorByType(type) {
    const colors = {
      positive: '#27AE60', // 绿色表示正反馈
      negative: '#E74C3C', // 红色表示负反馈
      neutral: '#95a5a6'   // 灰色表示中立
    };
    return colors[type] || colors.neutral;
  }

  /**
   * 序列化为JSON
   */
  toJSON() {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      type: this.type,
      hasDelay: this.hasDelay,
      label: this.label,
      color: this.color
    };
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    return new CanvasEdge(data);
  }

  /**
   * 获取SVG路径和箭头
   * @param {CanvasNode} sourceNode - 源节点
   * @param {CanvasNode} targetNode - 目标节点
   * @param {number} edgeIndex - 当前边在同一对节点中的索引
   * @param {number} edgeCount - 同一对节点之间的总边数
   * @param {number} curveDirection - 相对于节点对固定方向的曲线方向
   */
  createSVGElement(sourceNode, targetNode, edgeIndex = 0, edgeCount = 1, curveDirection = 1) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'edge');
    g.setAttribute('data-id', this.id);
    g.setAttribute('data-source', this.source);
    g.setAttribute('data-target', this.target);

    // 计算路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    const x1 = sourceNode.x;
    const y1 = sourceNode.y;
    const x2 = targetNode.x;
    const y2 = targetNode.y;

    // 计算方向向量
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // 从节点边缘开始的起点（考虑节点大小）
    const startX = x1 + (sourceNode.width / 2) * Math.cos(angle);
    const startY = y1 + (sourceNode.height / 2) * Math.sin(angle);

    // 到节点边缘结束的终点
    const endX = x2 - (targetNode.width / 2) * Math.cos(angle);
    const endY = y2 - (targetNode.height / 2) * Math.sin(angle);

    // 如果多条边，使用曲线并根据索引偏移
    let pathData;
    if (edgeCount > 1) {
      // 计算曲线控制点的偏移
      // 偏移方向垂直于连线方向
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      
      // 同一对节点的多条边均匀分布到中线两侧
      const center = (edgeCount - 1) / 2;
      const offsetStep = edgeCount === 2 ? dist * 0.18 : dist * 0.12;
      const offset = (edgeIndex - center) * offsetStep * curveDirection;
      
      // 计算控制点
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const controlX = midX + perpX * offset;
      const controlY = midY + perpY * offset;
      
      // 生成二次贝塞尔曲线
      pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    } else {
      // 单条边使用直线
      pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', this.color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', `url(#arrowhead-${this.type})`);
    
    if (this.hasDelay) {
      path.setAttribute('stroke-dasharray', '5,5');
    }

    g.appendChild(path);

    // 添加连线标签
    if (this.label || this.type !== 'neutral') {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      
      let labelX, labelY;
      if (edgeCount > 1) {
        // 对于曲线，标签位置放在控制点附近
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        const center = (edgeCount - 1) / 2;
        const offsetStep = edgeCount === 2 ? dist * 0.18 : dist * 0.12;
        const offset = (edgeIndex - center) * offsetStep * curveDirection;
        
        labelX = midX + perpX * offset * 1.2;
        labelY = midY + perpY * offset * 1.2 - 8;
      } else {
        // 直线情况
        labelX = (startX + endX) / 2;
        labelY = (startY + endY) / 2 - 8;
      }
      
      text.setAttribute('x', labelX);
      text.setAttribute('y', labelY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '14');
      text.setAttribute('fill', this.color);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('pointer-events', 'none');

      const displayParts = [];
      if (this.label) {
        displayParts.push(this.label);
      }
      if (this.type === 'positive') {
        displayParts.push('+');
      }
      if (this.type === 'negative') {
        displayParts.push('-');
      }
      if (this.hasDelay) {
        displayParts.push('//');
      }
      const displayText = displayParts.join(' ');

      text.textContent = displayText;
      g.appendChild(text);
    }

    // 添加交互区域（使用path而不是line，以支持曲线）
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitArea.setAttribute('d', pathData);
    hitArea.setAttribute('stroke', 'transparent');
    hitArea.setAttribute('stroke-width', '12');
    hitArea.setAttribute('fill', 'none');
    hitArea.setAttribute('class', 'edge-hitarea');
    g.appendChild(hitArea);

    // 事件监听
    hitArea.addEventListener('click', (e) => {
      e.stopPropagation();
      window.canvas?.selectEdge(this.id);
    });

    return g;
  }

  /**
   * 创建箭头定义（defs）
   */
  static createArrowMarkerDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    const types = ['positive', 'negative', 'neutral'];
    types.forEach(type => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', `arrowhead-${type}`);
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const colors = {
        positive: '#27AE60',
        negative: '#E74C3C',
        neutral: '#95a5a6'
      };
      polygon.setAttribute('points', '0 0, 10 3, 0 6');
      polygon.setAttribute('fill', colors[type]);

      marker.appendChild(polygon);
      defs.appendChild(marker);
    });

    return defs;
  }
}

window.CanvasEdge = CanvasEdge;

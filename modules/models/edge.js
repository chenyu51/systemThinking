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
    
    const { startX, startY, endX, endY, angle, dist } = this.getAnchoredPoints(sourceNode, targetNode);

    // 如果多条边，使用曲线并根据索引偏移
    let pathData;
    if (edgeCount > 1) {
      // 计算曲线控制点的偏移
      // 偏移方向垂直于连线方向
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      
      // 同一对节点的多条边均匀分布到中线两侧
      const center = (edgeCount - 1) / 2;
      const offsetStep = edgeCount === 2 ? dist * 0.2 : dist * 0.13;
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

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    halo.setAttribute('d', pathData);
    halo.setAttribute('stroke', 'rgba(255,255,255,0.92)');
    halo.setAttribute('stroke-width', '6');
    halo.setAttribute('fill', 'none');
    halo.setAttribute('pointer-events', 'none');
    g.appendChild(halo);
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
      text.setAttribute('x', labelX);
      text.setAttribute('y', labelY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '14');
      text.setAttribute('fill', this.color);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('pointer-events', 'none');
      text.style.userSelect = 'none';
      text.style.webkitUserSelect = 'none';
      const textWidth = Math.max(28, displayText.length * 8 + 12);
      const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      textBg.setAttribute('x', labelX - textWidth / 2);
      textBg.setAttribute('y', labelY - 14);
      textBg.setAttribute('width', textWidth);
      textBg.setAttribute('height', '20');
      textBg.setAttribute('rx', '10');
      textBg.setAttribute('fill', 'rgba(255,255,255,0.92)');
      textBg.setAttribute('stroke', 'rgba(226,232,240,0.95)');
      textBg.setAttribute('stroke-width', '1');
      textBg.setAttribute('pointer-events', 'none');
      g.append(textBg, text);
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
      if (window.canvas?.isClickSuppressed?.()) return;
      e.stopPropagation();
      window.canvas?.selectEdge(this.id);
    });

    return g;
  }

  getAnchoredPoints(sourceNode, targetNode) {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const sourceSide = horizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
    const targetSide = horizontal ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom');
    const sourcePoint = sourceNode.getPortPosition(sourceSide);
    const targetPoint = targetNode.getPortPosition(targetSide);
    const gap = 0;
    const startX = sourcePoint.x + (sourceSide === 'right' ? gap : sourceSide === 'left' ? -gap : 0);
    const startY = sourcePoint.y + (sourceSide === 'bottom' ? gap : sourceSide === 'top' ? -gap : 0);
    const endX = targetPoint.x + (targetSide === 'right' ? gap : targetSide === 'left' ? -gap : 0);
    const endY = targetPoint.y + (targetSide === 'bottom' ? gap : targetSide === 'top' ? -gap : 0);
    const angle = Math.atan2(endY - startY, endX - startX);
    const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    return { startX, startY, endX, endY, angle, dist };
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

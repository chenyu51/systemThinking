/**
 * 节点模型类
 */

class CanvasNode {
  constructor(options = {}) {
    this.id = options.id || 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.type = options.type || 'variable'; // variable | stock | flow
    this.label = options.label || '节点';
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.shape = options.shape || 'rectangle'; // rectangle | circle | diamond
    this.color = options.color || '#4A90E2';
    this.width = options.width || 120;
    this.height = options.height || 60;
    this.description = options.description || '';
  }

  /**
   * 序列化为JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      x: this.x,
      y: this.y,
      shape: this.shape,
      color: this.color,
      width: this.width,
      height: this.height,
      description: this.description
    };
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    return new CanvasNode(data);
  }

  getTypeStyle() {
    const styles = {
      variable: { stroke: '#1F4F82', badgeFill: '#1F4F82', badgeText: '变量', textFill: '#fff' },
      stock: { stroke: '#9C5311', badgeFill: '#9C5311', badgeText: '存量', textFill: '#fff' },
      flow: { stroke: '#0D6B5C', badgeFill: '#0D6B5C', badgeText: '流量', textFill: '#fff' }
    };
    return styles[this.type] || styles.variable;
  }

  createTypeBadge(style) {
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '8');
    bg.setAttribute('y', '8');
    bg.setAttribute('width', '36');
    bg.setAttribute('height', '18');
    bg.setAttribute('rx', '9');
    bg.setAttribute('fill', style.badgeFill);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '26');
    text.setAttribute('y', '17');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '700');
    text.setAttribute('fill', '#fff');
    text.setAttribute('pointer-events', 'none');
    text.textContent = style.badgeText;
    badge.append(bg, text);
    return badge;
  }

  createFlowDecoration(style) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', this.width - 34);
    line.setAttribute('y1', this.height - 16);
    line.setAttribute('x2', this.width - 14);
    line.setAttribute('y2', this.height - 16);
    line.setAttribute('stroke', style.stroke);
    line.setAttribute('stroke-width', '2');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', `${this.width - 14},${this.height - 16} ${this.width - 20},${this.height - 20} ${this.width - 20},${this.height - 12}`);
    arrow.setAttribute('fill', style.stroke);
    group.append(line, arrow);
    return group;
  }

  /**
   * 创建换行文本（当文本过长时）
   */
  createWrappedText(text, maxWidth) {
    // 预估每行最多字符数：每个字符大约占 8-10 个像素
    const charWidth = 9;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    const minCharsPerLine = 4; // 最少4个字符
    const charsPerLine = Math.max(minCharsPerLine, maxCharsPerLine);
    
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length >= charsPerLine || i === text.length - 1) {
        if (i === text.length - 1) {
          lines.push(currentLine);
        } else {
          // 尝试在空格处断行
          const lastSpaceIndex = currentLine.lastIndexOf(' ');
          if (lastSpaceIndex > 0) {
            lines.push(currentLine.substring(0, lastSpaceIndex));
            currentLine = currentLine.substring(lastSpaceIndex + 1);
          } else {
            lines.push(currentLine);
            currentLine = '';
          }
        }
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * 设置带换行的文本元素
   */
  setWrappedText(textElement, label, nodeWidth) {
    // 清除现有内容
    textElement.textContent = '';
    
    const lines = this.createWrappedText(label, nodeWidth - 16);
    
    if (lines.length === 1) {
      // 单行直接设置
      textElement.textContent = lines[0];
    } else {
      // 多行使用 tspan
      const lineHeight = 16;
      const totalHeight = lines.length * lineHeight;
      const startY = -totalHeight / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', textElement.getAttribute('x'));
        tspan.setAttribute('dy', index === 0 ? startY : lineHeight);
        tspan.textContent = line;
        textElement.appendChild(tspan);
      });
    }
  }
  createSVGElement(options = {}) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('data-id', this.id);
    g.setAttribute('data-type', this.type);
    const typeStyle = this.getTypeStyle();

    let shapeElement;

    // 根据形状创建不同的元素
    switch (this.shape) {
      case 'circle':
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shapeElement.setAttribute('cx', this.width / 2);
        shapeElement.setAttribute('cy', this.height / 2);
        shapeElement.setAttribute('r', Math.min(this.width, this.height) / 2);
        break;
      case 'diamond':
        const points = [
          [this.width / 2, 0],
          [this.width, this.height / 2],
          [this.width / 2, this.height],
          [0, this.height / 2]
        ].map(p => p.join(',')).join(' ');
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shapeElement.setAttribute('points', points);
        break;
      case 'rectangle':
      default:
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shapeElement.setAttribute('width', this.width);
        shapeElement.setAttribute('height', this.height);
        shapeElement.setAttribute('rx', 4);
        break;
    }

    shapeElement.setAttribute('fill', this.color);
    shapeElement.setAttribute('stroke', typeStyle.stroke);
    shapeElement.setAttribute('stroke-width', '2');
    shapeElement.setAttribute('class', 'node-shape');

    if (this.type === 'flow') {
      shapeElement.setAttribute('stroke-dasharray', '8 4');
    }

    // 文本标签
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', this.width / 2);
    text.setAttribute('y', this.height / 2 + 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', typeStyle.textFill);
    text.setAttribute('font-size', '15');
    text.setAttribute('font-weight', '500');
    text.setAttribute('pointer-events', 'none');
    text.setAttribute('class', 'node-label');
    this.setWrappedText(text, this.label, this.width);

    // 处理节点类型的特殊标记
    if (this.type === 'stock') {
      // 存量节点用双线框表示
      const innerShape = shapeElement.cloneNode();
      innerShape.setAttribute('stroke', typeStyle.stroke);
      innerShape.setAttribute('stroke-width', '1.5');
      innerShape.setAttribute('fill', 'none');
      const offset = 4;
      if (this.shape === 'rectangle') {
        innerShape.setAttribute('width', this.width - offset * 2);
        innerShape.setAttribute('height', this.height - offset * 2);
        innerShape.setAttribute('x', offset);
        innerShape.setAttribute('y', offset);
      }
      g.appendChild(shapeElement);
      g.appendChild(innerShape);
    } else {
      g.appendChild(shapeElement);
    }

    if (options.showPorts) {
      this.createLinkPorts().forEach((port) => g.appendChild(port));
    }

    g.appendChild(this.createTypeBadge(typeStyle));
    if (this.type === 'flow') g.appendChild(this.createFlowDecoration(typeStyle));
    g.appendChild(text);

    // 设置位置
    g.setAttribute('transform', `translate(${this.x - this.width / 2}, ${this.y - this.height / 2})`);

    // 添加交互事件监听器
    shapeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      window.canvas?.selectNode(this.id);
    });

    return g;
  }

  getPortPosition(side) {
    const positions = {
      top: { x: this.x, y: this.y - this.height / 2 },
      right: { x: this.x + this.width / 2, y: this.y },
      bottom: { x: this.x, y: this.y + this.height / 2 },
      left: { x: this.x - this.width / 2, y: this.y }
    };
    return positions[side] || positions.right;
  }

  createLinkPorts() {
    const portStyle = {
      r: 5,
      fill: '#ffffff',
      stroke: '#4A90E2',
      strokeWidth: '2'
    };

    return ['top', 'right', 'bottom', 'left'].map((side) => {
      const position = this.getPortPosition(side);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'link-port');
      circle.setAttribute('data-node-id', this.id);
      circle.setAttribute('data-side', side);
      circle.setAttribute('cx', position.x - (this.x - this.width / 2));
      circle.setAttribute('cy', position.y - (this.y - this.height / 2));
      circle.setAttribute('r', portStyle.r);
      circle.setAttribute('fill', portStyle.fill);
      circle.setAttribute('stroke', portStyle.stroke);
      circle.setAttribute('stroke-width', portStyle.strokeWidth);
      circle.style.cursor = 'crosshair';
      return circle;
    });
  }
}

window.CanvasNode = CanvasNode;

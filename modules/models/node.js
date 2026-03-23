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

  /**
   * 获取SVG元素
   */
  createSVGElement(options = {}) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('data-id', this.id);
    g.setAttribute('data-type', this.type);

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
    shapeElement.setAttribute('stroke', '#333');
    shapeElement.setAttribute('stroke-width', '2');
    shapeElement.setAttribute('class', 'node-shape');

    if (this.type === 'flow') {
      shapeElement.setAttribute('stroke-dasharray', '8 4');
    }

    // 文本标签
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', this.width / 2);
    text.setAttribute('y', this.height / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', '500');
    text.setAttribute('pointer-events', 'none');
    text.setAttribute('class', 'node-label');
    text.textContent = this.label;

    // 处理节点类型的特殊标记
    if (this.type === 'stock') {
      // 存量节点用双线框表示
      const innerShape = shapeElement.cloneNode();
      innerShape.setAttribute('stroke-width', '1');
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

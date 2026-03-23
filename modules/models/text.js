/**
 * 文本模型类
 */

class CanvasText {
  constructor(options = {}) {
    this.id = options.id || 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.text = options.text || '新文本';
    this.x = options.x || 100;
    this.y = options.y || 100;
    this.color = options.color || '#333333';
    this.fontSize = options.fontSize || 24;
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      x: this.x,
      y: this.y,
      color: this.color,
      fontSize: this.fontSize
    };
  }

  createSVGElement(isSelected = false) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'canvas-text');
    g.setAttribute('data-id', this.id);
    g.setAttribute('transform', `translate(${this.x}, ${this.y})`);

    const paddingX = 14;
    const paddingY = 10;
    const approxWidth = Math.max(80, this.text.length * this.fontSize * 0.6 + paddingX * 2);
    const approxHeight = this.fontSize + paddingY * 2;

    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitArea.setAttribute('x', -approxWidth / 2);
    hitArea.setAttribute('y', -approxHeight / 2);
    hitArea.setAttribute('width', approxWidth);
    hitArea.setAttribute('height', approxHeight);
    hitArea.setAttribute('rx', 8);
    hitArea.setAttribute('fill', isSelected ? 'rgba(255, 215, 0, 0.12)' : 'transparent');
    hitArea.setAttribute('stroke', isSelected ? '#FFD700' : 'transparent');
    hitArea.setAttribute('stroke-width', isSelected ? '2' : '1');
    hitArea.setAttribute('class', 'text-hitarea');
    g.appendChild(hitArea);

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', '0');
    textElement.setAttribute('y', '0');
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'middle');
    textElement.setAttribute('fill', this.color);
    textElement.setAttribute('font-size', String(this.fontSize));
    textElement.setAttribute('font-weight', '500');
    textElement.setAttribute('class', 'text-label');
    textElement.style.userSelect = 'none';
    textElement.textContent = this.text;
    g.appendChild(textElement);

    return g;
  }
}

window.CanvasText = CanvasText;

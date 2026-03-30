function normalizeImportedData(raw, createDefaultData, createDefaultAIInfo) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.canvas && typeof raw.canvas === 'object') {
    const cloned = cloneImportJSON(raw);
    if (!cloned.name && raw.title) cloned.name = raw.title;
    if (!cloned.description && raw.description) cloned.description = raw.description;
    if (!cloned.aiInfo) cloned.aiInfo = buildAIInfoFromRaw(raw, createDefaultAIInfo);
    return cloned;
  }

  const hasGraphShape = Array.isArray(raw.nodes)
    || Array.isArray(raw.edges)
    || Array.isArray(raw.links)
    || Array.isArray(raw.texts);
  if (!hasGraphShape) return null;

  const data = createDefaultData();
  data.name = String(raw.name || raw.title || data.name);
  data.description = String(raw.description || '');
  data.aiInfo = buildAIInfoFromRaw(raw, createDefaultAIInfo);

  const nodeResult = normalizeNodes(raw.nodes || []);
  data.canvas.nodes = nodeResult.nodes;
  data.canvas.edges = normalizeEdges(raw.edges || raw.links || [], nodeResult);
  data.canvas.texts = normalizeTexts(raw.texts || []);
  return data;
}

function buildAIInfoFromRaw(raw, createDefaultAIInfo) {
  const info = {
    ...createDefaultAIInfo(),
    description: String(raw.description || ''),
    goals: toStringArray(raw.goals),
    functions: toStringArray(raw.functions),
    patterns: toStringArray(raw.patterns),
    leveragePoints: toStringArray(raw.leveragePoints)
  };
  if (raw.systemConcepts && typeof raw.systemConcepts === 'object') {
    Object.keys(info.systemConcepts).forEach((key) => {
      info.systemConcepts[key] = toStringArray(raw.systemConcepts[key]);
    });
  }
  return info;
}

function normalizeNodes(rawNodes) {
  const usedIds = new Set();
  const idMap = new Map();
  const labelMap = new Map();
  const nodes = rawNodes
    .filter((item) => item && typeof item === 'object')
    .map((nodeData, index) => {
      const preferredId = typeof nodeData.id === 'string' && nodeData.id && !usedIds.has(nodeData.id)
        ? nodeData.id
        : undefined;
      const type = normalizeNodeType(nodeData.type);
      const shape = normalizeNodeShape(nodeData.shape);
      const x = toFiniteNumber(nodeData.x, 180 + (index % 4) * 220);
      const y = toFiniteNumber(nodeData.y, 120 + Math.floor(index / 4) * 140);
      const node = new CanvasNode({
        id: preferredId,
        label: String(nodeData.label || nodeData.name || `节点 ${index + 1}`),
        x,
        y,
        color: normalizeColor(nodeData.color, '#4A90E2'),
        type,
        shape,
        width: toFiniteNumber(nodeData.width, undefined),
        height: toFiniteNumber(nodeData.height, 60),
        description: String(nodeData.description || '')
      });

      usedIds.add(node.id);
      idMap.set(String(index), node.id);
      if (nodeData.id !== undefined && nodeData.id !== null) idMap.set(String(nodeData.id), node.id);
      if (nodeData.key !== undefined && nodeData.key !== null) idMap.set(String(nodeData.key), node.id);
      if (nodeData.label) labelMap.set(String(nodeData.label), node.id);
      if (nodeData.name) labelMap.set(String(nodeData.name), node.id);
      return node.toJSON();
    });
  return { nodes, idMap, labelMap };
}

function normalizeEdges(rawEdges, nodeResult) {
  const usedIds = new Set();
  return rawEdges
    .filter((item) => item && typeof item === 'object')
    .map((edgeData) => {
      const source = resolveNodeRef(edgeData.source ?? edgeData.from ?? edgeData.start ?? edgeData.u, nodeResult);
      const target = resolveNodeRef(edgeData.target ?? edgeData.to ?? edgeData.end ?? edgeData.v, nodeResult);
      if (!source || !target) return null;
      const preferredId = typeof edgeData.id === 'string' && edgeData.id && !usedIds.has(edgeData.id)
        ? edgeData.id
        : undefined;
      const edge = new CanvasEdge({
        id: preferredId,
        source,
        target,
        type: normalizeEdgeType(edgeData.type || edgeData.polarity),
        hasDelay: !!(edgeData.hasDelay || edgeData.delay),
        label: String(edgeData.label || edgeData.text || '')
      });
      usedIds.add(edge.id);
      return edge.toJSON();
    })
    .filter(Boolean);
}

function normalizeTexts(rawTexts) {
  const usedIds = new Set();
  return rawTexts
    .filter((item) => item && typeof item === 'object')
    .map((textData, index) => {
      const preferredId = typeof textData.id === 'string' && textData.id && !usedIds.has(textData.id)
        ? textData.id
        : undefined;
      const text = new CanvasText({
        id: preferredId,
        text: String(textData.text || textData.label || `说明 ${index + 1}`),
        x: toFiniteNumber(textData.x, 220),
        y: toFiniteNumber(textData.y, 180 + index * 40),
        color: normalizeColor(textData.color, '#333333'),
        fontSize: toFiniteNumber(textData.fontSize, 24)
      });
      usedIds.add(text.id);
      return text.toJSON();
    });
}

function resolveNodeRef(value, nodeResult) {
  if (value === undefined || value === null) return null;
  const key = String(value);
  return nodeResult.idMap.get(key) || nodeResult.labelMap.get(key) || null;
}

function normalizeNodeType(type) {
  return ['variable', 'stock', 'flow'].includes(type) ? type : 'variable';
}

function normalizeNodeShape(shape) {
  return ['rectangle', 'circle', 'diamond'].includes(shape) ? shape : 'rectangle';
}

function normalizeEdgeType(type) {
  return ['positive', 'negative', 'neutral'].includes(type) ? type : 'neutral';
}

function normalizeColor(color, fallback) {
  return typeof color === 'string' && color.trim() ? color : fallback;
}

function toFiniteNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function cloneImportJSON(value) {
  return JSON.parse(JSON.stringify(value));
}

window.normalizeImportedData = normalizeImportedData;

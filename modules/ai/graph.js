function normalizeGraphLabel(label) {
  return String(label || '').trim().toLowerCase();
}

function getCurrentCanvasGraphContext() {
  const nodeById = new Map(store.getNodes().map((node) => [node.id, node]));
  return {
    title: store.data.name || '',
    description: store.data.description || '',
    nodes: store.getNodes().map((node) => ({
      label: node.label,
      type: node.type,
      description: node.description || ''
    })),
    edges: store.getEdges().map((edge) => ({
      source: nodeById.get(edge.source)?.label || edge.source,
      target: nodeById.get(edge.target)?.label || edge.target,
      type: edge.type,
      label: edge.label || '',
      hasDelay: !!edge.hasDelay
    }))
  };
}

function buildAIRequestPrompt(prompt) {
  return [
    `用户需求：${prompt}`,
    '当前画布图如下，请基于它进行补充、合并或重构，并返回合并后的完整图。同时请识别主要模式（patterns）、杠杆点（leveragePoints）和系统思维要素（systemConcepts）：',
    JSON.stringify(getCurrentCanvasGraphContext(), null, 2)
  ].join('\n\n');
}

function buildAIInsightPrompt(prompt) {
  return [
    `分析要求：${prompt || '提取当前画布的标题、描述、关键模式、杠杆点和系统思维要素。'}`,
    '请不要改写图结构，只基于当前画布内容提取说明和系统思维要素：',
    JSON.stringify(getCurrentCanvasGraphContext(), null, 2)
  ].join('\n\n');
}

function normalizeSystemConcepts(concepts = {}) {
  const normalizeList = (value) => Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
  return {
    feedbackLoops: normalizeList(concepts.feedbackLoops),
    stocks: normalizeList(concepts.stocks),
    flows: normalizeList(concepts.flows),
    variables: normalizeList(concepts.variables),
    delays: normalizeList(concepts.delays),
    boundaries: normalizeList(concepts.boundaries),
    archetypes: normalizeList(concepts.archetypes)
  };
}

function mergeAIGraphIntoCanvas(aiResult) {
  const graph = aiResult?.graph;
  if (!graph?.nodes?.length) {
    throw new Error(i18n.t('ai.empty'));
  }

  const labelMap = new Map();
  store.getNodes().forEach((node) => {
    const key = normalizeGraphLabel(node.label);
    if (key && !labelMap.has(key)) labelMap.set(key, node);
  });

  const idMap = {};
  graph.nodes.forEach((nodeData) => {
    const key = normalizeGraphLabel(nodeData.label);
    const existing = key ? labelMap.get(key) : null;
    if (existing) {
      idMap[nodeData.id] = existing.id;
      store.updateNode(existing.id, {
        type: nodeData.type || existing.type,
        color: nodeData.color || existing.color,
        shape: nodeData.shape || existing.shape,
        description: nodeData.description || existing.description || ''
      });
      return;
    }
    const defaults = window.canvas.getNodeTypeDefaults(nodeData.type || 'variable');
    const node = new CanvasNode({
      ...nodeData,
      x: 0,
      y: 0,
      color: nodeData.color || defaults.color,
      shape: nodeData.shape || defaults.shape
    });
    idMap[nodeData.id] = node.id;
    store.addNode(node.toJSON());
    if (key) labelMap.set(key, node.toJSON());
  });

  const edgeSet = new Set(store.getEdges().map((edge) => [edge.source, edge.target, edge.type, edge.label || '', !!edge.hasDelay].join('|')));
  (graph.edges || []).forEach((edgeData) => {
    const source = idMap[edgeData.source];
    const target = idMap[edgeData.target];
    if (!source || !target || source === target) return;
    const edgeKey = [source, target, edgeData.type || 'neutral', edgeData.label || '', !!edgeData.hasDelay].join('|');
    if (edgeSet.has(edgeKey)) return;
    edgeSet.add(edgeKey);
    store.addEdge(new CanvasEdge({
      source,
      target,
      type: edgeData.type || 'neutral',
      label: edgeData.label || '',
      hasDelay: !!edgeData.hasDelay
    }).toJSON());
  });

  store.data.aiInfo = {
    description: graph.description || graph.summary || graph.explanation || aiResult?.meta?.prompt || '',
    patterns: Array.isArray(graph.patterns) ? graph.patterns : [],
    leveragePoints: Array.isArray(graph.leveragePoints) ? graph.leveragePoints : [],
    systemConcepts: normalizeSystemConcepts(graph.systemConcepts),
    prompt: aiResult?.meta?.prompt || '',
    provider: aiResult?.meta?.provider || '',
    model: aiResult?.meta?.model || ''
  };
  store.data.name = graph.title || store.data.name || 'AI 生成图';
  store.data.description = graph.description || graph.summary || graph.explanation || aiResult?.meta?.prompt || '';
  window.canvas.relayoutGraph();
  window.canvas.updateProperties();
  window.canvas.saveHistory();
  window.canvas.persistCanvasState();
  window.canvas.updateStatus(i18n.t('message.aiApplied'));
}

function applyAIInsightToCanvas(aiResult) {
  const graph = aiResult?.graph || {};
  store.data.name = graph.title || store.data.name || 'AI 分析图';
  store.data.description = graph.description || graph.summary || graph.explanation || store.data.description || '';
  store.data.aiInfo = {
    ...(store.data.aiInfo || {}),
    description: graph.description || graph.summary || graph.explanation || store.data.aiInfo?.description || '',
    patterns: Array.isArray(graph.patterns) ? graph.patterns : (store.data.aiInfo?.patterns || []),
    leveragePoints: Array.isArray(graph.leveragePoints) ? graph.leveragePoints : (store.data.aiInfo?.leveragePoints || []),
    systemConcepts: normalizeSystemConcepts(graph.systemConcepts || store.data.aiInfo?.systemConcepts),
    prompt: aiResult?.meta?.prompt || '',
    provider: aiResult?.meta?.provider || '',
    model: aiResult?.meta?.model || ''
  };
  window.canvas.updateProperties();
  window.canvas.persistCanvasState();
  window.canvas.updateStatus(i18n.t('message.aiInsightApplied'));
}

Object.assign(window, { buildAIRequestPrompt, buildAIInsightPrompt, mergeAIGraphIntoCanvas, applyAIInsightToCanvas });

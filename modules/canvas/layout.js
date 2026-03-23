Object.assign(Canvas.prototype, {
  relayoutGraph() {
    const nodes = store.getNodes();
    if (!nodes.length) {
      this.resetView();
      return;
    }

    const graph = this.buildLayoutGraph(nodes, store.getEdges());
    const layers = this.computeNodeLayers(nodes, graph);
    const grouped = this.groupNodesByLayer(nodes, layers);
    const ordered = this.optimizeLayerOrder(grouped, graph);
    this.applyLayerPositions(ordered, graph);

    this.render();
    this.centerGraph();
  },

  buildLayoutGraph(nodes, edges) {
    const outgoing = new Map(nodes.map((node) => [node.id, []]));
    const incoming = new Map(nodes.map((node) => [node.id, []]));
    edges.forEach((edge) => {
      if (!outgoing.has(edge.source) || !incoming.has(edge.target) || edge.source === edge.target) return;
      outgoing.get(edge.source).push(edge.target);
      incoming.get(edge.target).push(edge.source);
    });
    return { outgoing, incoming };
  },

  computeNodeLayers(nodes, graph) {
    const indegree = new Map(nodes.map((node) => [node.id, graph.incoming.get(node.id).length]));
    const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
    const layers = new Map(nodes.map((node) => [node.id, 0]));
    const seen = new Set();
    while (queue.length) {
      const nodeId = queue.shift();
      seen.add(nodeId);
      (graph.outgoing.get(nodeId) || []).forEach((targetId) => {
        layers.set(targetId, Math.max(layers.get(targetId) || 0, (layers.get(nodeId) || 0) + 1));
        indegree.set(targetId, Math.max(0, (indegree.get(targetId) || 0) - 1));
        if ((indegree.get(targetId) || 0) === 0) queue.push(targetId);
      });
    }
    nodes.forEach((node) => {
      if (seen.has(node.id)) return;
      const parents = graph.incoming.get(node.id) || [];
      const parentLayer = parents.length ? Math.max(...parents.map((id) => layers.get(id) || 0)) : 0;
      layers.set(node.id, parentLayer + (parents.length ? 1 : 0));
    });
    return layers;
  },

  groupNodesByLayer(nodes, layers) {
    const grouped = new Map();
    nodes.forEach((node) => {
      const layer = layers.get(node.id) || 0;
      if (!grouped.has(layer)) grouped.set(layer, []);
      grouped.get(layer).push(node.id);
    });
    return grouped;
  },

  optimizeLayerOrder(grouped, graph) {
    const layerKeys = Array.from(grouped.keys()).sort((a, b) => a - b);
    const ordered = new Map(layerKeys.map((layer) => [layer, [...grouped.get(layer)]]));
    const sortLayer = (layer, fixedLayer, neighborsMap) => {
      const fixed = ordered.get(fixedLayer) || [];
      const indexMap = new Map(fixed.map((id, index) => [id, index]));
      ordered.get(layer).sort((a, b) => {
        const aScore = this.getBarycenter(neighborsMap.get(a), indexMap);
        const bScore = this.getBarycenter(neighborsMap.get(b), indexMap);
        return aScore - bScore || String(a).localeCompare(String(b), 'zh-CN');
      });
      this.reduceAdjacentCrossings(layer, fixedLayer, ordered, graph);
    };
    for (let pass = 0; pass < 4; pass += 1) {
      for (let i = 1; i < layerKeys.length; i += 1) sortLayer(layerKeys[i], layerKeys[i - 1], graph.incoming);
      for (let i = layerKeys.length - 2; i >= 0; i -= 1) sortLayer(layerKeys[i], layerKeys[i + 1], graph.outgoing);
    }
    return ordered;
  },

  getBarycenter(neighbors = [], indexMap) {
    const values = (neighbors || []).map((id) => indexMap.get(id)).filter((value) => value !== undefined);
    if (!values.length) return Number.MAX_SAFE_INTEGER;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  },

  reduceAdjacentCrossings(layer, fixedLayer, ordered, graph) {
    const movable = ordered.get(layer);
    const fixed = ordered.get(fixedLayer);
    if (!movable || !fixed || movable.length < 2) return;
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < movable.length - 1; i += 1) {
        const current = this.countAdjacentCrossings(movable, fixed, graph, layer < fixedLayer);
        [movable[i], movable[i + 1]] = [movable[i + 1], movable[i]];
        const swapped = this.countAdjacentCrossings(movable, fixed, graph, layer < fixedLayer);
        if (swapped < current) {
          improved = true;
        } else {
          [movable[i], movable[i + 1]] = [movable[i + 1], movable[i]];
        }
      }
    }
  },

  countAdjacentCrossings(movable, fixed, graph, movableIsSource) {
    const movableIndex = new Map(movable.map((id, index) => [id, index]));
    const fixedIndex = new Map(fixed.map((id, index) => [id, index]));
    const segments = [];
    movable.forEach((nodeId) => {
      const neighbors = movableIsSource ? graph.outgoing.get(nodeId) : graph.incoming.get(nodeId);
      (neighbors || []).forEach((neighborId) => {
        if (!fixedIndex.has(neighborId)) return;
        segments.push([movableIndex.get(nodeId), fixedIndex.get(neighborId)]);
      });
    });
    let crossings = 0;
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const [a1, b1] = segments[i];
        const [a2, b2] = segments[j];
        if ((a1 - a2) * (b1 - b2) < 0) crossings += 1;
      }
    }
    return crossings;
  },

  applyLayerPositions(ordered, graph) {
    const layerKeys = Array.from(ordered.keys()).sort((a, b) => a - b);
    const nodeMap = new Map(store.getNodes().map((node) => [node.id, node]));
    const widestLayerSize = Math.max(...layerKeys.map((layer) => ordered.get(layer).length), 1);
    const baseSpacingX = 280;
    const spacingY = widestLayerSize > 5 ? 132 : 150;
    const xPositions = this.computeLayerXPositions(layerKeys, ordered, graph, baseSpacingX);
    layerKeys.forEach((layer, layerIndex) => {
      const nodeIds = ordered.get(layer);
      const yPositions = this.computeLayerYPositions(nodeIds, layer, ordered, graph, spacingY);
      nodeIds.forEach((nodeId, nodeIndex) => {
        const node = nodeMap.get(nodeId);
        const yNudge = node?.type === 'stock' ? -6 : node?.type === 'flow' ? 6 : 0;
        store.updateNode(nodeId, { x: xPositions[layerIndex], y: yPositions[nodeIndex] + yNudge });
      });
    });
  },

  computeLayerXPositions(layerKeys, ordered, graph, baseSpacingX) {
    const counts = layerKeys.map((layer, index) => {
      if (index === 0) return 0;
      const prevLayer = ordered.get(layerKeys[index - 1]) || [];
      const currentLayer = ordered.get(layer) || [];
      return prevLayer.reduce((sum, nodeId) => sum + (graph.outgoing.get(nodeId) || []).filter((id) => currentLayer.includes(id)).length, 0);
    });
    const widths = counts.map((count) => baseSpacingX + Math.min(120, count * 10));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    const startX = this.baseViewWidth / 2 - totalWidth / 2;
    const positions = [];
    let cursor = startX;
    layerKeys.forEach((_, index) => {
      const width = widths[index];
      positions.push(cursor + width / 2);
      cursor += width;
    });
    return positions;
  },

  computeLayerYPositions(nodeIds, layer, ordered, graph, spacingY) {
    if (nodeIds.length === 1) return [this.baseViewHeight / 2];
    const prevLayerIds = ordered.get(layer - 1) || [];
    const nextLayerIds = ordered.get(layer + 1) || [];
    const prevIndex = new Map(prevLayerIds.map((id, index) => [id, index]));
    const nextIndex = new Map(nextLayerIds.map((id, index) => [id, index]));
    const scores = nodeIds.map((nodeId, index) => {
      const incoming = this.getBarycenter(graph.incoming.get(nodeId), prevIndex);
      const outgoing = this.getBarycenter(graph.outgoing.get(nodeId), nextIndex);
      const score = [incoming, outgoing].filter((value) => Number.isFinite(value) && value < Number.MAX_SAFE_INTEGER)
        .reduce((sum, value, _, values) => sum + value / values.length, 0);
      return Number.isFinite(score) && score > 0 ? score : index;
    });
    const centered = scores.map((score, index) => ({ index, score })).sort((a, b) => a.score - b.score || a.index - b.index);
    const startY = this.baseViewHeight / 2 - ((nodeIds.length - 1) * spacingY) / 2;
    const positions = new Array(nodeIds.length);
    centered.forEach((item, rank) => {
      const wave = rank % 2 === 0 ? -8 : 8;
      positions[item.index] = startY + rank * spacingY + wave;
    });
    return positions;
  }
});

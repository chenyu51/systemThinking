window.ARCHETYPES = {
  limitsToGrowth: {
    name: '成长极限',
    description: '成长停滞：成长因素最终因限制因素而衰减',
    nodes: [{ label: '期望效果', x: 200, y: 100, color: '#FFD700' }, { label: '结果', x: 400, y: 100, color: '#FFD700' }, { label: '实际结果', x: 400, y: 300, color: '#4A90E2' }, { label: '差距', x: 200, y: 300, color: '#E74C3C' }, { label: '限制因素', x: 600, y: 200, color: '#E74C3C' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '加强' }, { source: 1, target: 2, type: 'positive', label: '' }, { source: 0, target: 3, type: 'negative', label: '比较' }, { source: 3, target: 1, type: 'positive', label: '调整' }, { source: 4, target: 2, type: 'negative', label: '限制' }]
  },
  shiftingTheBurden: {
    name: '衰退螺旋',
    description: '转嫁负担：通过权宜之计解决症状，导致根本原因恶化',
    nodes: [{ label: '问题症状', x: 200, y: 150, color: '#E74C3C' }, { label: '权宜之计', x: 100, y: 300, color: '#FFD700' }, { label: '根本原因', x: 400, y: 300, color: '#E74C3C' }, { label: '副作用', x: 300, y: 450, color: '#E74C3C' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '应用' }, { source: 1, target: 0, type: 'negative', label: '缓解' }, { source: 2, target: 0, type: 'positive', label: '恶化' }, { source: 1, target: 2, type: 'negative', label: '遮掩' }, { source: 1, target: 3, type: 'positive', label: '产生' }, { source: 3, target: 2, type: 'positive', label: '加重' }]
  },
  successToSuccessful: {
    name: '成功到失败',
    description: '成功者获得更多资源，导致其他部分衰退',
    nodes: [{ label: 'A的成功', x: 200, y: 150, color: '#51CF66' }, { label: 'A获得资源', x: 100, y: 300, color: '#FFD700' }, { label: 'B获得资源', x: 300, y: 300, color: '#FFD700' }, { label: 'B的衰退', x: 400, y: 450, color: '#E74C3C' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '增加' }, { source: 1, target: 0, type: 'positive', label: '反馈' }, { source: 1, target: 2, type: 'negative', label: '竞争' }, { source: 2, target: 3, type: 'negative', label: '减少' }]
  },
  escalation: {
    name: '竞争升级',
    description: '一方的行动引发另一方的反制，相互升级形成对抗',
    nodes: [{ label: '我的行动', x: 200, y: 150, color: '#4A90E2' }, { label: '对方威胁度', x: 400, y: 150, color: '#E74C3C' }, { label: '对方反制', x: 400, y: 300, color: '#E74C3C' }, { label: '我的威胁度', x: 200, y: 300, color: '#E74C3C' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '增加' }, { source: 1, target: 2, type: 'positive', label: '促进' }, { source: 2, target: 3, type: 'positive', label: '增加' }, { source: 3, target: 0, type: 'positive', label: '正当化' }]
  },
  richGetRicher: {
    name: '富者愈富',
    description: '初始优势导致积累优势，贫富分化扩大',
    nodes: [{ label: '初始资源', x: 150, y: 150, color: '#FFD700' }, { label: '收益率', x: 350, y: 150, color: '#51CF66' }, { label: '累积资源', x: 250, y: 300, color: '#FFD700' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '决定' }, { source: 1, target: 2, type: 'positive', label: '生成' }, { source: 2, target: 0, type: 'positive', label: '反馈' }]
  },
  goalErosion: {
    name: '目标侵蚀',
    description: '目标与现实差距过大时，为消除不适感而降低目标',
    nodes: [{ label: '原始目标', x: 200, y: 100, color: '#FFD700' }, { label: '实际表现', x: 400, y: 100, color: '#4A90E2' }, { label: '不适感', x: 300, y: 250, color: '#E74C3C' }, { label: '调整后目标', x: 200, y: 400, color: '#FFD700' }],
    edges: [{ source: 0, target: 2, type: 'negative', label: '对比' }, { source: 1, target: 2, type: 'positive', label: '' }, { source: 2, target: 3, type: 'negative', label: '压力下降' }, { source: 3, target: 2, type: 'negative', label: '缓解' }]
  },
  fixesThatFail: {
    name: '解决无效',
    description: '短期解决方案会延迟问题并使其最后变得更糟',
    nodes: [{ label: '问题', x: 150, y: 150, color: '#E74C3C' }, { label: '应急解决方案', x: 350, y: 150, color: '#FFD700' }, { label: '根本解决方案', x: 250, y: 350, color: '#51CF66' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '促进' }, { source: 1, target: 0, type: 'negative', label: '缓解' }, { source: 1, target: 2, type: 'negative', label: '延迟' }, { source: 2, target: 0, type: 'negative', label: '解决' }]
  },
  accidentalAdversaries: {
    name: '意外对手',
    description: '两个独立的系统为了各自目标而相互冲突',
    nodes: [{ label: 'A的目标', x: 150, y: 150, color: '#4A90E2' }, { label: 'A的行动', x: 150, y: 300, color: '#FFD700' }, { label: 'B的影响', x: 400, y: 300, color: '#E74C3C' }, { label: 'B的目标', x: 400, y: 150, color: '#4A90E2' }],
    edges: [{ source: 0, target: 1, type: 'positive', label: '促进' }, { source: 1, target: 2, type: 'positive', label: '产生' }, { source: 2, target: 3, type: 'negative', label: '阻碍' }]
  }
};

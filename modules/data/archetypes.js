function node(label, x, y, color, type = 'variable') {
  return { label, x, y, color, type };
}

function edge(source, target, type, label = '') {
  return { source, target, type, label };
}

function concepts(data = {}) {
  return { feedbackLoops: [], stocks: [], flows: [], variables: [], delays: [], boundaries: [], archetypes: [], ...data };
}

function getArchetypeLabel(key, suffix = '') {
  const messageKey = `template.${key}${suffix}`;
  return (window.i18n && typeof i18n.t === 'function' ? i18n.t(messageKey) : '') || window.ARCHETYPES?.[key]?.[(suffix ? 'description' : 'name')] || '';
}

window.getArchetypeDisplayName = (key) => getArchetypeLabel(key);
window.getArchetypeDisplayDescription = (key) => getArchetypeLabel(key, 'Desc');

window.ARCHETYPES = {
  limitsToGrowth: {
    name: '成长极限',
    description: '增长一开始很快，但会被容量、资源或约束因素逐步压住。',
    patterns: ['先快后慢', '边际收益递减', '限制因素显现'],
    leveragePoints: ['识别真正的限制因素', '提前扩容瓶颈', '降低反馈延迟'],
    systemConcepts: concepts({ feedbackLoops: ['增长强化回路', '限制平衡回路'], stocks: ['需求积累', '可用容量'], flows: ['增长流', '约束流'], variables: ['增长率', '限制因素', '实际结果'], delays: ['限制暴露延迟'], boundaries: ['容量边界', '资源边界'], archetypes: ['成长极限'] }),
    nodes: [node('期望效果', 200, 100, '#FFD700'), node('实际结果', 400, 100, '#4A90E2'), node('差距', 200, 300, '#E74C3C'), node('限制因素', 600, 200, '#E74C3C'), node('资源容量', 400, 300, '#9C5311', 'stock'), node('扩张投入', 600, 350, '#0D6B5C', 'flow')],
    edges: [edge(0, 1, 'positive', '目标驱动'), edge(1, 2, 'negative', '形成差距'), edge(2, 0, 'negative', '调整'), edge(0, 4, 'positive', '拉动'), edge(4, 1, 'positive', '支撑'), edge(3, 4, 'negative', '限制'), edge(4, 5, 'positive', '触发'), edge(5, 3, 'negative', '缓解')]
  },
  shiftingTheBurden: {
    name: '转嫁负担',
    description: '用短期补救掩盖症状，长期上却削弱了解决根因的能力。',
    patterns: ['症状缓解快', '根因修复慢', '对权宜之计形成依赖'],
    leveragePoints: ['减少临时补救的吸引力', '加强根因修复', '限制副作用累积'],
    systemConcepts: concepts({ feedbackLoops: ['症状缓解回路', '根因恶化回路'], stocks: ['问题积累', '能力退化'], flows: ['应急处置', '根因修复'], variables: ['症状强度', '副作用', '解决力度'], delays: ['根因修复延迟'], boundaries: ['组织承受边界'], archetypes: ['转嫁负担'] }),
    nodes: [node('问题症状', 200, 150, '#E74C3C'), node('权宜之计', 100, 300, '#FFD700'), node('根本原因', 400, 300, '#E74C3C'), node('副作用', 300, 450, '#E74C3C'), node('长期能力', 500, 450, '#4A90E2', 'stock')],
    edges: [edge(0, 1, 'positive', '驱动'), edge(1, 0, 'negative', '缓解'), edge(2, 0, 'positive', '加剧'), edge(1, 2, 'negative', '遮掩'), edge(1, 3, 'positive', '产生'), edge(3, 2, 'positive', '恶化'), edge(2, 4, 'negative', '消耗'), edge(4, 1, 'negative', '抑制')]
  },
  successToSuccessful: {
    name: '成功到成功',
    description: '已有优势吸引更多资源，最终导致资源进一步向强者集中。',
    patterns: ['优势滚雪球', '资源向赢家集中', '弱势方被持续削弱'],
    leveragePoints: ['重配资源规则', '保护早期弱势方', '限制优势放大'],
    systemConcepts: concepts({ feedbackLoops: ['成功强化回路', '资源挤出回路'], stocks: ['累积资源', '支持能力'], flows: ['资源流入', '资源流出'], variables: ['收益率', '成功程度', '分配倾向'], delays: ['资源重分配延迟'], boundaries: ['资源总量边界'], archetypes: ['成功到成功'] }),
    nodes: [node('A的成功', 200, 150, '#51CF66'), node('A获得资源', 100, 300, '#FFD700'), node('B获得资源', 300, 300, '#FFD700'), node('B的衰退', 400, 450, '#E74C3C'), node('资源池', 250, 120, '#9C5311', 'stock')],
    edges: [edge(0, 1, 'positive', '增加'), edge(1, 0, 'positive', '反馈'), edge(1, 2, 'negative', '竞争'), edge(2, 3, 'negative', '减少'), edge(4, 1, 'positive', '供给'), edge(4, 2, 'positive', '供给')]
  },
  escalation: {
    name: '竞争升级',
    description: '双方为自保而不断加码，结果把原本的防御关系推成对抗关系。',
    patterns: ['相互升级', '安全困境', '威胁感知不断放大'],
    leveragePoints: ['建立共同目标', '降低威胁感知', '引入第三方约束'],
    systemConcepts: concepts({ feedbackLoops: ['升级强化回路', '威慑反制回路'], stocks: ['威胁感知', '对抗强度'], flows: ['加码行动', '反制行动'], variables: ['行动强度', '威胁水平', '防御压力'], delays: ['反应延迟'], boundaries: ['冲突边界'], archetypes: ['竞争升级'] }),
    nodes: [node('我的行动', 200, 150, '#4A90E2'), node('对方威胁度', 400, 150, '#E74C3C'), node('对方反制', 400, 300, '#E74C3C'), node('我的威胁度', 200, 300, '#E74C3C'), node('共同规则', 300, 450, '#9C5311', 'stock')],
    edges: [edge(0, 1, 'positive', '增加'), edge(1, 2, 'positive', '促进'), edge(2, 3, 'positive', '增加'), edge(3, 0, 'positive', '正当化'), edge(4, 0, 'negative', '约束'), edge(4, 2, 'negative', '约束')]
  },
  richGetRicher: {
    name: '富者愈富',
    description: '初始优势会被持续放大，最终形成典型的马太效应。',
    patterns: ['复利积累', '初始差距放大', '强者持续吸走资源'],
    leveragePoints: ['增加起点资源', '降低回报差异', '设置反垄断机制'],
    systemConcepts: concepts({ feedbackLoops: ['累积强化回路'], stocks: ['初始资源', '累积资源'], flows: ['收益流', '增量流'], variables: ['收益率', '资源占有率'], delays: ['收益兑现延迟'], boundaries: ['集中度边界'], archetypes: ['富者愈富'] }),
    nodes: [node('初始资源', 150, 150, '#FFD700', 'stock'), node('收益率', 350, 150, '#51CF66'), node('累积资源', 250, 300, '#FFD700', 'stock'), node('规模优势', 450, 300, '#4A90E2')],
    edges: [edge(0, 1, 'positive', '决定'), edge(1, 2, 'positive', '生成'), edge(2, 0, 'positive', '反馈'), edge(2, 3, 'positive', '放大'), edge(3, 1, 'positive', '提高')]
  },
  goalErosion: {
    name: '目标侵蚀',
    description: '当现实压力过大时，人会下调标准，让目标慢慢变得可接受。',
    patterns: ['标准逐步下降', '短期压力压过长期目标', '结果被重新定义'],
    leveragePoints: ['固定不可谈判底线', '外部对标', '减少目标调整频率'],
    systemConcepts: concepts({ feedbackLoops: ['压力缓解回路', '目标下调回路'], stocks: ['标准水平', '目标承诺'], flows: ['目标调整', '压力释放'], variables: ['不适感', '绩效差距', '标准水平'], delays: ['认知调整延迟'], boundaries: ['绩效底线'], archetypes: ['目标侵蚀'] }),
    nodes: [node('原始目标', 200, 100, '#FFD700'), node('实际表现', 400, 100, '#4A90E2'), node('不适感', 300, 250, '#E74C3C'), node('调整后目标', 200, 400, '#FFD700', 'stock'), node('压力环境', 500, 250, '#9C5311')],
    edges: [edge(0, 2, 'negative', '对比'), edge(1, 2, 'positive', ''), edge(2, 3, 'negative', '压力下降'), edge(3, 2, 'negative', '缓解'), edge(4, 2, 'positive', '放大'), edge(4, 3, 'positive', '推动下调')]
  },
  fixesThatFail: {
    name: '解决无效',
    description: '应急方案可以立刻缓解问题，但副作用和延迟会把问题推向更坏的方向。',
    patterns: ['立刻见效', '后患无穷', '问题周期性复发'],
    leveragePoints: ['限定应急方案寿命', '优先根因修复', '评估副作用成本'],
    systemConcepts: concepts({ feedbackLoops: ['应急缓解回路', '副作用恶化回路'], stocks: ['问题累积', '副作用累积'], flows: ['应急处理', '根因修复'], variables: ['问题强度', '短期效果', '长期后果'], delays: ['根因显现延迟'], boundaries: ['可接受副作用边界'], archetypes: ['解决无效'] }),
    nodes: [node('问题', 150, 150, '#E74C3C'), node('应急解决方案', 350, 150, '#FFD700'), node('根本解决方案', 250, 350, '#51CF66'), node('副作用', 450, 300, '#E74C3C'), node('问题积累', 150, 350, '#9C5311', 'stock')],
    edges: [edge(0, 1, 'positive', '促进'), edge(1, 0, 'negative', '缓解'), edge(1, 2, 'negative', '延迟'), edge(2, 0, 'negative', '解决'), edge(1, 3, 'positive', '产生'), edge(3, 0, 'positive', '反噬'), edge(0, 4, 'positive', '积累')]
  },
  accidentalAdversaries: {
    name: '意外对手',
    description: '两个本来并无冲突的目标，因为相互影响而意外变成对手。',
    patterns: ['协同失败', '无意伤害对方', '局部最优损害整体'],
    leveragePoints: ['识别交叉影响', '共享约束信息', '设计双赢规则'],
    systemConcepts: concepts({ feedbackLoops: ['目标冲突回路'], stocks: ['关系信任', '冲突强度'], flows: ['行动影响', '反制行动'], variables: ['目标一致性', '外部影响'], delays: ['误解累积延迟'], boundaries: ['部门边界', '组织边界'], archetypes: ['意外对手'] }),
    nodes: [node('A的目标', 150, 150, '#4A90E2'), node('A的行动', 150, 300, '#FFD700', 'flow'), node('B的影响', 400, 300, '#E74C3C'), node('B的目标', 400, 150, '#4A90E2'), node('共同边界', 275, 450, '#9C5311')],
    edges: [edge(0, 1, 'positive', '促进'), edge(1, 2, 'positive', '产生'), edge(2, 3, 'negative', '阻碍'), edge(3, 4, 'positive', '定义'), edge(4, 1, 'negative', '约束')]
  },
  growthAndUnderinvestment: {
    name: '成长与投入不足',
    description: '需求增长很快，但投入跟不上，容量不足会反过来限制增长。',
    patterns: ['增长追不上需求', '投入不足形成瓶颈', '质量下降抑制继续增长'],
    leveragePoints: ['提前投资产能', '用预测触发扩容', '监控服务水平'],
    systemConcepts: concepts({ feedbackLoops: ['需求增长回路', '投入不足回路'], stocks: ['现有产能', '未满足需求'], flows: ['订单流', '投资流', '交付流'], variables: ['需求增速', '服务水平', '投资意愿'], delays: ['扩容建设延迟'], boundaries: ['产能边界', '预算边界'], archetypes: ['成长与投入不足'] }),
    nodes: [node('市场需求', 150, 120, '#4A90E2'), node('交付能力', 360, 120, '#51CF66', 'stock'), node('服务质量', 360, 280, '#FFD700'), node('投资决策', 150, 280, '#0D6B5C', 'flow'), node('产能扩张', 550, 120, '#9C5311', 'flow'), node('资金约束', 550, 280, '#E74C3C')],
    edges: [edge(0, 1, 'positive', '拉动'), edge(1, 2, 'positive', '支撑'), edge(2, 0, 'positive', '反馈'), edge(0, 3, 'positive', '触发'), edge(3, 4, 'positive', '支持'), edge(4, 1, 'positive', '提升'), edge(5, 3, 'negative', '抑制'), edge(1, 5, 'negative', '消耗')]
  },
  tragedyOfTheCommons: {
    name: '公地悲剧',
    description: '个体理性使用公共资源，最后把公共资源本身消耗掉。',
    patterns: ['过度使用', '集体失衡', '外部性累积'],
    leveragePoints: ['建立配额和定价', '把外部性显性化', '引入共同治理'],
    systemConcepts: concepts({ feedbackLoops: ['使用强化回路', '资源耗竭回路'], stocks: ['公共资源', '生态余量'], flows: ['个体使用', '资源补给', '资源消耗'], variables: ['使用强度', '集体收益', '治理力度'], delays: ['资源恢复延迟'], boundaries: ['生态承载边界', '配额边界'], archetypes: ['公地悲剧'] }),
    nodes: [node('公共资源', 260, 130, '#51CF66', 'stock'), node('个体使用', 120, 280, '#4A90E2', 'flow'), node('总消耗', 260, 280, '#E74C3C', 'flow'), node('资源剩余', 420, 280, '#9C5311', 'stock'), node('集体收益', 420, 120, '#FFD700'), node('约束规则', 560, 200, '#0D6B5C')],
    edges: [edge(0, 1, 'positive', '吸引'), edge(1, 2, 'positive', '累积'), edge(2, 3, 'negative', '消耗'), edge(3, 0, 'positive', '补给'), edge(3, 4, 'positive', '支撑'), edge(4, 1, 'positive', '刺激'), edge(5, 1, 'negative', '约束'), edge(5, 2, 'negative', '约束')]
  },
  driftToLowPerformance: {
    name: '向低绩效漂移',
    description: '为了减轻压力不断下调标准，长期会把系统拖到更低水平。',
    patterns: ['标准逐步下滑', '慢性滑坡', '底线不断被重写'],
    leveragePoints: ['设定硬底线', '使用外部基准', '把标准调整与短期压力隔离'],
    systemConcepts: concepts({ feedbackLoops: ['标准下调回路', '压力缓解回路'], stocks: ['绩效标准', '组织习惯'], flows: ['标准调整', '压力释放'], variables: ['实际表现', '可接受标准', '外部压力'], delays: ['绩效恶化延迟'], boundaries: ['绩效底线'], archetypes: ['向低绩效漂移'] }),
    nodes: [node('当前标准', 180, 120, '#FFD700', 'stock'), node('实际表现', 380, 120, '#4A90E2'), node('压力', 280, 280, '#E74C3C'), node('下调标准', 180, 420, '#9C5311', 'flow'), node('新标准', 380, 420, '#FFD700', 'stock'), node('外部基准', 560, 280, '#0D6B5C')],
    edges: [edge(0, 2, 'negative', '比较'), edge(1, 2, 'positive', ''), edge(2, 3, 'negative', '缓解'), edge(3, 4, 'positive', '形成'), edge(4, 2, 'negative', '减压'), edge(5, 0, 'negative', '约束'), edge(5, 4, 'negative', '约束')]
  },
  policyResistance: {
    name: '政策阻力',
    description: '干预措施会激起系统自我保护，导致政策效果越来越弱。',
    patterns: ['越改越难', '补丁越补越多', '局部优化引发全局反弹'],
    leveragePoints: ['改系统而不是改局部', '让受影响方参与设计', '减少副作用'],
    systemConcepts: concepts({ feedbackLoops: ['政策推进回路', '系统反制回路'], stocks: ['制度惯性', '反弹强度'], flows: ['政策执行', '反制行动'], variables: ['政策力度', '顺从程度', '副作用'], delays: ['治理反馈延迟'], boundaries: ['制度边界', '组织边界'], archetypes: ['政策阻力'] }),
    nodes: [node('政策措施', 180, 130, '#4A90E2', 'flow'), node('目标行为', 380, 130, '#51CF66'), node('系统反应', 380, 300, '#E74C3C'), node('副作用', 180, 300, '#E74C3C'), node('制度惯性', 560, 220, '#9C5311', 'stock')],
    edges: [edge(0, 1, 'positive', '推动'), edge(1, 2, 'negative', '触发'), edge(2, 3, 'positive', '产生'), edge(3, 0, 'negative', '削弱'), edge(4, 0, 'negative', '抵抗'), edge(4, 2, 'positive', '放大')]
  }
};

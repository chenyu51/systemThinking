let aiAssistantState = null, aiAssistantUI = { prompt: '', logs: [], result: null, error: '', textarea: null, resultBox: null, logBox: null };

async function requestAIGraph(prompt, logger = () => {}) {
  return requestAIJSON({
    logger,
    requestPrompt: buildAIRequestPrompt(prompt),
    systemPrompt: '你是严格遵循系统思维规范的建模助手。请返回 JSON，格式为 {"title":"图标题","description":"图的详细描述","patterns":["模式1"],"leveragePoints":["杠杆点1"],"systemConcepts":{"feedbackLoops":["回路1"],"stocks":["存量1"],"flows":["流量1"],"variables":["变量1"],"delays":["延迟1"],"boundaries":["边界1"],"archetypes":["原型1"]},"nodes":[{"id":"n1","label":"节点","type":"variable","color":"#4A90E2"}],"edges":[{"source":"n1","target":"n2","type":"positive","label":"促进"}]}。必须严格遵守这些规范：1. 节点 type 只能是 variable、stock、flow。2. 存量必须通过流量变化，不能直接被普通变量替代。3. 连线只表达因果影响，type 只能是 positive、negative、neutral。4. 如果存在时间滞后，要在 delays 和边关系中体现。5. patterns 必须是系统行为模式，不是普通总结。6. leveragePoints 必须是可干预的高杠杆位置，不是泛泛建议。7. systemConcepts 必须提取反馈回路、存量、流量、变量、延迟、边界、系统原型。8. 优先形成闭环、回路和存量-流量结构，不要只给线性流程图。9. 节点不超过8个，边不超过12条。'
  }, prompt);
}

async function requestAIInsights(prompt, logger = () => {}) {
  return requestAIJSON({
    logger,
    requestPrompt: buildAIInsightPrompt(prompt),
    systemPrompt: '你是系统思维分析助手。请返回 JSON，格式为 {"title":"图标题","description":"图的详细描述","patterns":["模式1"],"leveragePoints":["杠杆点1"],"systemConcepts":{"feedbackLoops":["回路1"],"stocks":["存量1"],"flows":["流量1"],"variables":["变量1"],"delays":["延迟1"],"boundaries":["边界1"],"archetypes":["原型1"]}}。不要返回 nodes 和 edges。description 要具体，patterns 和 leveragePoints 各返回 2-4 条，systemConcepts 尽量完整提取。'
  }, prompt);
}

async function requestAIAnswer(prompt, logger = () => {}) {
  const result = await requestAI(providerOptions => ({
    ...providerOptions,
    requestPrompt: prompt,
    systemPrompt: '你是系统思维问答助手。请直接回答用户问题，给出清晰、简洁、有结构的中文回答。',
    jsonMode: false
  }), logger);
  return { answer: parseAIText(result.provider, result.raw), raw: result.raw, meta: result.meta };
}

async function requestAIJSON(options, prompt) {
  const result = await requestAI((providerOptions) => ({ ...providerOptions, ...options }), options.logger);
  const graph = parseAIResponse(result.provider, result.raw);
  options.logger?.(i18n.t('ai.stepParsed', { nodes: Array.isArray(graph.nodes) ? graph.nodes.length : 0, edges: Array.isArray(graph.edges) ? graph.edges.length : 0 }));
  return { graph, raw: result.raw, meta: { prompt, provider: result.provider, model: result.model } };
}

async function requestAI(builder, logger = () => {}) {
  const { provider = 'openai', baseUrl, apiKey, model } = await getAIConfig();
  if (!baseUrl || !apiKey || !model) throw new Error(i18n.t('ai.missingConfig'));
  const { requestPrompt, systemPrompt, jsonMode = true } = builder({ provider, baseUrl, apiKey, model });
  logger(i18n.t('ai.stepConfigLoaded', { provider, model }));
  logger(i18n.t('ai.stepRequestReady', { url: baseUrl }));
  const response = await fetch(baseUrl, buildAIRequestOptions(provider, apiKey, model, requestPrompt, systemPrompt, jsonMode));
  logger(i18n.t('ai.stepResponseReceived', { status: response.status }));
  if (!response.ok) {
    const text = await response.text();
    logger(i18n.t('ai.stepRequestFailed'));
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw = await response.json();
  logger(i18n.t('ai.stepParsing'));
  return { raw, provider, model, meta: { provider, model } };
}

function buildAIRequestOptions(provider, apiKey, model, prompt, systemPrompt, jsonMode = true) {
  if (provider === 'anthropic') {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    };
  }
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
      , ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
  };
}

function parseAIResponse(provider, data) {
  if (provider === 'anthropic') {
    const content = Array.isArray(data.content)
      ? data.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n')
      : '{}';
    return JSON.parse(extractJSONText(content));
  }
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(extractJSONText(content));
}

function parseAIText(provider, data) {
  if (provider === 'anthropic') return Array.isArray(data.content) ? data.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n').trim() : '';
  const content = data.choices?.[0]?.message?.content;
  return Array.isArray(content) ? content.map((item) => item.text || '').join('\n').trim() : String(content || '').trim();
}

function extractJSONText(content) {
  const text = String(content || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end >= start) {
    return text.slice(start, end + 1).trim();
  }

  return text || '{}';
}

function applyAIGraphToCanvas(aiResult) {
  mergeAIGraphIntoCanvas(aiResult);
}

function appendAILog(logBox, message) {
  aiAssistantUI.logs.push(message);
  const item = document.createElement('div');
  item.style.cssText = 'padding:6px 8px;border-bottom:1px solid #f0f0f0;line-height:1.5;';
  item.textContent = message;
  logBox.appendChild(item);
  logBox.scrollTop = logBox.scrollHeight;
}

function syncAIAssistantView() {
  const { textarea, resultBox, logBox } = aiAssistantUI;
  if (!textarea || !resultBox || !logBox) return;
  textarea.value = aiAssistantUI.prompt || '';
  logBox.innerHTML = '';
  (aiAssistantUI.logs.length ? aiAssistantUI.logs : [i18n.t('ai.processIdle')]).forEach((message) => logBox.appendChild(Object.assign(document.createElement('div'), {
    style: 'padding:6px 8px;border-bottom:1px solid #f0f0f0;line-height:1.5;', textContent: message
  })));
  if (aiAssistantUI.result) renderAIResultView(resultBox, aiAssistantUI.result);
  else resultBox.textContent = aiAssistantUI.error || i18n.t('ai.empty');
}

async function runAIAction(textarea, resultBox, logBox, requester, onSuccess) {
  try {
    aiAssistantUI.prompt = textarea.value.trim();
    aiAssistantUI.result = null;
    aiAssistantUI.error = '';
    resultBox.textContent = i18n.t('ai.generating');
    aiAssistantUI.logs = [];
    appendAILog(logBox, i18n.t('ai.processIdle'));
    appendAILog(logBox, i18n.t('ai.stepStart'));
    aiAssistantState = await requester(aiAssistantUI.prompt, (message) => appendAILog(aiAssistantUI.logBox || logBox, message));
    aiAssistantUI.result = aiAssistantState;
    onSuccess?.(aiAssistantState);
    renderAIResultView(resultBox, aiAssistantState);
  } catch (error) {
    aiAssistantUI.error = error.message || String(error);
    appendAILog(aiAssistantUI.logBox || logBox, `${i18n.t('ai.stepError')} ${aiAssistantUI.error}`);
    resultBox.textContent = aiAssistantUI.error;
  }
}

function showAIAssistant() {
  const existingMenu = document.querySelector('.ai-assistant-menu');
  if (existingMenu) {
    existingMenu.style.display = 'block';
    return;
  }
  
  const menu = document.createElement('div');
  menu.className = 'ai-assistant-menu';
  menu.style.cssText = 'position:fixed;top:60px;right:0;bottom:30px;width:min(560px,calc(100vw - 24px));background:white;border-left:1px solid #e0e0e0;box-shadow:-12px 0 28px rgba(15,23,42,.12);z-index:2000;overflow:auto;padding:0;display:flex;flex-direction:column;';

  // 头部容器：包含标题和关闭按钮
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 16px 12px;border-bottom:1px solid #e0e0e0;flex-shrink:0;';
  
  const title = document.createElement('div');
  title.style.cssText = 'font-weight:700;color:#0f172a;font-size:16px;';
  title.textContent = i18n.t('ai.title');
  
  const closeButtonHeader = document.createElement('button');
  closeButtonHeader.type = 'button';
  closeButtonHeader.textContent = '✕';
  closeButtonHeader.style.cssText = 'width:28px;height:28px;padding:0;border:1px solid #dbe2ea;border-radius:6px;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.2s ease;';
  closeButtonHeader.onmouseover = () => { closeButtonHeader.style.background = '#f8fafc'; closeButtonHeader.style.color = '#0f172a'; };
  closeButtonHeader.onmouseout = () => { closeButtonHeader.style.background = '#fff'; closeButtonHeader.style.color = '#64748b'; };
  
  header.append(title, closeButtonHeader);
  
  // 内容容器（可滚动）
  const content = document.createElement('div');
  content.style.cssText = 'flex:1;overflow:auto;padding:16px 16px 20px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = i18n.t('ai.promptPlaceholder');
  textarea.style.cssText = 'width:100%;min-height:120px;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:13px;resize:vertical;margin-bottom:12px;';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;';

  const generateButton = document.createElement('button');
  generateButton.type = 'button';
  generateButton.textContent = i18n.t('ai.generate');
  generateButton.style.cssText = 'background:#667eea;color:#fff;flex:1 1 calc(50% - 4px);justify-content:center;';

  const patternButton = document.createElement('button');
  patternButton.type = 'button';
  patternButton.textContent = i18n.t('ai.findPatterns');
  patternButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const leverageButton = document.createElement('button');
  leverageButton.type = 'button';
  leverageButton.textContent = i18n.t('ai.findLeverage');
  leverageButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const extractButton = document.createElement('button');
  extractButton.type = 'button';
  extractButton.textContent = i18n.t('ai.extractInsights');
  extractButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const answerButton = document.createElement('button');
  answerButton.type = 'button';
  answerButton.textContent = i18n.currentLang === 'zh-CN' ? '问答' : 'Q&A';
  answerButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.textContent = i18n.t('ai.apply');
  applyButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const replaceButton = document.createElement('button');
  replaceButton.type = 'button';
  replaceButton.textContent = i18n.t('ai.applyReplace');
  replaceButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const resultBox = document.createElement('div');
  resultBox.style.cssText = 'font-size:12px;color:#666;';
  resultBox.textContent = i18n.t('ai.empty');

  const logBox = document.createElement('div');
  logBox.style.cssText = 'font-size:12px;color:#555;background:#fafafa;border:1px solid #eee;border-radius:8px;max-height:220px;overflow:auto;';
  const logSection = document.createElement('details');
  logSection.open = true;
  logSection.style.cssText = 'border:1px solid #e2e8f0;border-radius:10px;background:#fff;overflow:hidden;margin-top:12px;';
  const logSummary = document.createElement('summary');
  logSummary.textContent = i18n.t('ai.process');
  logSummary.style.cssText = 'cursor:pointer;list-style:none;padding:10px 12px;font-weight:600;color:#0f172a;background:#f8fafc;border-bottom:1px solid #e2e8f0;';
  const logBody = document.createElement('div');
  logBody.style.cssText = 'padding:12px;';
  logBody.appendChild(logBox);
  logSection.append(logSummary, logBody);

  Object.assign(aiAssistantUI, { textarea, resultBox, logBox });
  textarea.oninput = () => { aiAssistantUI.prompt = textarea.value; };
  syncAIAssistantView();
  if (!aiAssistantUI.logs.length && !aiAssistantUI.result && !aiAssistantUI.error) appendAILog(logBox, i18n.t('ai.processIdle'));

  patternButton.onclick = () => {
    textarea.value = `${textarea.value.trim()}\n\n请重点识别当前系统中的关键模式。`.trim();
    aiAssistantUI.prompt = textarea.value;
  };

  leverageButton.onclick = () => {
    textarea.value = `${textarea.value.trim()}\n\n请重点识别当前系统中的关键杠杆点。`.trim();
    aiAssistantUI.prompt = textarea.value;
  };

  extractButton.onclick = () => runAIAction(textarea, resultBox, logBox, requestAIInsights, applyAIInsightToCanvas);
  answerButton.onclick = () => runAIAction(textarea, resultBox, logBox, requestAIAnswer);
  generateButton.onclick = () => runAIAction(textarea, resultBox, logBox, requestAIGraph);

  applyButton.onclick = () => {
    try {
      applyAIGraphToCanvas(aiAssistantState);
      menu.style.display = 'none';
    } catch (error) {
      resultBox.textContent = error.message || String(error);
    }
  };

  replaceButton.onclick = () => {
    try {
      if (!confirm(i18n.t('ai.replaceConfirm'))) return;
      store.clear();
      window.canvas.selectedNodeId = null;
      window.canvas.selectedEdgeId = null;
      window.canvas.selectedTextId = null;
      applyAIGraphToCanvas(aiAssistantState);
      menu.style.display = 'none';
    } catch (error) {
      resultBox.textContent = error.message || String(error);
    }
  };

  closeButtonHeader.onclick = () => {
    menu.style.display = 'none';
  };
  actions.append(generateButton, patternButton, leverageButton, extractButton, answerButton, applyButton, replaceButton);
  content.append(textarea, actions, resultBox, logSection);
  menu.append(header, content);
  menu.addEventListener('click', (event) => event.stopPropagation());
  document.body.appendChild(menu);
}

Object.assign(window, { showAIAssistant });

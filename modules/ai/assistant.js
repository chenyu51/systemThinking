let aiAssistantState = null;

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

async function requestAIJSON(options, prompt) {
  const { provider = 'openai', baseUrl, apiKey, model } = await getAIConfig();
  if (!baseUrl || !apiKey || !model) {
    throw new Error(i18n.t('ai.missingConfig'));
  }

  const { logger = () => {}, requestPrompt, systemPrompt } = options;
  logger(i18n.t('ai.stepConfigLoaded', { provider, model }));
  logger(i18n.t('ai.stepRequestReady', { url: baseUrl }));
  const response = await fetch(baseUrl, buildAIRequestOptions(provider, apiKey, model, requestPrompt, systemPrompt));
  logger(i18n.t('ai.stepResponseReceived', { status: response.status }));

  if (!response.ok) {
    const text = await response.text();
    logger(i18n.t('ai.stepRequestFailed'));
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data = await response.json();
  logger(i18n.t('ai.stepParsing'));
  const graph = parseAIResponse(provider, data);
  logger(i18n.t('ai.stepParsed', { nodes: Array.isArray(graph.nodes) ? graph.nodes.length : 0, edges: Array.isArray(graph.edges) ? graph.edges.length : 0 }));
  return { graph, raw: data, meta: { prompt, provider, model } };
}

function buildAIRequestOptions(provider, apiKey, model, prompt, systemPrompt) {
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
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
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

function buildAIResultView(resultBox, aiResult) {
  resultBox.innerHTML = '';
  const title = document.createElement('div');
  title.style.cssText = 'font-weight:600;color:#333;margin-bottom:8px;';
  title.textContent = i18n.t('ai.result');
  const graphPre = document.createElement('pre');
  graphPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;color:#555;background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;max-height:180px;overflow:auto;margin-bottom:10px;';
  graphPre.textContent = JSON.stringify(aiResult.graph, null, 2);
  const rawTitle = document.createElement('div');
  rawTitle.style.cssText = 'font-weight:600;color:#333;margin-bottom:8px;';
  rawTitle.textContent = i18n.t('ai.rawResponse');
  const rawPre = document.createElement('pre');
  rawPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;color:#555;background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;max-height:220px;overflow:auto;';
  rawPre.textContent = JSON.stringify(aiResult.raw, null, 2);
  resultBox.append(title, graphPre, rawTitle, rawPre);
}

function appendAILog(logBox, message) {
  const item = document.createElement('div');
  item.style.cssText = 'padding:6px 8px;border-bottom:1px solid #f0f0f0;line-height:1.5;';
  item.textContent = message;
  logBox.appendChild(item);
  logBox.scrollTop = logBox.scrollHeight;
}

function showAIAssistant() {
  document.querySelector('.ai-assistant-menu')?.remove();
  const menu = document.createElement('div');
  menu.className = 'ai-assistant-menu';
  menu.style.cssText = 'position:fixed;top:70px;right:260px;background:white;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);z-index:2000;width:420px;max-height:80vh;overflow:auto;padding:16px;';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:600;color:#333;margin-bottom:12px;';
  title.textContent = i18n.t('ai.title');

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

  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.textContent = i18n.t('ai.apply');
  applyButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const replaceButton = document.createElement('button');
  replaceButton.type = 'button';
  replaceButton.textContent = i18n.t('ai.applyReplace');
  replaceButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = i18n.t('ai.close');
  closeButton.style.cssText = 'flex:1 1 calc(50% - 4px);justify-content:center;';

  const resultBox = document.createElement('div');
  resultBox.style.cssText = 'font-size:12px;color:#666;';
  resultBox.textContent = i18n.t('ai.empty');

  const logTitle = document.createElement('div');
  logTitle.style.cssText = 'font-weight:600;color:#333;margin:12px 0 8px;';
  logTitle.textContent = i18n.t('ai.process');

  const logBox = document.createElement('div');
  logBox.style.cssText = 'font-size:12px;color:#555;background:#fafafa;border:1px solid #eee;border-radius:6px;max-height:180px;overflow:auto;';

  function resetLog() {
    logBox.innerHTML = '';
    appendAILog(logBox, i18n.t('ai.processIdle'));
  }

  resetLog();

  patternButton.onclick = () => {
    textarea.value = `${textarea.value.trim()}\n\n请重点识别当前系统中的关键模式。`.trim();
  };

  leverageButton.onclick = () => {
    textarea.value = `${textarea.value.trim()}\n\n请重点识别当前系统中的关键杠杆点。`.trim();
  };

  extractButton.onclick = async () => {
    try {
      resultBox.textContent = i18n.t('ai.generating');
      resetLog();
      appendAILog(logBox, i18n.t('ai.stepStart'));
      aiAssistantState = await requestAIInsights(textarea.value.trim(), (message) => appendAILog(logBox, message));
      applyAIInsightToCanvas(aiAssistantState);
      buildAIResultView(resultBox, aiAssistantState);
    } catch (error) {
      appendAILog(logBox, `${i18n.t('ai.stepError')} ${error.message || String(error)}`);
      resultBox.textContent = error.message || String(error);
    }
  };

  generateButton.onclick = async () => {
    try {
      resultBox.textContent = i18n.t('ai.generating');
      resetLog();
      appendAILog(logBox, i18n.t('ai.stepStart'));
      aiAssistantState = await requestAIGraph(textarea.value.trim(), (message) => appendAILog(logBox, message));
      buildAIResultView(resultBox, aiAssistantState);
    } catch (error) {
      appendAILog(logBox, `${i18n.t('ai.stepError')} ${error.message || String(error)}`);
      resultBox.textContent = error.message || String(error);
    }
  };

  applyButton.onclick = () => {
    try {
      applyAIGraphToCanvas(aiAssistantState);
      menu.remove();
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
      menu.remove();
    } catch (error) {
      resultBox.textContent = error.message || String(error);
    }
  };

  closeButton.onclick = () => menu.remove();
  actions.append(generateButton, patternButton, leverageButton, extractButton, applyButton, replaceButton, closeButton);
  menu.append(title, textarea, actions, resultBox, logTitle, logBox);
  menu.addEventListener('click', (event) => event.stopPropagation());
  document.body.appendChild(menu);
}

Object.assign(window, { showAIAssistant });

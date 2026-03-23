function normalizeAIConfig(aiConfig = {}) {
  const legacyModel = aiConfig.model ? [aiConfig.model] : [];
  const models = Array.from(new Set([...(Array.isArray(aiConfig.models) ? aiConfig.models : []), ...legacyModel].map((item) => String(item || '').trim()).filter(Boolean)));
  const currentModel = aiConfig.currentModel || aiConfig.model || models[0] || '';
  return { ...aiConfig, models, currentModel, model: currentModel };
}

function getAIConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['aiConfig'], (result) => {
      resolve(normalizeAIConfig(result.aiConfig || {}));
    });
  });
}

function saveAIConfig(aiConfig) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ aiConfig }, () => resolve(aiConfig));
  });
}

function buildAISettingsSection() {
  const container = document.createElement('div');
  container.style.cssText = 'padding:0 16px 8px;';

  const providerLabel = document.createElement('div');
  providerLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  providerLabel.textContent = i18n.t('settings.provider');

  const providerSelect = document.createElement('select');
  providerSelect.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';
  providerSelect.innerHTML = `
    <option value="openai">${i18n.t('settings.providerOpenAI')}</option>
    <option value="anthropic">${i18n.t('settings.providerAnthropic')}</option>
  `;

  const baseUrlLabel = document.createElement('div');
  baseUrlLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  baseUrlLabel.textContent = i18n.t('settings.apiBaseUrl');

  const baseUrlInput = document.createElement('input');
  baseUrlInput.type = 'text';
  baseUrlInput.placeholder = 'https://api.openai.com/v1/chat/completions';
  baseUrlInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const apiKeyLabel = document.createElement('div');
  apiKeyLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  apiKeyLabel.textContent = i18n.t('settings.apiKey');

  const apiKeyInput = document.createElement('input');
  apiKeyInput.type = 'password';
  apiKeyInput.placeholder = 'sk-...';
  apiKeyInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const modelLabel = document.createElement('div');
  modelLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  modelLabel.textContent = i18n.t('settings.currentModel');

  const modelSelect = document.createElement('select');
  modelSelect.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const modelListLabel = document.createElement('div');
  modelListLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  modelListLabel.textContent = i18n.t('settings.modelList');

  const modelListInput = document.createElement('textarea');
  modelListInput.className = 'property-input';
  modelListInput.style.cssText = 'width:100%;min-height:84px;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;resize:vertical;';

  function parseModels() {
    return Array.from(new Set(modelListInput.value.split('\n').map((item) => item.trim()).filter(Boolean)));
  }

  function refreshModelOptions(preferredModel = '') {
    const models = parseModels();
    modelSelect.innerHTML = models.map((item) => `<option value="${item}">${item}</option>`).join('');
    if (!models.length) {
      modelSelect.innerHTML = '<option value=""></option>';
      modelSelect.value = '';
      return;
    }
    modelSelect.value = models.includes(preferredModel) ? preferredModel : models[0];
  }

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = i18n.t('settings.saveConfig');
  saveButton.style.cssText = 'width:100%;justify-content:center;background:#667eea;color:#fff;';

  const feedback = document.createElement('div');
  feedback.style.cssText = 'display:none;margin-top:8px;font-size:12px;color:#2f855a;';

  function syncPlaceholder() {
    baseUrlInput.placeholder = providerSelect.value === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://api.openai.com/v1/chat/completions';
  }

  getAIConfig().then((aiConfig) => {
    providerSelect.value = aiConfig.provider || 'openai';
    baseUrlInput.value = aiConfig.baseUrl || '';
    apiKeyInput.value = aiConfig.apiKey || '';
    modelListInput.value = (aiConfig.models || []).join('\n');
    refreshModelOptions(aiConfig.currentModel || aiConfig.model || '');
    syncPlaceholder();
  });

  providerSelect.onchange = syncPlaceholder;
  modelListInput.onchange = () => refreshModelOptions(modelSelect.value);

  saveButton.onclick = async () => {
    const models = parseModels();
    const currentModel = modelSelect.value || models[0] || '';
    await saveAIConfig({
      provider: providerSelect.value,
      baseUrl: baseUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      models,
      currentModel,
      model: currentModel
    });
    feedback.textContent = i18n.t('settings.saveSuccess');
    feedback.style.display = 'block';
    window.canvas?.updateStatus(i18n.t('message.aiConfigSaved'));
  };

  container.append(providerLabel, providerSelect, baseUrlLabel, baseUrlInput, apiKeyLabel, apiKeyInput, modelLabel, modelSelect, modelListLabel, modelListInput, saveButton, feedback);
  return container;
}

Object.assign(window, { getAIConfig, saveAIConfig, buildAISettingsSection });

function buildAISettingsSection() {
  const container = document.createElement('div');
  container.style.cssText = 'padding:0 16px 8px;';
  const state = { config: null, selectedId: '' };

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;';
  const title = document.createElement('div');
  title.style.cssText = 'font-size:12px;color:#666;font-weight:600;';
  title.textContent = i18n.currentLang === 'zh-CN' ? '模型提供商' : 'Model Providers';
  const buttonRow = document.createElement('div');
  buttonRow.style.cssText = 'display:flex;gap:6px;';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = i18n.currentLang === 'zh-CN' ? '新增' : 'Add';
  addButton.style.cssText = 'padding:6px 10px;background:#eef2ff;color:#4338ca;justify-content:center;';
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = i18n.currentLang === 'zh-CN' ? '删除' : 'Delete';
  deleteButton.style.cssText = 'padding:6px 10px;background:#fff1f2;color:#be123c;justify-content:center;';
  buttonRow.append(addButton, deleteButton);
  header.append(title, buttonRow);

  const providerListLabel = document.createElement('div');
  providerListLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  providerListLabel.textContent = i18n.currentLang === 'zh-CN' ? '当前提供商' : 'Current Provider';

  const providerSelect = document.createElement('select');
  providerSelect.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const nameLabel = document.createElement('div');
  nameLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  nameLabel.textContent = i18n.currentLang === 'zh-CN' ? '提供商名称' : 'Provider Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const providerTypeLabel = document.createElement('div');
  providerTypeLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  providerTypeLabel.textContent = i18n.t('settings.provider');
  const providerTypeSelect = document.createElement('select');
  providerTypeSelect.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';
  providerTypeSelect.innerHTML = `
    <option value="openai">${i18n.t('settings.providerOpenAI')}</option>
    <option value="anthropic">${i18n.t('settings.providerAnthropic')}</option>
  `;

  const baseUrlLabel = document.createElement('div');
  baseUrlLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  baseUrlLabel.textContent = i18n.t('settings.apiBaseUrl');
  const baseUrlInput = document.createElement('input');
  baseUrlInput.type = 'text';
  baseUrlInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;';

  const apiKeyLabel = document.createElement('div');
  apiKeyLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:6px;';
  apiKeyLabel.textContent = i18n.t('settings.apiKey');
  const apiKeyInput = document.createElement('input');
  apiKeyInput.type = 'password';
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
  modelListInput.style.cssText = 'width:100%;min-height:84px;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;margin-bottom:10px;resize:vertical;';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = i18n.t('settings.saveConfig');
  saveButton.style.cssText = 'width:100%;justify-content:center;background:#667eea;color:#fff;';

  const feedback = document.createElement('div');
  feedback.style.cssText = 'display:none;margin-top:8px;font-size:12px;color:#2f855a;';

  function providerLabel(profile) {
    const name = profile.name || profile.provider || '';
    const type = profile.provider === 'anthropic' ? i18n.t('settings.providerAnthropic') : i18n.t('settings.providerOpenAI');
    return `${name || type} · ${type}`;
  }

  function parseModels() {
    return Array.from(new Set(modelListInput.value.split('\n').map((item) => item.trim()).filter(Boolean)));
  }

  function currentProfile() {
    return state.config?.providers?.find((item) => item.id === state.selectedId) || state.config?.providers?.[0] || null;
  }

  function syncPlaceholder() {
    baseUrlInput.placeholder = providerTypeSelect.value === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://api.openai.com/v1/chat/completions';
  }

  function syncModelOptions(preferredModel = '') {
    const models = parseModels();
    modelSelect.innerHTML = models.map((item) => `<option value="${item}">${item}</option>`).join('');
    if (!models.length) {
      modelSelect.innerHTML = '<option value=""></option>';
      modelSelect.value = '';
      return;
    }
    modelSelect.value = models.includes(preferredModel) ? preferredModel : models[0];
  }

  function syncProfileList() {
    const config = state.config || { providers: [], currentProviderId: '' };
    providerSelect.innerHTML = config.providers.map((profile) => `<option value="${profile.id}">${providerLabel(profile)}</option>`).join('');
    providerSelect.value = state.selectedId || config.currentProviderId || config.providers[0]?.id || '';
    deleteButton.disabled = (config.providers || []).length <= 1;
  }

  function commitCurrentProfile() {
    const profile = currentProfile();
    if (!profile || !state.config) return;
    profile.name = nameInput.value.trim() || profile.name;
    profile.provider = providerTypeSelect.value;
    profile.baseUrl = baseUrlInput.value.trim();
    profile.models = parseModels();
    profile.currentModel = modelSelect.value || profile.models[0] || '';
    profile.model = profile.currentModel;
    state.config.apiKeys = state.config.apiKeys || {};
    state.config.apiKeys[profile.id] = apiKeyInput.value.trim();
  }

  function loadProfile(profile) {
    if (!profile) return;
    state.selectedId = profile.id;
    nameInput.value = profile.name || '';
    providerTypeSelect.value = profile.provider || 'openai';
    baseUrlInput.value = profile.baseUrl || '';
    apiKeyInput.value = state.config?.apiKeys?.[profile.id] || '';
    modelListInput.value = (profile.models || []).join('\n');
    syncPlaceholder();
    syncModelOptions(profile.currentModel || profile.model || '');
    syncProfileList();
  }

  function refreshDraft(config) {
    state.config = normalizeAIConfig(config || {});
    state.selectedId = state.config.currentProviderId || state.config.providers[0]?.id || '';
    syncProfileList();
    loadProfile(currentProfile());
  }

  getAIConfig().then(refreshDraft);

  providerSelect.onchange = () => {
    commitCurrentProfile();
    state.selectedId = providerSelect.value;
    loadProfile(currentProfile());
  };
  providerTypeSelect.onchange = () => {
    syncPlaceholder();
  };
  modelListInput.onchange = () => {
    const preferred = modelSelect.value;
    syncModelOptions(preferred);
  };
  addButton.onclick = () => {
    commitCurrentProfile();
    const nextId = `provider_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.config.providers.push(normalizeProviderProfile({ id: nextId, name: i18n.currentLang === 'zh-CN' ? '新提供商' : 'New Provider' }));
    state.config.currentProviderId = nextId;
    state.selectedId = nextId;
    state.config.apiKeys[nextId] = '';
    syncProfileList();
    loadProfile(currentProfile());
  };
  deleteButton.onclick = () => {
    const config = state.config;
    if (!config || config.providers.length <= 1) return;
    const current = currentProfile();
    const nextProviders = config.providers.filter((item) => item.id !== current.id);
    delete config.apiKeys[current.id];
    config.providers = nextProviders;
    config.currentProviderId = nextProviders[0].id;
    state.selectedId = nextProviders[0].id;
    syncProfileList();
    loadProfile(currentProfile());
  };

  saveButton.onclick = async () => {
    commitCurrentProfile();
    const selected = currentProfile();
    const merged = normalizeAIConfig({
      providers: state.config.providers,
      currentProviderId: selected?.id || state.selectedId,
      apiKeys: state.config.apiKeys,
      apiKey: state.config.apiKeys[selected?.id || state.selectedId] || ''
    });
    await saveAIConfig(merged);
    feedback.textContent = i18n.t('settings.saveSuccess');
    feedback.style.display = 'block';
    window.canvas?.updateStatus(i18n.t('message.aiConfigSaved'));
  };

  container.append(
    header,
    providerListLabel,
    providerSelect,
    nameLabel,
    nameInput,
    providerTypeLabel,
    providerTypeSelect,
    baseUrlLabel,
    baseUrlInput,
    apiKeyLabel,
    apiKeyInput,
    modelLabel,
    modelSelect,
    modelListLabel,
    modelListInput,
    saveButton,
    feedback
  );
  return container;
}

Object.assign(window, { buildAISettingsSection });

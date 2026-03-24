function normalizeAIConfig(aiConfig = {}) {
  const providers = Array.isArray(aiConfig.providers) ? aiConfig.providers : [];
  const legacyModel = aiConfig.model ? [aiConfig.model] : [];
  const models = Array.from(new Set([...(Array.isArray(aiConfig.models) ? aiConfig.models : []), ...legacyModel].map((item) => String(item || '').trim()).filter(Boolean)));
  const currentModel = aiConfig.currentModel || aiConfig.model || models[0] || '';
  const currentProviderId = aiConfig.currentProviderId || providers[0]?.id || 'default';
  const normalizedProviders = normalizeProviders(providers, aiConfig);
  const currentProvider = normalizedProviders.find((item) => item.id === currentProviderId) || normalizedProviders[0] || null;
  const apiKeys = normalizeApiKeys(aiConfig.apiKeys || {});
  const apiKey = apiKeys[currentProvider?.id || currentProviderId] || aiConfig.apiKey || '';
  if (currentProvider && apiKey && !apiKeys[currentProvider.id]) apiKeys[currentProvider.id] = apiKey;
  return {
    ...aiConfig,
    providers: normalizedProviders,
    currentProviderId: currentProvider?.id || currentProviderId,
    currentProvider,
    provider: currentProvider?.provider || aiConfig.provider || 'openai',
    baseUrl: currentProvider?.baseUrl || aiConfig.baseUrl || '',
    models: currentProvider?.models || models,
    currentModel: currentProvider?.currentModel || currentModel,
    model: currentProvider?.currentModel || currentModel,
    apiKeys,
    apiKey
  };
}

async function getAIConfig() {
  const [syncResult, localConfigResult, localKeyResult] = await Promise.all([
    storageGet(['aiConfig']),
    storageGet(['aiConfig'], false),
    storageGetArea(['aiApiKey', 'aiApiKeys'], 'local')
  ]);
  const syncConfig = normalizeAIConfig(syncResult.aiConfig || {});
  const localConfig = normalizeAIConfig(localConfigResult.aiConfig || {});
  const localApiKeys = normalizeApiKeys(localKeyResult.aiApiKeys || {});
  if (localKeyResult.aiApiKey) {
    const keyId = localConfig.currentProviderId || syncConfig.currentProviderId || localConfig.currentProvider?.id || syncConfig.currentProvider?.id || 'default';
    if (!localApiKeys[keyId]) localApiKeys[keyId] = localKeyResult.aiApiKey;
  }
  const merged = normalizeAIConfig({ ...syncConfig, ...localConfig, apiKeys: { ...syncConfig.apiKeys, ...localConfig.apiKeys, ...localApiKeys }, apiKey: localKeyResult.aiApiKey || localConfig.apiKey || syncConfig.apiKey || '' });
  return merged;
}

async function saveAIConfig(aiConfig) {
  const normalized = normalizeAIConfig(aiConfig);
  const { apiKey = '', apiKeys = {}, currentProvider, ...syncConfig } = normalized;
  const nextApiKeys = { ...apiKeys };
  const currentId = syncConfig.currentProviderId || normalized.currentProvider?.id || 'default';
  if (apiKey) nextApiKeys[currentId] = apiKey;
  await storageSetArea({ aiConfig: syncConfig }, 'sync');
  await storageSetArea({ aiConfig: syncConfig, aiApiKeys: nextApiKeys, aiApiKey: nextApiKeys[currentId] || '' }, 'local');
  return normalized;
}

async function syncAIConfigToCloud() {
  const aiConfig = await getAIConfig();
  await saveAIConfig(aiConfig);
  return aiConfig;
}

async function pullAIConfigFromCloud() {
  const [syncResult, localKeyResult] = await Promise.all([
    storageGetArea(['aiConfig'], 'sync'),
    storageGetArea(['aiApiKey', 'aiApiKeys'], 'local')
  ]);
  const remoteConfig = normalizeAIConfig(syncResult.aiConfig || {});
  const hasRemoteConfig = !!(remoteConfig.provider || remoteConfig.baseUrl || remoteConfig.models.length || remoteConfig.currentModel || remoteConfig.model);
  if (!hasRemoteConfig) {
    return normalizeAIConfig({
      ...(normalizeAIConfig((await getAIConfig()) || {})),
      apiKeys: normalizeApiKeys(localKeyResult.aiApiKeys || {}),
      apiKey: localKeyResult.aiApiKey || ''
    });
  }
  const localApiKeys = normalizeApiKeys(localKeyResult.aiApiKeys || {});
  if (localKeyResult.aiApiKey) {
    const keyId = remoteConfig.currentProviderId || remoteConfig.currentProvider?.id || 'default';
    if (!localApiKeys[keyId]) localApiKeys[keyId] = localKeyResult.aiApiKey;
  }
  const merged = normalizeAIConfig({ ...remoteConfig, apiKeys: { ...remoteConfig.apiKeys, ...localApiKeys }, apiKey: localKeyResult.aiApiKey || remoteConfig.apiKey || '' });
  const { apiKey: nextApiKey = '', apiKeys: nextApiKeys = {}, ...syncConfig } = merged;
  const currentId = syncConfig.currentProviderId || merged.currentProvider?.id || 'default';
  await storageSetArea({ aiConfig: syncConfig }, 'sync');
  await storageSetArea({ aiConfig: syncConfig, aiApiKeys: nextApiKeys, aiApiKey: nextApiKeys[currentId] || nextApiKey }, 'local');
  return merged;
}
function normalizeProviders(providers = [], aiConfig = {}) {
  const merged = Array.isArray(providers) ? providers : [];
  if (merged.length) return merged.map((provider, index) => normalizeProviderProfile(provider, index));
  const legacy = aiConfig.provider || aiConfig.baseUrl || aiConfig.models || aiConfig.currentModel
    ? [{
      id: aiConfig.currentProviderId || 'default',
      name: aiConfig.providerName || '',
      provider: aiConfig.provider || 'openai',
      baseUrl: aiConfig.baseUrl || '',
      models: aiConfig.models || [],
      currentModel: aiConfig.currentModel || aiConfig.model || ''
    }]
    : [];
  const normalized = [...legacy].map((provider, index) => normalizeProviderProfile(provider, index));
  return normalized.length ? normalized : [normalizeProviderProfile({ id: 'default', name: 'OpenAI', provider: 'openai' })];
}

function normalizeProviderProfile(provider = {}, index = 0) {
  const models = Array.from(new Set([...(Array.isArray(provider.models) ? provider.models : []), ...(provider.model ? [provider.model] : [])].map((item) => String(item || '').trim()).filter(Boolean)));
  const currentModel = provider.currentModel || provider.model || models[0] || '';
  return {
    id: provider.id || `provider_${index}_${Date.now()}`,
    name: provider.name || (provider.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'),
    provider: provider.provider || 'openai',
    baseUrl: provider.baseUrl || '',
    models,
    currentModel,
    model: currentModel
  };
}

function normalizeApiKeys(apiKeys = {}) {
  return apiKeys && typeof apiKeys === 'object' && !Array.isArray(apiKeys) ? { ...apiKeys } : {};
}

Object.assign(window, { getAIConfig, saveAIConfig, syncAIConfigToCloud, pullAIConfigFromCloud, normalizeAIConfig, normalizeProviderProfile, normalizeProviders, normalizeApiKeys });

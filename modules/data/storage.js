function getChromeStorageArea(preferSync = true) {
  if (preferSync && chrome?.storage?.sync) return chrome.storage.sync;
  if (chrome?.storage?.local) return chrome.storage.local;
  return null;
}

const STORAGE_CHUNK_SIZE = 6000;
const STORAGE_CHUNK_LIMIT = 200;

function normalizeStorageKeys(keys) {
  if (Array.isArray(keys)) return keys;
  if (typeof keys === 'string') return [keys];
  return [];
}

function storageGetArea(keys, areaName = 'sync') {
  const normalizedKeys = normalizeStorageKeys(keys);
  return new Promise((resolve) => {
    const area = chrome?.storage?.[areaName] || null;
    if (!area) {
      resolve({});
      return;
    }
    if (areaName !== 'sync') {
      area.get(keys, (result) => resolve(result || {}));
      return;
    }
    const metaKeys = normalizedKeys.map((key) => `${key}__meta`);
    area.get([...normalizedKeys, ...metaKeys], (result) => {
      const output = result || {};
      const chunkedKeys = normalizedKeys.filter((key) => output[`${key}__meta`]?.chunked);
      if (!chunkedKeys.length) {
        normalizedKeys.forEach((key) => delete output[`${key}__meta`]);
        resolve(output);
        return;
      }
      const partKeys = [];
      chunkedKeys.forEach((key) => {
        const meta = output[`${key}__meta`];
        for (let index = 0; index < (meta?.parts || 0); index += 1) {
          partKeys.push(`${key}__part_${index}`);
        }
      });
      area.get(partKeys, (partResult) => {
        chunkedKeys.forEach((key) => {
          const meta = output[`${key}__meta`];
          const serialized = Array.from({ length: meta?.parts || 0 }, (_, index) => partResult[`${key}__part_${index}`] || '').join('');
          try {
            output[key] = JSON.parse(serialized);
          } catch (error) {
            console.error(`Failed to parse chunked storage value for ${key}:`, error);
            output[key] = undefined;
          }
          delete output[`${key}__meta`];
          for (let index = 0; index < (meta?.parts || 0); index += 1) {
            delete output[`${key}__part_${index}`];
          }
        });
        normalizedKeys.forEach((key) => delete output[`${key}__meta`]);
        resolve(output);
      });
    });
  });
}

function removeStorageKeys(area, keys) {
  return new Promise((resolve) => {
    if (!area || !keys.length) {
      resolve();
      return;
    }
    area.remove(keys, () => {
      void chrome.runtime?.lastError;
      resolve();
    });
  });
}

function setStorageItems(area, items) {
  return new Promise((resolve, reject) => {
    if (!area) {
      resolve();
      return;
    }
    area.set(items, () => {
      const error = chrome.runtime?.lastError;
      if (error) {
        reject(new Error(error.message || 'Storage set failed'));
        return;
      }
      resolve();
    });
  });
}

async function storageSetArea(items, areaName = 'sync') {
  const area = chrome?.storage?.[areaName] || null;
  if (!area) return items;
  if (areaName !== 'sync') {
    await setStorageItems(area, items);
    return items;
  }
  const keys = Object.keys(items || {});
  const payload = {};
  const staleKeys = [];
  keys.forEach((key) => {
    const value = items[key];
    const serialized = JSON.stringify(value);
    staleKeys.push(key, `${key}__meta`);
    for (let index = 0; index < STORAGE_CHUNK_LIMIT; index += 1) {
      staleKeys.push(`${key}__part_${index}`);
    }
    if (serialized.length <= STORAGE_CHUNK_SIZE) {
      payload[key] = value;
      return;
    }
    const chunkCount = Math.ceil(serialized.length / STORAGE_CHUNK_SIZE);
    payload[`${key}__meta`] = { chunked: true, parts: chunkCount };
    for (let index = 0; index < chunkCount; index += 1) {
      payload[`${key}__part_${index}`] = serialized.slice(index * STORAGE_CHUNK_SIZE, (index + 1) * STORAGE_CHUNK_SIZE);
    }
  });
  await setStorageItems(area, payload);
  const payloadKeys = new Set(Object.keys(payload));
  await removeStorageKeys(area, staleKeys.filter((key) => !payloadKeys.has(key)));
  return items;
}

async function storageGet(keys, preferSync = true) {
  const normalizedKeys = normalizeStorageKeys(keys);
  if (!preferSync) return storageGetArea(normalizedKeys, 'local');
  const syncResult = await storageGetArea(normalizedKeys, 'sync');
  const hasValues = normalizedKeys.some((key) => syncResult[key] !== undefined);
  if (hasValues) return syncResult;
  const localResult = await storageGetArea(normalizedKeys, 'local');
  return localResult || syncResult || {};
}

async function storageSet(items, preferSync = true) {
  if (!preferSync) {
    await storageSetArea(items, 'local');
    return items;
  }
  await storageSetArea(items, 'sync');
  await storageSetArea(items, 'local');
  return items;
}

window.getChromeStorageArea = getChromeStorageArea;
window.storageGetArea = storageGetArea;
window.storageSetArea = storageSetArea;
window.storageGet = storageGet;
window.storageSet = storageSet;

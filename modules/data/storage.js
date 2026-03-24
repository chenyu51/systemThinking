function getChromeStorageArea(preferSync = true) {
  if (preferSync && chrome?.storage?.sync) return chrome.storage.sync;
  if (chrome?.storage?.local) return chrome.storage.local;
  return null;
}

function storageGetArea(keys, areaName = 'sync') {
  return new Promise((resolve) => {
    const area = chrome?.storage?.[areaName] || null;
    if (!area) {
      resolve({});
      return;
    }
    area.get(keys, (result) => resolve(result || {}));
  });
}

function storageSetArea(items, areaName = 'sync') {
  return new Promise((resolve) => {
    const area = chrome?.storage?.[areaName] || null;
    if (!area) {
      resolve(items);
      return;
    }
    area.set(items, () => resolve(items));
  });
}

function storageGet(keys, preferSync = true) {
  return new Promise((resolve) => {
    const syncArea = preferSync ? chrome?.storage?.sync : null;
    const localArea = chrome?.storage?.local || null;
    if (!syncArea) {
      localArea?.get(keys, (result) => resolve(result || {}));
      return;
    }
    syncArea.get(keys, (syncResult) => {
      const hasValues = syncResult && Object.values(syncResult).some((value) => value !== undefined);
      if (!chrome.runtime?.lastError && hasValues) {
        resolve(syncResult);
        return;
      }
      if (localArea) {
        localArea.get(keys, (localResult) => resolve(localResult || syncResult || {}));
        return;
      }
      resolve(syncResult || {});
    });
  });
}

function storageSet(items, preferSync = true) {
  return new Promise((resolve) => {
    const syncArea = preferSync ? chrome?.storage?.sync : null;
    const localArea = chrome?.storage?.local || null;
    const finish = () => resolve(items);
    if (!syncArea) {
      if (localArea) {
        localArea.set(items, finish);
      } else {
        finish();
      }
      return;
    }
    syncArea.set(items, () => {
      if (localArea) {
        localArea.set(items, finish);
      } else {
        finish();
      }
    });
  });
}

window.getChromeStorageArea = getChromeStorageArea;
window.storageGetArea = storageGetArea;
window.storageSetArea = storageSetArea;
window.storageGet = storageGet;
window.storageSet = storageSet;

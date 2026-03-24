function getChromeStorageArea(preferSync = true) {
  if (preferSync && chrome?.storage?.sync) return chrome.storage.sync;
  if (chrome?.storage?.local) return chrome.storage.local;
  return null;
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
window.storageGet = storageGet;
window.storageSet = storageSet;

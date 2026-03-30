const storeDataUtils = {
  cloneJSON(value) {
    return JSON.parse(JSON.stringify(value));
  },

  parseTime(value) {
    return Date.parse(value || '') || 0;
  },

  mergeCollectionById(localItems = [], remoteItems = []) {
    const map = new Map();
    [...localItems, ...remoteItems].forEach((item) => {
      if (!item?.id) return;
      const existing = map.get(item.id);
      if (!existing || this.parseTime(item.updated) >= this.parseTime(existing.updated)) {
        map.set(item.id, this.cloneJSON(item));
      }
    });
    return [...map.values()];
  },

  pickLatestRecord(localRecord, remoteRecord) {
    if (!localRecord) return remoteRecord ? this.cloneJSON(remoteRecord) : null;
    if (!remoteRecord) return this.cloneJSON(localRecord);
    return this.parseTime(remoteRecord.updated) >= this.parseTime(localRecord.updated)
      ? this.cloneJSON(remoteRecord)
      : this.cloneJSON(localRecord);
  },

  getAutoNodeWidth(label, shape = 'rectangle', type = 'variable', minWidth = 120) {
    if (shape !== 'rectangle') return Math.max(minWidth || 120, 120);
    const text = String(label || '');
    const charWidth = /[^\x00-\xff]/.test(text) ? 18 : 9;
    const coreWidth = 64 + Math.ceil(text.length * charWidth);
    const badgePadding = type === 'variable' ? 0 : 26;
    return Math.max(minWidth || 120, coreWidth + badgePadding);
  }
};

window.storeDataUtils = storeDataUtils;

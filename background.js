/**
 * SystemCanvas - Background Service Worker
 * 处理插件级别的事件和存储管理
 */

// 监听插件安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 打开欢迎页面
    chrome.tabs.create({ url: 'panel/index.html' });
  }
});

// 处理消息（用于popup与主页面通信）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorageData') {
    chrome.storage.local.get(['canvas'], (result) => {
      sendResponse({ data: result.canvas });
    });
    return true; // 保持通道开放以异步响应
  }
});

console.log('SystemCanvas background service worker loaded');

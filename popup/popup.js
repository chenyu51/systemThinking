/**
 * Popup 脚本 - 处理快速入口菜单
 */

function openCanvas() {
  // 打开主画布面板
  chrome.tabs.create({ url: chrome.runtime.getURL('panel/index.html') });
  window.close();
}

function openRecent() {
  // 打开主画布面板，自动加载最近的画布
  chrome.tabs.create({ 
    url: chrome.runtime.getURL('panel/index.html?mode=recent') 
  });
  window.close();
}

function openTemplates() {
  // 打开模板选择页面（MVP版本暂不实现）
  openCanvas();
  window.close();
}

// 页面加载时初始化事件监听和检查最近的画布
document.addEventListener('DOMContentLoaded', () => {
  // 绑定按钮事件
  document.getElementById('popupBtnNew')?.addEventListener('click', openCanvas);
  document.getElementById('popupBtnRecent')?.addEventListener('click', openRecent);
  document.getElementById('popupBtnTemplates')?.addEventListener('click', openTemplates);
  
  // 检查是否有最近的画布
  chrome.storage.local.get(['canvas'], (result) => {
    if (result.canvas && result.canvas.updated) {
      const button = document.querySelector('.btn-secondary');
      if (button) {
        button.innerHTML = `📂 打开最近的画布<br><small>${new Date(result.canvas.updated).toLocaleString()}</small>`;
      }
    }
  });
});

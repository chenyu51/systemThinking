const fs = require('fs');

// 紫蓝色背景的有效 PNG 文件（base64 编码）
const pngData = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAADUlEQVR4nGNgGAWjYBQAAQAABQABnXMLaQAAAABJRU5ErkJggg==',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAG0lEQVR4nGP8//8fAxAIgABBEsRA6geqYhSMglEAAIgpqBk3s9i8AAAAAElFTkSuQmCC',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADTAomsAAAAHklEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AUjAIAaL4DEA3V4TYAAAAASUVORK5CYII='
};

console.log('🎨 生成 PNG 图标文件...\n');

for (const [size, base64] of Object.entries(pngData)) {
  const buffer = Buffer.from(base64, 'base64');
  const path = `assets/icon-${size}.png`;
  fs.writeFileSync(path, buffer);
  console.log(`✓ 生成: ${path} (${buffer.length} bytes)`);
}

console.log('\n✅ PNG 图标生成完成！');
console.log('\n📋 输出文件：');
console.log('   assets/icon-16.png  - Chrome toolbar 图标');
console.log('   assets/icon-48.png  - Chrome extension 页面图标');
console.log('   assets/icon-128.png - Chrome Web Store 图标');

#!/usr/bin/env node

/**
 * 图标生成脚本
 * 从 SVG 生成不同尺寸的 PNG 图标
 * 
 * 使用方法：node generate-icons.js
 * 
 * 依赖：sharp 库（用于图像处理）
 * 安装：npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 48, 128];
const SVG_PATH = path.join(__dirname, 'assets', 'icon.svg');
const OUTPUT_DIR = path.join(__dirname, 'assets');

async function generateIcons() {
  try {
    console.log('🎨 开始生成图标...');
    
    if (!fs.existsSync(SVG_PATH)) {
      throw new Error(`SVG 文件不存在: ${SVG_PATH}`);
    }

    for (const size of SIZES) {
      const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
      
      console.log(`📐 生成 ${size}×${size} 图标...`);
      
      await sharp(SVG_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 102, g: 126, b: 234, alpha: 1 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ 已保存: ${outputFile}`);
    }

    console.log('\n🎉 所有图标生成完成！');
    console.log('\n生成的文件:');
    SIZES.forEach(size => {
      const file = path.join(OUTPUT_DIR, `icon-${size}.png`);
      if (fs.existsSync(file)) {
        console.log(`  ✓ icon-${size}.png`);
      }
    });

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

generateIcons();

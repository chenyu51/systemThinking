#!/usr/bin/env python3
"""
图标生成脚本（Python 版本）
从 SVG 生成不同尺寸的 PNG 图标

使用方法：python3 generate-icons.py

依赖：
  - cairosvg（用于 SVG 转 PNG）
  - PIL/Pillow（用于图像处理）

安装：pip3 install cairosvg pillow
"""

import os
import sys
from pathlib import Path

def install_dependencies():
    """检查并安装所需依赖"""
    required_packages = ['cairosvg', 'PIL']
    
    try:
        import cairosvg
        from PIL import Image
        print("✅ 依赖已安装")
        return True
    except ImportError:
        print("⚠️  缺少依赖包，尝试安装...")
        os.system("pip3 install cairosvg pillow")
        return False

def generate_icons():
    """生成不同尺寸的图标"""
    try:
        import cairosvg
        from PIL import Image
        import io
        
        svg_path = Path(__file__).parent / "assets" / "icon.svg"
        output_dir = Path(__file__).parent / "assets"
        
        if not svg_path.exists():
            print(f"❌ SVG 文件不存在: {svg_path}")
            sys.exit(1)
        
        sizes = [16, 48, 128]
        print("🎨 开始生成图标...\n")
        
        for size in sizes:
            print(f"📐 生成 {size}×{size} 图标...")
            
            # SVG 转 PNG
            output_path = output_dir / f"icon-{size}.png"
            
            cairosvg.svg2png(
                url=str(svg_path),
                write_to=str(output_path),
                output_width=size,
                output_height=size
            )
            
            print(f"✅ 已保存: {output_path}\n")
        
        print("🎉 所有图标生成完成！")
        print("\n生成的文件:")
        for size in sizes:
            output_file = output_dir / f"icon-{size}.png"
            if output_file.exists():
                file_size = output_file.stat().st_size / 1024  # KB
                print(f"  ✓ icon-{size}.png ({file_size:.1f} KB)")
    
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请运行: pip3 install cairosvg pillow")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_icons()

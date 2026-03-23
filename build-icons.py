#!/usr/bin/env python3
"""快速生成 Chrome 插件图标"""

from PIL import Image, ImageDraw

def draw_icon(size):
    """绘制 SystemCanvas 图标"""
    # 创建背景 - 紫蓝色
    img = Image.new('RGB', (size, size), color=(102, 126, 234))
    draw = ImageDraw.Draw(img)
    
    # 缩放计算
    scale = size / 512
    
    # 节点半径
    node_radius = int(35 * scale)
    
    # 节点列表：(x, y, RGB颜色)
    nodes = [
        (int(150 * scale), int(150 * scale), (255, 215, 0)),         # 黄金
        (int(362 * scale), int(150 * scale), (255, 107, 107)),       # 珊瑚红
        (int(256 * scale), int(320 * scale), (81, 198, 102))         # 青绿
    ]
    
    line_width = max(1, int(3 * scale))
    white = (255, 255, 255)
    
    # 连线1: 左上 -> 右上 (绿色)
    draw.line(
        [(int(180 * scale), int(140 * scale)), 
         (int(332 * scale), int(140 * scale))],
        fill=(81, 198, 102),
        width=line_width
    )
    
    # 连线2: 右上 -> 下方 (红色)
    draw.line(
        [(int(345 * scale), int(175 * scale)), 
         (int(285 * scale), int(295 * scale))],
        fill=(255, 107, 107),
        width=line_width
    )
    
    # 连线3: 下方 -> 左上 (蓝紫色)
    draw.line(
        [(int(235 * scale), int(295 * scale)), 
         (int(170 * scale), int(175 * scale))],
        fill=(102, 126, 234),
        width=line_width
    )
    
    # 绘制彩色节点
    for x, y, color in nodes:
        # 计算包围框
        r = node_radius
        bbox = [x - r, y - r, x + r, y + r]
        # 绘制圆形
        draw.ellipse(
            bbox, 
            fill=color, 
            outline=white, 
            width=max(1, int(2 * scale))
        )
    
    return img


# 主程序
if __name__ == '__main__':
    print('🎨 开始生成 PNG 图标...\n')
    
    sizes = [16, 48, 128]
    
    for size in sizes:
        print(f'📐 生成 {size}×{size} 图标...', end=' ', flush=True)
        
        # 绘制并保存
        img = draw_icon(size)
        path = f'assets/icon-{size}.png'
        img.save(path)
        
        print(f'✅\n   保存: {path}')
    
    print('\n🎉 所有图标生成完成！')
    print('\n📝 文件清单:')
    import os
    for size in sizes:
        path = f'assets/icon-{size}.png'
        if os.path.exists(path):
            size_kb = os.path.getsize(path) / 1024
            print(f'   ✓ {path} ({size_kb:.1f} KB)')

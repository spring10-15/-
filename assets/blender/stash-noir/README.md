# 藏匿点 · Noir Blender 场景

根据本次提供的皮箱／木桌参考图制作的第一版可编辑 3D 静物场景。单张图不可见的结构与尺寸采用合理补全；纸币为虚构游戏纸币，卡背与金色牌券使用重新绘制的近似花纹。

## 文件

- `stash-noir.blend`：Blender 5.2 场景，贴图打包在文件内，可独立移动。
- `preview.png`：实际 Blender 渲染预览。
- `build_scene.py`：可重复运行的场景生成脚本。
- `make_textures.py`：纸币与卡牌贴图生成脚本（需要 Pillow）。
- `textures/`：原始贴图。

## 打开与调整

1. 用 Blender 打开 `stash-noir.blend`。
2. 按小键盘 `0` 进入相机视角；没有小键盘时使用 View → Cameras → Active Camera。
3. 右上角 Outliner 按木桌、皮箱、现金、筹码、贵重物、卡牌、台灯、房间、灯光分组。
4. 调整箱盖：选择 `LID • rotate X to open / close`，修改 X 旋转。收纳道具可各自移动。
5. 按 `F12` 渲染。场景采用 Cycles 和降噪。

## 范围与限制

这是按参考图搭建的第一版场景，重点是空间、物体、材质和暖色灯光。没有做到照片级一比一复刻；皮革磨损、桌面划痕、窗外街景与烟雾等细节仍可继续精修。未做动画、碰撞、实时性能优化或接入游戏。

## 重建

在本目录运行：

```sh
python3 make_textures.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_scene.py
```

脚本会覆盖同目录内的场景和预览；手工修改前请另存文件。

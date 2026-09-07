# 3D 原型 · 第一阶段基础工程

## 运行

双击本目录的 `启动3D原型.command`。也可以在 Godot 4.7.2 打开上一级 `project.godot`，按 F6 运行 `three_d/scenes/main.tscn`，或按 F5 运行项目。

- WASD：行走；鼠标：观察。
- 接近物件并将准星对准它，按 E 交互；有效距离为 2 米，墙体会阻挡交互。
- 皮箱可以开合；右侧房门进入烟雾酒馆；酒馆入口可以返回。
- 靠近牌桌前沿按 E 入座，点击“离开牌桌”或按 Esc 返回。
- Esc 暂停／恢复；切出窗口自动暂停。

## 当前完成

- Blender → GLB → Godot 的实际导入与分组。
- 藏匿点与烟雾酒馆的可行走粗模空间、碰撞、门切换。
- 视线交互、箱盖动作、入座与离座、暂停。
- 独立的牌型比较、浏览器兼容随机数／洗牌、边池计算模块及对照测试。

**目前牌局尚未接入界面，不能下注或完成一局游戏。** 酒馆还是灰盒；Blender 的三张图像贴图已保留，程序化材质暂用 PBR 基础色，烘焙、人物、音效、存档、经济和正式美术仍待制作。此版不是最终画质样板。

## 技术入口

- `scripts/world.gd`：空间组装、交互请求分发和视角状态。
- `scripts/player.gd`：第一人称移动和射线目标检查。
- `scripts/interactable.gd`：物件的交互 ID、标题和状态。
- `rules/poker.gd`：不依赖画面和场景节点的纯规则。
- `assets/stash.glb`：8 个网格、185,908 个三角形，约 11.7 MB；网格数量不等于绘制调用数量。
- `assets/stash-export.json`：导出检查数据。

Blender 源文件在项目根目录的 `assets/blender/stash-noir/`。`export_game_asset.py` 只生成运行资产，不覆盖源 `.blend`。

原有 2D 场景保持在原位置。项目主入口切换到新的 3D 场景，当前实测编辑器版本为 Godot 4.7.2，Mac 使用 Metal / Forward+。尚未安装并验证桌面导出模板，也尚未交付独立游戏安装包。

## 验证

在项目根目录执行：

```sh
node Godot/three_d/tests/generate_poker_fixtures.mjs
/Applications/Godot.app/Contents/MacOS/Godot --headless --path Godot --script res://three_d/tests/poker_test.gd
/Applications/Godot.app/Contents/MacOS/Godot --headless --path Godot --script res://three_d/tests/smoke.gd -- --test
```

牌型对照数据由现有浏览器规则生成，包含 1,013 组手牌、200 次比较、100 个随机输出和 5 套洗牌结果，另有 106 项边池及筹码守恒检查。3D 操作检查覆盖 23 个断言。

报告在项目根目录 `output/3d/`。检查日志必须没有 `SCRIPT ERROR` 或 `ERROR`，且报告中的 `failed` 为 0；不能仅依据 Godot 进程退出码判定通过。

真实渲染截图：

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path Godot --rendering-driver metal --resolution 1376x768 --script res://three_d/tests/capture.gd -- --test
```

截图来自引擎实际帧缓冲；此操作会临时打开并关闭游戏窗口。

# 德扑酒馆：落袋为安

一个以德州扑克为核心的 noir Roguelike 浏览器游戏原型。玩家从藏匿点出发，进入不同酒馆，在牌桌、道具、情报、风声和撤离路线之间做风险决策，最终把筹码、现金和贵重物真正“落袋为安”。

## 当前特性

- 动态视频背景：登录页、藏匿点、四个酒馆、撤离成功和撤离失败支持循环视频背景。
- 四个酒馆与多条撤离路线：不同酒馆拥有独立牌桌、对手、路线条件和风险结构。
- 德州扑克流程：包含盲注、跟注、弃牌、全下、公共牌推进、摊牌和结算。
- 道具与奢侈品：道具可影响搜阶段、牌局或撤离，奢侈品可作为带货收益或牌局抵押。
- 长期档案：使用本地存储记录财富、场次、对手情报、房间轨迹和关键结果。
- AI Native 原型层：对手拥有性格参数、桌边短句、行为记忆和风格反馈。
- 中英双语：界面文案按当前语言设置统一切换。

## 本地运行

```bash
npm install
npm run dev
```

然后打开：

```text
http://127.0.0.1:4173/
```

当前项目是静态前端原型，开发服务器使用 Python 的 `http.server`，入口文件是 `index.html`。

## 验证脚本

```bash
node scripts/verify_full_game_flow.mjs
node scripts/verify_browser_flows.mjs
```

`verify_full_game_flow.mjs` 用于检查核心游戏逻辑，`verify_browser_flows.mjs` 会通过 Playwright 跑一遍关键浏览器流程并输出截图到 `output/`。

## 目录结构

- `src/`：核心状态机、游戏规则、数据、渲染入口、视频背景管理。
- `scenes/`：首页、藏匿点、酒馆、德扑牌桌、撤离结算等场景组件。
- `styles/`：全局视觉系统和场景样式。
- `assets/scene-plates/`：静态场景图、二级场景图、路线图。
- `assets/videos/`：循环视频背景及视频清单。
- `assets/audio/`：背景音乐与音效素材目录。
- `scripts/`：自动化验证、视频清单同步等工具。
- `archive/`：阶段性设计和开发快照。

## 素材命名

视频背景放在 `assets/videos/`，添加或替换后运行：

```bash
node scripts/sync_video_manifest.mjs
```

常用视频文件名：

- `menu-title-bg.mp4`
- `stash-loop.mp4`
- `tavern-smoky-den-bg.mp4`
- `tavern-high-rise-suite-bg.mp4`
- `tavern-rooftop-club-bg.mp4`
- `tavern-neon-poker-club-bg.mp4`
- `extraction-success.mp4`
- `extraction-failure.mp4`

背景音乐放在 `assets/audio/bgm/`，场景图放在 `assets/scene-plates/`。

## 隐私与安全

仓库不需要 API key、私钥或 `.env` 文件即可运行。`.gitignore` 已排除 `.env*`、`node_modules/`、`output/`、`.DS_Store` 和本地临时目录。

提交前建议运行：

```bash
rg -n --hidden -g '!node_modules' -g '!output' -g '!.git' -i "(api[_-]?key|secret|token|password|bearer|authorization|private key)" .
```

如果后续接入真实 AI 服务，请只通过本地环境变量或后端代理传递密钥，不要把密钥写入前端源码或素材清单。

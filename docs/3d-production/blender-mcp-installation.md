# Blender 官方 MCP 安装记录

安装并复验：2026-09-08。

- 官方介绍：https://www.blender.org/lab/mcp-server/
- 官方仓库：https://projects.blender.org/lab/blender_mcp
- 扩展包：https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.0/mcp-1.0.0.zip
- 本机 Blender：5.2.1 LTS；已启用扩展 bl_ext.user_default.mcp。
- MCP Python 包：blender-mcp 1.0.2；源提交 5181fa06d5c601e910eb680a0012d20d1203b8d5。
- 安装位置：/Users/springwater/.local/share/blender-official-mcp/，含 source、venv 和扩展下载包。第三方依赖不提交进游戏仓库。
- Codex 注册名：blender-official；启动命令为上述 venv/bin/blender-mcp。

本次用官方 Python MCP SDK 建立真实 stdio 会话，列出 26 个工具，再经 execute_blender_code 读取当前场景：status=ok、Blender 5.2.1 LTS、1,479 个对象、assets/blender/stash-noir/stash-noir.blend。未修改源场景。握手显示的 1.30.0 是 MCP SDK 版本，不是 blender-mcp 包版本。

Blender 端通过 --online-mode --background 加载源场景，并用 --command blender_mcp --host 127.0.0.1 启动；只监听本机 9876。此处 online-mode 是该官方扩展运行所需的进程选项，没有修改 Blender 全局联网偏好。

Codex 全局配置已经添加；当前已打开任务的工具列表不会自动重载。本次连接通过 SDK 完成验证，如需在新任务中直接调用工具，应刷新连接或重新打开任务。Blender 端仍须保持运行。

重新启动 Blender 端（在项目根目录执行；已有服务运行时不必重复启动）：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --online-mode --background assets/blender/stash-noir/stash-noir.blend --command blender_mcp --host 127.0.0.1
```

Godot 与 Blender 的连接不依赖 MCP：正常游戏继续加载已导出的 GLB，所以关闭 MCP 不影响已制作游戏运行。

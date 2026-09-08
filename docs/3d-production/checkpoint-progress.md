# 存档基础模块进展

本轮发现开始前已有 run.gd、content.json 和 sync_content.mjs 的搜索、库存与道具改动，归属正在向用户核实。本次只增加独立文件，未覆盖这些改动，未接入主场景自动保存。

- `rules/save_store.gd`：版本化本地二进制存档，保留整数及向量类型；禁止对象反序列化；完整性校验；临时文件写入、验证后替换旧档。校验用于发现文件损坏，不是反作弊机制。
- `rules/table_checkpoint.gd`：保存牌桌内部状态、动作版本和随机数进度，恢复时不重新发牌或再次执行结算。
- `tests/save_store_test.gd`：8 项检查，包含首次保存、覆盖、类型保留、校验失败及版本不支持。
- `tests/table_checkpoint_test.gd`：2,021 项检查，两张桌各 10 个种子，在每个动作节点实际写入、读回、恢复，并比较下一步牌序、资金、行动队列及终局状态。

测试文件名包含测试进程 ID，测试完成后删除，不触碰玩家存档。

尚未完成：完整出局与库存快照、玩家位置恢复、主场景自动保存、读取异常的用户界面，以及系统中断或磁盘写满的验证。目前关闭游戏仍不能自动续玩。待共享文件归属明确后继续接入。

运行：在项目根目录执行 Godot 的 --headless --path Godot --script 参数，分别指定 res://three_d/tests/save_store_test.gd 和 res://three_d/tests/table_checkpoint_test.gd。

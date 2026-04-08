extends Node2D

# ================= 1. 游戏数据状态机 =================
# 假装这是玩家从你的“个人仓库场景”带过来的钱
var player_cash: int = 24500     
var global_pot: int = 12800      # 牌桌上目前的总底池
var current_stake: int = 4000    # 这回合你需要跟注的钱
var risk_level: int = 85         # 当前风声/风险值

# ================= 2. 抓取 UI 节点 =================
# @onready 的作用是等画面加载完，立刻把这些 UI 元素抓在手里
@onready var lbl_pot = $PokerUI/UI_CaseFile/Lbl_Pot
@onready var lbl_stake = $PokerUI/UI_CaseFile/Lbl_Stake
@onready var risk_bar = $PokerUI/UI_CaseFile/Bar_Risk

@onready var btn_call = $PokerUI/UI_ActionBtns/Btn_Call
@onready var btn_allin = $PokerUI/UI_ActionBtns/Btn_AllIn

# ================= 3. 初始化 =================
func _ready():
	# 游戏刚运行，先把 UI 上的假数字替换成我们上面写的真实变量
	update_ui()
	
	# 【核心！】用代码绑定按钮的点击事件 (不用去面板里连线了，非常清晰)
	btn_call.pressed.connect(_on_call_pressed)
	btn_allin.pressed.connect(_on_allin_pressed)

# ================= 4. 业务逻辑与数据更新 =================

# 专门用来刷新画面的函数
func update_ui():
	lbl_pot.text = "CURRENT POT: $" + str(global_pot)
	lbl_stake.text = "YOUR CASH: $" + str(player_cash) # 这里改成显示玩家余额，更有代入感
	risk_bar.value = risk_level

# 当玩家点击 "CALL ($4000)" 时触发
func _on_call_pressed():
	if player_cash >= current_stake:
		player_cash -= current_stake      # 扣掉玩家的钱
		global_pot += current_stake       # 钱扔进底池
		risk_level += 5                   # 频繁跟注，引起黑帮警觉，风险+5
		
		print("执行 CALL！底池升至: ", global_pot)
		update_ui() # 重新刷新画面文字
	else:
		print("余额不足，无法跟注！")

# 当玩家点击 "ALL-IN" 时触发
func _on_allin_pressed():
	if player_cash > 0:
		global_pot += player_cash         # 把身上的钱全推进去
		player_cash = 0                   # 倾家荡产
		risk_level = 100                  # 赌命动作，风声直接拉满爆表！
		
		# 让全押按钮变灰，不能再点了
		btn_allin.disabled = true
		btn_call.disabled = true
		
		print("玩家 ALL-IN！！")
		update_ui() # 重新刷新画面文字

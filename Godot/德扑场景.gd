extends Node2D

# ================= 1. 节点引用区 =================
# 视觉层节点
@onready var bg_vault = $PokerVisuals/Poker_Bg_Vault
@onready var mid_table = $PokerVisuals/Poker_Mid_Table
@onready var fg_hands = $PokerVisuals/Poker_Fg_Hands

# UI层节点 (获取 UI 上的文字和按钮，准备改数据)
@onready var lbl_global_pot = $PokerUI/UI_GlobalPot
@onready var lbl_stake = $PokerUI/UI_CaseFile/Txt_Stake
@onready var btn_call = $PokerUI/UI_ActionBtns/Btn_Call

# ================= 2. 游戏数据状态机 =================
# 这些数据以后可以从“酒馆场景”继承过来，现在先写死测试
var player_cash: int = 24500     # 玩家带进酒馆的钱
var current_global_pot: int = 0  # 当前桌上的总底池
var current_stake: int = 4000    # 当前需要跟注的金额

# 视差移动参数
var screen_center: Vector2
var start_pos_back: Vector2
var start_pos_mid: Vector2
var start_pos_front: Vector2

func _ready():
	# 初始化视差中心点
	screen_center = get_viewport_rect().size / 2.0
	start_pos_back = bg_vault.position
	start_pos_mid = mid_table.position
	start_pos_front = fg_hands.position
	
	# 初始化 UI 显示
	update_poker_ui()
	
	# 绑定按钮点击事件：当点击 "CALL" 时，执行 _on_btn_call_pressed 函数
	btn_call.pressed.connect(_on_btn_call_pressed)

func _process(delta):
	# 视差跟随鼠标移动的核心逻辑 (与之前的 HTML 原理完全一致)
	var mouse_pos = get_viewport().get_mouse_position()
	var offset = mouse_pos - screen_center
	
	bg_vault.position = bg_vault.position.lerp(start_pos_back + offset * 0.01, 5 * delta)
	mid_table.position = mid_table.position.lerp(start_pos_mid + offset * -0.02, 5 * delta)
	fg_hands.position = fg_hands.position.lerp(start_pos_front + offset * -0.06, 5 * delta)

# ================= 3. 业务逻辑区 =================

# 更新 UI 文字显示的函数
func update_poker_ui():
	lbl_global_pot.text = "GLOBAL POT: $" + str(current_global_pot)
	lbl_stake.text = "YOUR STAKE: $" + str(current_stake)
	btn_call.text = "CALL ($" + str(current_stake) + ")"

# 当玩家点击“跟注(CALL)”时触发的事件
func _on_btn_call_pressed():
	if player_cash >= current_stake:
		player_cash -= current_stake      # 扣除玩家身上的钱
		current_global_pot += current_stake # 加到公共底池里
		print("跟注成功！目前底池: ", current_global_pot, " 剩余现金: ", player_cash)
		
		# 刷新 UI 界面
		update_poker_ui()
		
		# TODO: 这里可以加一个让 AI 对手行动的指令，或者增加风声(Risk)值
	else:
		print("钱不够了！")
		# TODO: 可以在这里触发 UI 震动或者红框警告特效

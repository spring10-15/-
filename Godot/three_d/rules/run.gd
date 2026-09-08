extends RefCounted
## Session-only economy. Owns the table reference so callers cannot settle arbitrary stacks.
const TableRules = preload("res://three_d/rules/table.gd")
var content: Dictionary
var vault: int
var active := false
var cash := 0
var bankroll := 0
var heat := 0
var public_exit := false
var completed: Array[String] = []
var table: RefCounted
var last_result: Dictionary = {}
var revision := 0

func _init(definitions: Dictionary) -> void:
	content = definitions
	vault = int(content.startingVault)

func start(expected_revision: int) -> bool:
	if expected_revision != revision or active or vault < 120:
		return false
	bankroll = mini(int(content.standardBankroll), vault)
	vault -= bankroll
	cash = bankroll
	heat = 0
	public_exit = false
	completed.clear()
	last_result = {}
	active = true
	revision += 1
	return true

func table_blocked_reason(table_id := "cargo-table") -> String:
	if table_id not in ["cargo-table", "ledger-cellar"]:
		return "该牌桌尚未开放"
	if not active:
		return "先从藏匿点进入酒馆"
	if table != null:
		return "当前牌桌尚未结算"
	if table_id in completed:
		return "本局已完成此桌，可继续探索或撤离"
	var definition: Dictionary = content.tables[table_id]
	if definition.unlocksAfter != null and definition.unlocksAfter not in completed:
		return "先完成货运桌并离座，再进入账房地窖"
	if cash < int(definition.buyIn):
		return "随身现金不足 %d，无法买入" % int(definition.buyIn)
	return ""

func enter_table(seed_value: int, expected_revision: int, table_id := "cargo-table") -> RefCounted:
	if expected_revision != revision or not table_blocked_reason(table_id).is_empty():
		return null
	var definition: Dictionary = content.tables[table_id]
	cash -= int(definition.buyIn)
	heat = mini(6, heat + int(definition.heatGain) + int(content.scenes["smoky-den"].entryHeatBonus))
	table = TableRules.new()
	table.start(definition, seed_value)
	revision += 1
	return table

func settle_table(expected_revision: int) -> bool:
	if expected_revision != revision or not active or table == null or table.state.status != "finished":
		return false
	cash += int(table.state.players[0].stack)
	completed.append(table.state.tableDef.id)
	table = null
	revision += 1
	return true

func discover_exit() -> bool:
	if not active or table != null or public_exit:
		return false
	public_exit = true
	revision += 1
	return true

func extraction_quote() -> Dictionary:
	var scene: Dictionary = content.scenes["smoky-den"]
	var fee := int(scene.generalExtractionFlatFee) + int(floor(cash * float(scene.generalExtractionRate)))
	if heat == 5:
		fee += int(scene.lockdownSurcharge)
	var reason := ""
	if not active:
		reason = "当前没有进行中的出局"
	elif table != null:
		reason = "请先完成牌桌并离座"
	elif not public_exit:
		reason = "尚未找到出口线索：查看门旁告示"
	elif heat >= 6:
		reason = "风声达到 6，普通出口已封锁"
	elif cash < fee:
		reason = "随身现金不足以支付撤离费"
	return {"fee": fee, "net": maxi(0, cash - fee), "reason": reason, "revision": revision}

func extract(expected_revision: int) -> bool:
	var quote := extraction_quote()
	if expected_revision != revision or not quote.reason.is_empty():
		return false
	last_result = {"cash": cash, "fee": quote.fee, "net": quote.net, "profit": quote.net - bankroll}
	vault += int(quote.net)
	cash = 0
	active = false
	revision += 1
	return true

func reset_demo(expected_revision: int) -> bool:
	if expected_revision != revision or active or vault >= 120:
		return false
	vault = int(content.startingVault)
	last_result = {}
	revision += 1
	return true

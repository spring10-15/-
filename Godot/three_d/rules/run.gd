extends RefCounted
## Run economy and services. Owns the table reference so callers cannot settle arbitrary stacks.
const TableRules = preload("res://three_d/rules/table.gd")
const SUPPORTED_ITEMS := ["marked-lens", "steadying-drink", "sleeve-clip"]
const ITEM_NAMES := {"marked-lens": "标记镜片", "steadying-drink": "镇定酒", "sleeve-clip": "袖口夹"}
var inventory: Array[String] = []
var known_rules: Array[String] = []
var used_tools: Array[String] = []
var preview: Dictionary = {}
var preview_hand := 0
var action_points := 2
var search_index := 1
var heat_reduced := false
var service_message := ""
var last_reward := ""
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
	inventory.clear()
	known_rules.clear()
	action_points = int(content.searchActions)
	search_index = 1
	heat_reduced = false
	preview = {}
	service_message = ""
	last_result = {}
	last_reward = ""
	used_tools.clear()
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
	used_tools.clear()
	preview = {}
	table = TableRules.new()
	table.start(definition, seed_value)
	revision += 1
	return table

func settle_table(expected_revision: int) -> bool:
	if expected_revision != revision or not active or table == null or table.state.status != "finished":
		return false
	var stack: int = table.state.players[0].stack
	cash += stack
	last_reward = ""
	if stack > int(table.state.tableDef.buyIn):
		var reward := "ivory-chip"
		if table.state.tableDef.id == "ledger-cellar":
			reward = "pearl-necklace" if stack >= 130 else "emerald-brooch"
		elif "ivory-chip" in inventory:
			reward = "ruby-cufflink" if stack >= 90 else "old-silver-lighter"
		if slots_used() + int(content.items[reward].slots) <= int(content.inventorySlots):
			inventory.append(reward)
			last_reward = "获得 " + item_name(reward)
		else:
			last_reward = "背包已满，未能带走 " + item_name(reward)
	completed.append(table.state.tableDef.id)
	table = null
	search_index += 1
	action_points = int(content.searchActions)
	heat_reduced = false
	public_exit = true
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
	return {"fee": fee, "valuables": valuable_total(), "net": maxi(0, cash - fee) + valuable_total(), "reason": reason, "revision": revision}

func extract(expected_revision: int) -> bool:
	var quote := extraction_quote()
	if expected_revision != revision or not quote.reason.is_empty():
		return false
	last_result = {"cash": cash, "valuables": quote.valuables, "fee": quote.fee, "net": quote.net, "profit": quote.net - bankroll}
	vault += int(quote.net)
	cash = 0
	inventory.clear()
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

func slots_used() -> int:
	var slots := 0
	for item_id in inventory:
		slots += int(content.items[item_id].slots)
	return slots

func service_reason(kind: String, item_id: String) -> String:
	if not active:
		return "请先带钱进入酒馆"
	if kind in ["lens", "sleeve", "drink"] and item_id != {"lens": "marked-lens", "sleeve": "sleeve-clip", "drink": "steadying-drink"}[kind]:
		return "道具与动作不匹配"
	if kind in ["lens", "sleeve"]:
		if table == null or table.state.status != "playing":
			return "只能在进行中的牌桌使用"
		if item_id not in inventory:
			return "背包中没有此道具"
		if item_id in used_tools:
			return "本桌已经使用过"
		if kind == "lens" and table.state.street == "river":
			return "公共牌已全部揭晓"
		if kind == "sleeve" and (table.state.street != "preflop" or table.state.turnCounter > 0 or table.state.currentActorId != "player"):
			return "只能在翻牌前首次行动前换牌"
		return ""
	if table != null:
		return "请先结束牌桌并离座"
	if action_points <= 0:
		return "本轮行动力已用完，完成牌桌后刷新"
	if kind == "buy":
		if item_id not in SUPPORTED_ITEMS or item_id not in shop_stock():
			return "本轮未上架"
		if cash < int(content.items[item_id].buy):
			return "随身现金不足"
		if slots_used() + int(content.items[item_id].slots) > int(content.inventorySlots):
			return "背包已满"
	elif kind == "sell":
		if item_id not in inventory:
			return "背包中没有此物品"
	elif kind in ["drink", "cool"]:
		if heat_reduced or heat <= 0:
			return "本轮已降过风声或无需降风声"
		if kind == "drink" and "steadying-drink" not in inventory:
			return "背包中没有镇定酒"
		if kind == "cool" and cash < int(content.scenes["smoky-den"].heatReductionCost):
			return "随身现金不足"
	elif kind == "intel":
		if item_id not in ["cargo-table", "ledger-cellar"] or item_id in known_rules:
			return "该牌桌规则已知或尚未开放"
	else:
		return "未知操作"
	return ""

func shop_stock() -> Array:
	var shops: Dictionary = content.shops["smoky-den"]
	return shops.get(str(search_index), shops["3"])

func service_action(kind: String, item_id: String, expected_revision: int) -> bool:
	if expected_revision != revision or not service_reason(kind, item_id).is_empty():
		return false
	if kind == "buy":
		cash -= int(content.items[item_id].buy)
		inventory.append(item_id)
		service_message = "已购买 " + item_name(item_id)
	elif kind == "sell":
		cash += sale_value(item_id)
		inventory.erase(item_id)
		service_message = "已出售 " + item_name(item_id)
	elif kind in ["drink", "cool"]:
		if kind == "drink":
			inventory.erase("steadying-drink")
		else:
			cash -= int(content.scenes["smoky-den"].heatReductionCost)
		heat -= 1
		heat_reduced = true
		service_message = "风声降低 1"
	elif kind == "intel":
		known_rules.append(item_id)
		service_message = "已查明牌桌规则"
	elif kind == "lens":
		preview = table.state.deck.back().duplicate()
		preview_hand = table.state.handNumber
		service_message = "已记录下一张公共牌；翻牌时会出现此牌"
	elif kind == "sleeve":
		# Preserve a previously previewed top card for the next community draw.
		var index: int = table.state.deck.size() - 1
		if not preview.is_empty() and preview_hand == table.state.handNumber and table.state.deck[index] == preview:
			index -= 1
		table.state.players[0].holeCards[1] = table.state.deck.pop_at(index)
		service_message = "已替换第二张手牌"
	if kind in ["lens", "sleeve"]:
		inventory.erase(item_id)
		used_tools.append(item_id)
		heat = mini(6, heat + int(content.items[item_id].heat) + int(table.state.tableDef.get("tableToolHeatBonus", 0)))
		table.revision += 1
	else:
		action_points -= 1
	revision += 1
	return true

func service_view() -> Dictionary:
	var actions: Array = []
	if table == null:
		for item_id in shop_stock():
			if item_id in SUPPORTED_ITEMS:
				actions.append({"kind": "buy", "id": item_id, "label": "买 %s · %d" % [item_name(item_id), content.items[item_id].buy]})
		actions.append({"kind": "cool", "id": "", "label": "找酒保降风声 · %d" % content.scenes["smoky-den"].heatReductionCost})
		for table_id in ["cargo-table", "ledger-cellar"]:
			actions.append({"kind": "intel", "id": table_id, "label": "调查%s规则 · 1 行动力" % ("货运桌" if table_id == "cargo-table" else "账房地窖")})
	for item_id in inventory.duplicate():
		if item_id in SUPPORTED_ITEMS:
			var kind: String = {"steadying-drink": "drink", "marked-lens": "lens", "sleeve-clip": "sleeve"}[item_id]
			actions.append({"kind": kind, "id": item_id, "label": "使用 " + item_name(item_id)})
		if table == null:
			actions.append({"kind": "sell", "id": item_id, "label": "卖 %s · %d" % [item_name(item_id), sale_value(item_id)]})
	for action in actions:
		action.reason = service_reason(action.kind, action.id)
	var text := last_reward + "\n" + service_message
	for table_id in known_rules:
		text += "\n" + ("货运桌：每手首次加注少付 10" if table_id == "cargo-table" else "账房地窖：每次桌面道具额外增加 1 风声")
	if not preview.is_empty():
		text += "\n镜片记录（第 %d 手）：%s%s" % [preview_hand, str({11:"J", 12:"Q", 13:"K", 14:"A"}.get(int(preview.rank), str(preview.rank))), {"S":"♠", "H":"♥", "D":"♦", "C":"♣"}[preview.suit]]
	var bag: PackedStringArray = []
	for item_id in inventory:
		bag.append(item_name(item_id))
	return {"revision": revision, "cash": cash, "heat": heat, "points": action_points, "slots": slots_used(), "capacity": content.inventorySlots, "bag": "、".join(bag), "text": text, "actions": actions}

func item_name(id: String) -> String:
	return {"ivory-chip": "象牙筹码", "ruby-cufflink": "红宝石袖扣", "old-silver-lighter": "旧银打火机", "pearl-necklace": "珍珠项链", "emerald-brooch": "翡翠胸针"}.get(id, ITEM_NAMES.get(id, id))

func sale_value(id: String) -> int:
	var item: Dictionary = content.items[id]
	return int(item.value if item.kind == "valuable" else item.sell)

func valuable_total() -> int:
	var total := 0
	for id in inventory:
		if content.items[id].kind == "valuable":
			total += int(content.items[id].value)
	return total

func abandon(expected_revision: int) -> bool:
	if expected_revision != revision or not active or table != null:
		return false
	last_result = {"cash": cash, "valuables": valuable_total(), "fee": 0, "net": 0, "profit": -bankroll, "abandoned": true}
	cash = 0
	inventory.clear()
	active = false
	revision += 1
	return true

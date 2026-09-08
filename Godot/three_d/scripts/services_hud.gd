extends PanelContainer
signal requested(kind: String, item_id: String, revision: int, target_id: String)
signal closed
var rows: VBoxContainer
func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -440
	offset_right = 440
	offset_top = -270
	offset_bottom = 270
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 18)
	add_child(margin)
	var scroll := ScrollContainer.new()
	margin.add_child(scroll)
	rows = VBoxContainer.new()
	rows.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rows.add_theme_constant_override("separation", 8)
	scroll.add_child(rows)
func refresh(view: Dictionary) -> void:
	for child in rows.get_children():
		rows.remove_child(child)
		child.queue_free()
	var heading := Label.new()
	heading.text = "背包与酒馆服务 · 现金 %d · 风声 %d · 行动力 %d\n背包 %d / %d 格：%s\n%s" % [view.cash, view.heat, view.points, view.slots, view.capacity, view.bag if not view.bag.is_empty() else "空", view.text]
	heading.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	heading.custom_minimum_size.x = 760
	rows.add_child(heading)
	for action in view.actions:
		var button := Button.new()
		button.text = action.label + (" · " + action.reason if not action.reason.is_empty() else "")
		button.disabled = not action.reason.is_empty()
		button.custom_minimum_size.y = 36
		button.pressed.connect(func(): requested.emit(action.kind, action.id, view.revision, action.get("target", "")))
		rows.add_child(button)
	var back := Button.new()
	back.text = "返回游戏（B / Esc）"
	back.custom_minimum_size.y = 40
	back.pressed.connect(func(): closed.emit())
	rows.add_child(back)

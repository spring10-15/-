extends Node3D
## First integration milestone: real GLB, traversal, occluded targeting, lid and seating.
## No currency or poker simulation lives in this presentation prototype.
const PlayerController = preload("res://three_d/scripts/player.gd")
const Interactable = preload("res://three_d/scripts/interactable.gd")
const STASH_ASSET = preload("res://three_d/assets/stash.glb")
var player: CharacterBody3D
var title_label: Label
var hint_label: Label
var pause_panel: PanelContainer
var seat_panel: PanelContainer
var crosshair: Label
var case_target: Area3D
var door_target: Area3D
var table_target: Area3D
var lid: Node3D
var lid_open_rotation: Vector3
var case_open := true
var action_busy := false
var seated := false
var paused := false
var current_room := "stash"
var return_transform: Transform3D
var seat_camera: Camera3D
var readiness := false
var materials := {}

func _ready() -> void:
	configure_input()
	make_materials()
	build_lighting()
	build_stash()
	build_tavern()
	player = PlayerController.new()
	player.name = "Player"
	add_child(player)
	player.position = Vector3(-0.35, 0.05, 1.9)
	player.camera.rotation.x = -0.30
	player.interaction_requested.connect(request_action)
	player.focus_changed.connect(show_focus)
	player.pause_requested.connect(toggle_pause)
	build_ui()
	if not OS.get_cmdline_user_args().has("--test"):
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	readiness = true

func configure_input() -> void:
	var bindings := {"move_forward": KEY_W, "move_back": KEY_S, "move_left": KEY_A, "move_right": KEY_D, "interact": KEY_E, "pause": KEY_ESCAPE}
	for action in bindings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
			var event := InputEventKey.new()
			event.physical_keycode = bindings[action]
			InputMap.action_add_event(action, event)

func make_materials() -> void:
	var colors := {"wall": Color("343b39"), "wood": Color("51351f"), "floor": Color("30251e"), "brass": Color("b18c45"), "green": Color("174038"), "dark": Color("171b1a"), "cloth": Color("645941"), "ivory": Color("d5c69d")}
	for key in colors:
		var material := StandardMaterial3D.new()
		material.albedo_color = colors[key]
		material.roughness = 0.76
		if key == "brass":
			material.metallic = 0.7
			material.roughness = 0.35
		materials[key] = material

func box(parent: Node3D, node_name: String, pos: Vector3, size: Vector3, material: String, solid := true) -> Node3D:
	var body: Node3D = StaticBody3D.new() if solid else Node3D.new()
	body.name = node_name
	body.position = pos
	parent.add_child(body)
	var mesh := MeshInstance3D.new()
	var shape := BoxMesh.new()
	shape.size = size
	mesh.mesh = shape
	mesh.material_override = materials[material]
	body.add_child(mesh)
	if solid:
		body.collision_layer = 1
		body.collision_mask = 0
		var collision := CollisionShape3D.new()
		var bounds := BoxShape3D.new()
		bounds.size = size
		collision.shape = bounds
		body.add_child(collision)
	return body

func room_shell(offset: Vector3, label: String) -> Node3D:
	var room := Node3D.new()
	room.name = label
	room.position = offset
	add_child(room)
	box(room, "Floor", Vector3(0, -0.12, 0), Vector3(6, 0.24, 7), "floor")
	box(room, "Ceiling", Vector3(0, 3.1, 0), Vector3(6, 0.2, 7), "dark")
	box(room, "BackWall", Vector3(0, 1.5, -3.5), Vector3(6, 3, 0.18), "wall")
	box(room, "FrontWall", Vector3(0, 1.5, 3.5), Vector3(6, 3, 0.18), "wall")
	for x in [-3.0, 3.0]:
		box(room, "SideWall", Vector3(x, 1.5, 0), Vector3(0.18, 3, 7), "wall")
		box(room, "Skirting", Vector3(x * 0.965, 0.16, 0), Vector3(0.06, 0.3, 6.9), "wood", false)
	for z in [-2.0, 0.0, 2.0]:
		box(room, "CeilingBeam", Vector3(0, 2.94, z), Vector3(5.9, 0.18, 0.15), "wood", false)
	return room

func build_stash() -> void:
	var room := room_shell(Vector3.ZERO, "Stash")
	var asset := STASH_ASSET.instantiate()
	asset.name = "ImportedDesk"
	asset.position = Vector3(0, 0, -0.85)
	room.add_child(asset)
	lid = asset.find_child("CaseLidPivot", true, false)
	if lid:
		lid_open_rotation = lid.rotation
	# A single invisible collider, separate from export meshes, keeps the GLB reimportable.
	var collider := StaticBody3D.new()
	collider.name = "DeskPhysics"
	collider.position = Vector3(0, 0.46, -0.85)
	room.add_child(collider)
	var shape := CollisionShape3D.new()
	var bounds := BoxShape3D.new()
	bounds.size = Vector3(2.15, 0.92, 1.43)
	shape.shape = bounds
	collider.add_child(shape)
	case_target = target(room, "CaseTarget", Vector3(-0.39, 1.04, -0.72), Vector3(1.0, 0.7, 0.85), "toggle_case", "合上皮箱")
	door_target = make_door(room, Vector3(2.83, 1.1, 1.65), "进入酒馆", "enter_tavern")
	box(room, "Cabinet", Vector3(-2.48, 0.8, -2.45), Vector3(0.75, 1.6, 1.0), "wood")
	for y in [0.42, 0.82, 1.22]:
		box(room, "Drawer", Vector3(-2.47, y, -1.93), Vector3(0.64, 0.32, 0.025), "dark", false)
		box(room, "Pull", Vector3(-2.47, y, -1.88), Vector3(0.18, 0.03, 0.045), "brass", false)
	box(room, "Window", Vector3(2.87, 1.9, -1.4), Vector3(0.03, 1.65, 1.8), "dark", false)
	for y in [1.05, 1.9, 2.75]:
		box(room, "WindowFrame", Vector3(2.83, y, -1.4), Vector3(0.08, 0.065, 1.92), "wood", false)
	for z in [-2.33, -1.4, -0.47]:
		box(room, "WindowMullion", Vector3(2.83, 1.9, z), Vector3(0.08, 1.75, 0.065), "wood", false)
	point_light(room, Vector3(0.53, 1.39, -1.25), Color("ffc580"), 1.7, 4)
	point_light(room, Vector3(2.45, 2.1, -1.4), Color("83a6ce"), 0.55, 4)

func build_tavern() -> void:
	var room := room_shell(Vector3(10, 0, 0), "Tavern")
	box(room, "BarCounter", Vector3(2.0, 0.57, -1.25), Vector3(0.65, 1.14, 2.8), "wood")
	box(room, "BarTop", Vector3(2.0, 1.16, -1.25), Vector3(0.86, 0.10, 3.0), "brass")
	for z in [-2.2, -1.2, -0.2]:
		box(room, "BarStool", Vector3(1.20, 0.37, z), Vector3(0.4, 0.74, 0.4), "wood")
	for y in [1.65, 2.25]:
		box(room, "BottleShelf", Vector3(2.77, y, -1.2), Vector3(0.22, 0.07, 2.7), "wood", false)
		for i in range(8):
			box(room, "Bottle", Vector3(2.72, y + 0.19, -2.3 + i * 0.30), Vector3(0.09, 0.3, 0.09), "green", false)
	box(room, "PokerTable", Vector3(-0.45, 0.76, -0.8), Vector3(2.05, 0.15, 1.4), "wood")
	box(room, "Felt", Vector3(-0.45, 0.842, -0.8), Vector3(1.9, 0.014, 1.25), "green", false)
	for x in [-1.1, 0.2]:
		box(room, "TableLeg", Vector3(x, 0.35, -0.8), Vector3(0.1, 0.7, 0.1), "wood")
	for x in [-1.1, 0.25]:
		box(room, "OpponentChair", Vector3(x, 0.45, -1.9), Vector3(0.52, 0.9, 0.52), "dark")
	for i in range(5):
		box(room, "Card", Vector3(-0.89 + i * 0.21, 0.86, -0.8), Vector3(0.15, 0.01, 0.23), "ivory", false)
	table_target = target(room, "TableSeat", Vector3(-0.45, 1.0, 0.04), Vector3(1.6, 0.50, 0.28), "sit", "坐到牌桌前")
	make_door(room, Vector3(-2.83, 1.1, 1.65), "返回藏匿点", "enter_stash")
	seat_camera = Camera3D.new()
	seat_camera.name = "SeatCamera"
	room.add_child(seat_camera)
	seat_camera.position = Vector3(-0.45, 1.42, 0.65)
	seat_camera.rotation.x = -0.38
	seat_camera.fov = 65
	point_light(room, Vector3(-0.45, 2.45, -0.8), Color("ffe1a8"), 2.2, 4.2)
	point_light(room, Vector3(1.8, 2.4, -1.3), Color("d9b782"), 1.0, 4)

func target(parent: Node3D, node_name: String, pos: Vector3, size: Vector3, action: StringName, caption: String) -> Area3D:
	var anchor := Interactable.new()
	anchor.name = node_name
	anchor.action_id = action
	anchor.title = caption
	anchor.position = pos
	anchor.collision_layer = 2
	anchor.collision_mask = 0
	parent.add_child(anchor)
	var collision := CollisionShape3D.new()
	var bounds := BoxShape3D.new()
	bounds.size = size
	collision.shape = bounds
	anchor.add_child(collision)
	return anchor

func make_door(room: Node3D, pos: Vector3, caption: String, action: StringName) -> Area3D:
	box(room, "Door", pos, Vector3(0.10, 2.2, 1.05), "wood", false)
	var side := -1.0 if pos.x > 0 else 1.0
	box(room, "DoorHandle", pos + Vector3(0.10 * side, 0, 0.30), Vector3(0.10, 0.04, 0.15), "brass", false)
	return target(room, "DoorTarget", pos + Vector3(0.12 * side, 0, 0), Vector3(0.20, 2.1, 1.05), action, caption)

func build_lighting() -> void:
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("171d22")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("b0b7c0")
	environment.ambient_light_energy = 0.35
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world.environment = environment
	add_child(world)

func point_light(parent: Node3D, pos: Vector3, color: Color, energy: float, radius: float) -> void:
	var light := OmniLight3D.new()
	light.position = pos
	light.light_color = color
	light.light_energy = energy
	light.omni_range = radius
	light.shadow_enabled = true
	parent.add_child(light)

func build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var ui := Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(ui)
	title_label = label(ui, "藏匿点", 30)
	title_label.position = Vector2(32, 25)
	var instructions := label(ui, "WASD 行走   ·   鼠标观察   ·   E 交互   ·   Esc 暂停", 18)
	instructions.position = Vector2(32, 67)
	crosshair = label(ui, "+", 22)
	crosshair.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	crosshair.position -= Vector2(7, 15)
	hint_label = label(ui, "", 23)
	hint_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	hint_label.offset_left = -350
	hint_label.offset_right = 350
	hint_label.offset_top = -105
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pause_panel = make_panel(ui, "已暂停", "", "继续探索", resume)
	seat_panel = make_panel(ui, "牌桌", "本桌暂未开局。", "离开牌桌", leave_seat)
	pause_panel.hide()
	seat_panel.hide()

func label(parent: Node, content: String, font_size: int) -> Label:
	var node := Label.new()
	node.text = content
	node.add_theme_font_size_override("font_size", font_size)
	node.add_theme_color_override("font_color", Color("f0dfb4"))
	node.add_theme_color_override("font_shadow_color", Color.BLACK)
	node.add_theme_constant_override("shadow_offset_x", 2)
	node.add_theme_constant_override("shadow_offset_y", 2)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(node)
	return node

func make_panel(parent: Control, heading: String, body: String, button_label: String, callback: Callable) -> PanelContainer:
	var panel := PanelContainer.new()
	parent.add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	panel.offset_left = -230
	panel.offset_right = 230
	panel.offset_top = -230
	panel.offset_bottom = -65
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 18)
	panel.add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	margin.add_child(column)
	label(column, heading, 24)
	if not body.is_empty():
		label(column, body, 18)
	var button := Button.new()
	button.text = button_label
	button.custom_minimum_size.y = 40
	button.pressed.connect(callback)
	column.add_child(button)
	return panel

func show_focus(focus: Area3D) -> void:
	if hint_label:
		hint_label.text = focus.prompt() if is_instance_valid(focus) else ""

func request_action(anchor: Area3D) -> bool:
	if paused or seated or action_busy or not player.can_interact(anchor):
		return false
	match anchor.action_id:
		"toggle_case":
			if not is_instance_valid(lid):
				return false
			action_busy = true
			case_open = not case_open
			var goal := lid_open_rotation if case_open else lid_open_rotation + Vector3(deg_to_rad(102), 0, 0)
			var tween := create_tween()
			tween.tween_property(lid, "rotation", goal, 0.65).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
			tween.tween_callback(func(): action_busy = false)
			anchor.title = "合上皮箱" if case_open else "打开皮箱"
			show_focus(anchor)
		"enter_tavern":
			travel("tavern")
		"enter_stash":
			travel("stash")
		"sit":
			return_transform = player.global_transform
			seated = true
			player.controls_enabled = false
			player.velocity = Vector3.ZERO
			seat_camera.current = true
			seat_panel.show()
			crosshair.hide()
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		_:
			return false
	return true

func travel(destination: String) -> void:
	current_room = destination
	player.velocity = Vector3.ZERO
	player.position = Vector3(8.0, 0.05, 1.7) if destination == "tavern" else Vector3(1.95, 0.05, 1.7)
	player.rotation = Vector3(0, -0.65 if destination == "tavern" else 0.55, 0)
	player.camera.rotation = Vector3(-0.10, 0, 0)
	title_label.text = "烟雾酒馆" if destination == "tavern" else "藏匿点"
	player.update_focus()

func leave_seat() -> void:
	if not seated:
		return
	seated = false
	player.global_transform = return_transform
	player.controls_enabled = true
	player.camera.current = true
	seat_panel.hide()
	crosshair.show()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func toggle_pause() -> void:
	if seated:
		leave_seat()
		return
	if paused:
		resume()
		return
	paused = true
	player.controls_enabled = false
	pause_panel.show()
	crosshair.hide()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func resume() -> void:
	paused = false
	player.controls_enabled = true
	pause_panel.hide()
	crosshair.show()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_WINDOW_FOCUS_OUT and readiness and not OS.get_cmdline_user_args().has("--test"):
		if not paused and not seated:
			toggle_pause()

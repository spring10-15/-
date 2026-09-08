extends SceneTree
var checks := 0
var failures: Array[String] = []
func verify(ok: bool, message: String) -> void:
	checks += 1
	if not ok:
		failures.append(message)
		push_error(message)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var world: Node3D = load("res://three_d/scenes/main.tscn").instantiate()
	root.add_child(world)
	await physics_frame
	world.set_process(false)
	world.travel("tavern")
	world.player.position = Vector3(9.55, 0.02, 1.15)
	world.player.camera.look_at(world.table_target.global_position)
	for i in range(5):
		await physics_frame
	verify(world.request_action(world.table_target), "Player seats through actual ray interaction")
	world.start_table(301)
	verify(world.table_game != null, "Start creates a real table")
	world.leave_seat()
	verify(world.seated, "Cannot leave while table remains active")
	var revision: int = world.table_game.revision
	world.toggle_pause()
	verify(not world.seat_panel.visible and world.pause_panel.visible, "Pause hides table controls")
	world._process(10)
	world.play_action("fold", revision)
	verify(world.paused and world.table_game.revision == revision, "Pause freezes timer and blocks player input")
	world.resume()
	verify(world.seat_panel.visible and not world.pause_panel.visible, "Resume restores table controls")
	verify(world.seated and world.seat_camera.current and not world.player.controls_enabled, "Resume keeps table camera and player seated")
	var output := ProjectSettings.globalize_path("res://../output/3d")
	DirAccess.make_dir_recursive_absolute(output)
	var frames := 0
	while world.table_game.state.status != "finished" and frames < 150:
		frames += 1
		world.table_delay = 0
		world.refresh_table()
		var state: Dictionary = world.table_game.state
		if state.status == "hand_over":
			world.seat_panel.next_button.pressed.emit()
		elif state.currentActorId == "player":
			var legal: Dictionary = world.table_game.legal_actions("player")
			var kind := "fold" if state.handNumber == 1 else ("check" if legal.get("check", false) else ("call" if legal.get("call", false) else "all-in"))
			var prior: int = world.table_game.revision
			world.seat_panel.action_buttons[kind].pressed.emit()
			verify(world.table_game.revision == prior + 1, "HUD button submits exactly one legal action")
			world.play_action(kind, prior)
			verify(world.table_game.revision == prior + 1, "Double click during beat is ignored")
		else:
			world.advance_table_beat()
		var view: Dictionary = world.table_game.public_state()
		if view.status == "playing":
			verify(view.players[1].holeCards.is_empty() and view.players[2].holeCards.is_empty(), "HUD receives no private opponent cards during play")
		await process_frame
	verify(world.table_game.state.status == "finished", "A whole table ends via UI and AI controller")
	verify(world.table_game.state.handNumber == 2, "Second hand was played through the HUD")
	verify(world.seat_panel.leave_button.visible, "Terminal table exposes leave button")
	var bankroll := 0
	for person in world.table_game.state.players:
		bankroll += person.stack
	verify(bankroll == 180, "End-of-table chips sum to original bankrolls")
	world.seat_panel.leave_button.pressed.emit()
	verify(not world.seated and world.table_game == null and world.player.camera.current, "Leave restores exploration and clears table session")
	var report := {"checks": checks, "failed": failures.size(), "failures": failures, "transitions": frames}
	var file := FileAccess.open(output.path_join("table-integration.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "  "))
	file.close()
	print("TABLE_INTEGRATION ", JSON.stringify(report))
	quit(0 if failures.is_empty() else 1)

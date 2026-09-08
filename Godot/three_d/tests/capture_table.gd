extends SceneTree
func _initialize() -> void:
	call_deferred("run")
func snap(name: String) -> void:
	for i in range(12):
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(ProjectSettings.globalize_path("res://../output/3d/" + name + ".png"))
func run() -> void:
	var world: Node3D = load("res://three_d/scenes/main.tscn").instantiate()
	root.add_child(world)
	await physics_frame
	world.set_process(false)
	world.show_run_panel("enter")
	await snap("run-departure")
	world.confirm_run_action()
	world.player.position = Vector3(9.55, 0.02, 1.15)
	world.player.camera.look_at(world.table_target.global_position)
	for i in range(5):
		await physics_frame
	world.request_action(world.table_target)
	world.start_table(301)
	world.table_delay = 0
	world.refresh_table()
	await snap("poker-preflop")
	world.pause_game()
	await snap("poker-paused")
	world.resume()
	var snapped := false
	var steps := 0
	while world.table_game.state.status != "finished" and steps < 150:
		steps += 1
		world.table_delay = 0
		var game: RefCounted = world.table_game
		if game.state.status == "hand_over":
			world.continue_hand(game.revision)
		elif game.state.currentActorId == "player":
			var legal: Dictionary = game.legal_actions("player")
			world.play_action("check" if legal.get("check",false) else ("call" if legal.get("call",false) else "all-in"),game.revision)
		else:
			world.advance_table_beat()
		world.table_delay = 0
		world.refresh_table()
		if game.state.street == "flop" and not snapped:
			await snap("poker-flop")
			snapped = true
	await snap("poker-result")
	world.leave_seat()
	world.run_game.discover_exit()
	world.refresh_economy()
	world.show_run_panel("extract")
	await snap("run-extraction")
	world.confirm_run_action()
	await snap("run-return")
	print("TABLE_CAPTURE_OK")
	quit()

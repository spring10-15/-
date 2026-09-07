extends SceneTree
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var world: Node3D = load("res://three_d/scenes/main.tscn").instantiate()
	root.add_child(world)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	var output := ProjectSettings.globalize_path("res://../output/3d")
	DirAccess.make_dir_recursive_absolute(output)
	for i in range(50):
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join("stash-runtime.png"))
	world.player.position = Vector3(-0.39, 0.02, 0.65)
	world.player.camera.look_at(world.case_target.global_position, Vector3.UP)
	for i in range(5):
		await physics_frame
	world.request_action(world.case_target)
	await create_timer(0.85).timeout
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join("case-closed-runtime.png"))
	world.travel("tavern")
	for i in range(30):
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join("tavern-runtime.png"))
	print("CAPTURE_OK")
	quit()

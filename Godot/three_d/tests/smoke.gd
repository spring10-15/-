extends SceneTree
var world: Node3D
var checks: Array[Dictionary] = []
var failures := 0

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, description: String) -> void:
	checks.append({"check": description, "passed": condition})
	if not condition:
		failures += 1
		push_error(description)

func settle(frames := 3) -> void:
	for i in range(frames):
		await physics_frame

func aim(from: Vector3, target: Vector3) -> void:
	world.player.position = from
	world.player.velocity = Vector3.ZERO
	world.player.rotation = Vector3.ZERO
	world.player.camera.rotation = Vector3.ZERO
	world.player.camera.look_at(target, Vector3.UP)
	await settle()
	world.player.update_focus()

func run() -> void:
	world = load("res://three_d/scenes/main.tscn").instantiate()
	root.add_child(world)
	await settle(10)
	check(world.readiness, "3D world starts")
	check(is_instance_valid(world.lid), "GLB keeps independently movable lid")
	check(world.player.is_on_floor(), "Player stands on floor")
	var meshes := world.get_node("Stash/ImportedDesk").find_children("*", "MeshInstance3D", true, false)
	check(meshes.size() == 8, "GLB imports all eight grouped meshes")
	check(not world.request_action(world.case_target), "Distant interaction rejected")
	await aim(Vector3(-0.39, 0.02, 0.6), world.case_target.global_position)
	check(world.player.focused == world.case_target, "Visible nearby case can be targeted")
	check(world.request_action(world.case_target), "Case lid starts closing")
	check(not world.request_action(world.case_target), "Repeated input during animation rejected")
	await create_timer(0.8).timeout
	check(not world.case_open and not world.action_busy, "Lid close completes")
	var closed_rotation: Vector3 = world.lid.rotation
	check(world.request_action(world.case_target), "Case lid can reopen")
	await create_timer(0.8).timeout
	check(world.case_open and world.lid.rotation.is_equal_approx(world.lid_open_rotation), "Lid returns to original transform")
	check(not closed_rotation.is_equal_approx(world.lid.rotation), "Lid actually moved")
	var wall: Node3D = world.box(world, "TestOccluder", Vector3(-0.39, 1.25, 0.10), Vector3(1.3, 2.5, 0.1), "wall")
	await settle()
	check(not world.request_action(world.case_target), "Solid wall blocks interaction ray")
	wall.queue_free()
	await settle()
	world.toggle_pause()
	check(world.paused and not world.player.controls_enabled, "Pause disables movement")
	check(not world.request_action(world.case_target), "Pause blocks world actions")
	world.resume()
	await aim(Vector3(1.65, 0.02, 1.65), world.door_target.global_position)
	check(world.request_action(world.door_target), "Door interaction enters tavern")
	check(world.current_room == "tavern", "Room identity changes")
	await aim(Vector3(9.55, 0.02, 1.15), world.table_target.global_position)
	var before: Transform3D = world.player.global_transform
	check(world.request_action(world.table_target), "Table can be seated")
	check(world.seated and world.seat_camera.current and not world.player.controls_enabled, "Seating changes camera and locks movement")
	world.leave_seat()
	check(not world.seated and world.player.camera.current and world.player.global_transform.is_equal_approx(before), "Leaving seat restores player and camera")
	var back := world.get_node("Tavern/DoorTarget")
	await aim(Vector3(8.0, 0.02, 1.65), back.global_position)
	check(world.request_action(back), "Return door restores stash")
	check(world.current_room == "stash", "Round trip completes")
	# Exercise real character motion into the outer wall.
	world.player.position = Vector3(1.0, 0.02, 2.5)
	world.player.rotation = Vector3(0, -PI / 2, 0)
	world.player.camera.rotation = Vector3.ZERO
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	Input.action_press("move_forward")
	await settle(90)
	Input.action_release("move_forward")
	check(world.player.position.x > 1.2 and world.player.position.x < 2.7, "Walking moves player but cannot pass through wall")
	var output := ProjectSettings.globalize_path("res://../output/3d")
	DirAccess.make_dir_recursive_absolute(output)
	var report := {"engine": Engine.get_version_info().string, "total": checks.size(), "failed": failures, "checks": checks}
	var file := FileAccess.open(output.path_join("smoke.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "  "))
	file.close()
	print("3D_SMOKE ", JSON.stringify(report))
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	quit(1 if failures else 0)

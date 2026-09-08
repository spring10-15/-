extends SceneTree
const Store = preload("res://three_d/rules/save_store.gd")
var checks := 0
var failures: Array[String] = []
func verify(ok: bool, message: String) -> void:
	checks += 1
	if not ok:
		failures.append(message)
		push_error(message)
func _initialize() -> void:
	var path := "user://checkpoint-test-%d.save" % OS.get_process_id()
	verify(Store.read_checkpoint(path).status == "missing", "Missing checkpoint is explicit")
	var state := {"cash": 240, "active": true, "cards": [{"rank": 14, "suit": "S"}], "position": Vector3(1, 2, 3)}
	verify(Store.write_checkpoint(path, state) == OK, "Writes checkpoint")
	var loaded := Store.read_checkpoint(path)
	verify(loaded.status == "ok" and loaded.state == state, "Exact round trip including integer cards and vector")
	state.cash = 180
	verify(Store.write_checkpoint(path, state) == OK, "Atomically replaces existing checkpoint")
	verify(Store.read_checkpoint(path).state.cash == 180, "Replacement contains latest cash")
	verify(not FileAccess.file_exists(path + ".tmp"), "Successful replacement leaves no temporary file")
	var file := FileAccess.open(path, FileAccess.READ)
	var envelope: Dictionary = file.get_var(false)
	file.close()
	envelope.payload[0] = (envelope.payload[0] + 1) % 256
	file = FileAccess.open(path, FileAccess.WRITE)
	file.store_var(envelope)
	file.close()
	verify(Store.read_checkpoint(path).status == "invalid", "Corrupt payload is rejected before decoding")
	file = FileAccess.open(path, FileAccess.WRITE)
	file.store_var({"version": 99})
	file.close()
	verify(Store.read_checkpoint(path).status == "invalid", "Unsupported version is not silently reset")
	DirAccess.remove_absolute(path)
	print("SAVE_STORE ", JSON.stringify({"checks": checks, "failures": failures, "failed": failures.size()}))
	quit(0 if failures.is_empty() else 1)

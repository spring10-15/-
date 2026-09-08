extends SceneTree
const Table = preload("res://three_d/rules/table.gd")
const Checkpoint = preload("res://three_d/rules/table_checkpoint.gd")
const Store = preload("res://three_d/rules/save_store.gd")
var checks := 0
var failures: Array[String] = []
func verify(ok: bool, message: String) -> void:
	checks += 1
	if not ok:
		failures.append(message)
		push_error(message)
func step(table: RefCounted) -> void:
	if table.state.status == "hand_over":
		table.next_hand(table.revision)
	elif table.state.currentActorId.is_empty():
		table.advance(table.revision)
	else:
		var id: String = table.state.currentActorId
		var legal: Dictionary = table.legal_actions(id)
		table.act(id, "check" if legal.check else ("call" if legal.call else "all-in"), table.revision)
func _initialize() -> void:
	var definitions: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://three_d/rules/content.json"))
	var path := "user://table-checkpoint-test-%d.save" % OS.get_process_id()
	for table_id in ["cargo-table", "ledger-cellar"]:
		for seed_value in range(10):
			var original := Table.new()
			original.start(definitions.tables[table_id], seed_value)
			var steps := 0
			while original.state.status != "finished" and steps < 150:
				steps += 1
				verify(Store.write_checkpoint(path, Checkpoint.capture(original)) == OK, "Every action boundary can be saved")
				var copy := Checkpoint.restore(Store.read_checkpoint(path).state)
				verify(copy != null and copy.public_state() == original.public_state(), "Restore preserves legal actions and public view")
				step(original)
				step(copy)
				verify(Checkpoint.capture(copy) == Checkpoint.capture(original), "Continuation preserves deck, next hand RNG and settlement")
			verify(original.state.status == "finished", "Resumed table completes")
			var copy := Checkpoint.restore(Checkpoint.capture(original))
			verify(not copy.advance(copy.revision), "Saved terminal table cannot settle twice")
	verify(Checkpoint.restore({}) == null, "Malformed snapshot rejected")
	DirAccess.remove_absolute(path)
	print("TABLE_CHECKPOINT ", JSON.stringify({"checks": checks, "failed": failures.size(), "failures": failures}))
	quit(0 if failures.is_empty() else 1)

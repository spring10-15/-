extends SceneTree
const Table = preload("res://three_d/rules/table.gd")
func normalize(value: Variant) -> Variant:
	if value is Dictionary:
		for key in value:
			value[key] = normalize(value[key])
	elif value is Array:
		for i in range(value.size()):
			value[i] = normalize(value[i])
	elif value is float and value == floor(value):
		return int(value)
	return value
func project(state: Dictionary) -> Dictionary:
	var snapshot := {}
	for key in ["pot","currentBet","street","community","turnCounter","raiseUsed","firstAggressionDiscountAvailable","toAct","currentActorId"]:
		snapshot[key] = state[key]
	snapshot.players = []
	for player in state.players:
		var filtered := {}
		for key in ["id","stack","currentBet","handContribution","folded","holeCards"]:
			filtered[key] = player[key]
		snapshot.players.append(filtered)
	return snapshot
func _initialize() -> void:
	var fixtures: Array = normalize(JSON.parse_string(FileAccess.get_file_as_string("res://three_d/tests/table-fixtures.json")))
	var failures: Array = []
	var deliberate_differences := 0
	for i in range(fixtures.size()):
		var entry: Dictionary = fixtures[i]
		var game := Table.new()
		game.start(entry.before.tableDef, 1)
		game.state = entry.before.duplicate(true)
		if not game.act(entry.id, entry.kind, game.revision):
			failures.append({"case":i,"error":"rejected"})
			continue
		if game.state.status == "playing" and game.state.currentActorId == "" and (game.state.street != entry.expected.street or entry.resolved):
			game.advance(game.revision)
		if entry.has("intentionalDifference"):
			deliberate_differences += 1
			entry.expected.toAct = []
			entry.expected.currentActorId = ""
		var actual := project(game.state)
		if actual != entry.expected:
			var different: Array = []
			for key in actual:
				if actual[key] != entry.expected[key]:
					different.append(key)
			failures.append({"case":i,"fields":different,"actual":actual,"expected":entry.expected})
	var report := {"cases":fixtures.size(),"documented_rule_corrections":deliberate_differences,"failed":failures.size(),"failures":failures}
	var file := FileAccess.open("res://../output/3d/table-parity.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(report,"  "))
	file.close()
	print("TABLE_PARITY cases=", fixtures.size(), " failed=", failures.size())
	quit(0 if failures.is_empty() else 1)

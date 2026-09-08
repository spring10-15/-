extends RefCounted
const TableRules = preload("res://three_d/rules/table.gd")
const Poker = preload("res://three_d/rules/poker.gd")

static func capture(table: RefCounted) -> Dictionary:
	return {"state": table.state.duplicate(true), "revision": table.revision, "rngValue": table.rng.value}

static func restore(snapshot: Dictionary) -> RefCounted:
	if not snapshot.get("state") is Dictionary or not snapshot.get("revision") is int or not snapshot.get("rngValue") is int:
		return null
	var table := TableRules.new()
	table.state = snapshot.state.duplicate(true)
	table.revision = snapshot.revision
	table.rng = Poker.DeterministicRng.new(0)
	table.rng.value = snapshot.rngValue
	return table

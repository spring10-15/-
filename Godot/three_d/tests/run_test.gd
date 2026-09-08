extends SceneTree
const RunRules = preload("res://three_d/rules/run.gd")
var checks := 0
var failures: Array[String] = []

func verify(condition: bool, description: String) -> void:
	checks += 1
	if not condition:
		failures.append(description)
		push_error(description)

func _initialize() -> void:
	var content: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://three_d/rules/content.json"))
	var session := RunRules.new(content)
	verify(session.vault == 1200, "Browser initial vault")
	verify(not session.extract(0), "No extraction without a run")
	verify(session.enter_table(1, 0) == null, "No table outside a run")
	verify(not session.start(99), "Stale run start rejected")
	for seed_value in range(30):
		if session.vault < 120:
			verify(session.reset_demo(session.revision), "Explicit broke-demo reset")
		var before := session.vault
		var amount := mini(300, before)
		var start_revision := session.revision
		verify(session.start(start_revision), "Run starts")
		verify(not session.start(start_revision), "Duplicate start rejected")
		verify(session.vault == before - amount and session.cash == amount, "Run transfer conserves cash")
		verify(not session.reset_demo(session.revision), "Active run cannot reset bankroll")
		verify(not session.extract(session.revision), "Unknown exit rejected")
		verify(session.discover_exit(), "Exit discovered")
		verify(not session.discover_exit(), "Exit discovery is idempotent")
		var stale_quote := session.extraction_quote()
		var game := session.enter_table(seed_value, session.revision)
		verify(game != null and session.cash == amount - 60 and session.heat == 1, "Buy-in and heat charged")
		verify(session.enter_table(seed_value, session.revision) == null, "Concurrent table rejected")
		verify(not session.extract(stale_quote.revision), "Old extraction quote cannot exit active table")
		verify(not session.settle_table(session.revision), "Unfinished table cannot settle")
		var steps := 0
		while game.state.status != "finished" and steps < 200:
			steps += 1
			if game.state.status == "hand_over":
				game.next_hand(game.revision)
			elif game.state.currentActorId.is_empty():
				game.advance(game.revision)
			else:
				var id: String = game.state.currentActorId
				var legal: Dictionary = game.legal_actions(id)
				game.act(id, "check" if legal.check else ("call" if legal.call else "all-in"), game.revision)
		verify(game.state.status == "finished", "Seeded table terminates")
		var returned: int = game.state.players[0].stack
		verify(session.settle_table(session.revision), "Terminal table returns funds")
		verify(not session.settle_table(session.revision), "Terminal table cannot return funds twice")
		verify(session.cash == amount - 60 + returned, "Exact table proceeds credited")
		verify(session.enter_table(seed_value, session.revision) == null, "Completed table cannot replay this run")
		var cash := session.cash
		var fee := 24 + int(floor(cash * 0.12))
		var quote := session.extraction_quote()
		verify(quote.fee == fee and quote.net == cash - fee, "Smoky den fee matches browser formula")
		verify(session.extract(quote.revision), "Known affordable exit succeeds")
		verify(not session.extract(quote.revision), "Exit cannot be paid twice")
		verify(session.vault == before - 60 + returned - fee and session.cash == 0, "Full run conservation including fee and poker profit")
		verify(session.last_result.profit == returned - 60 - fee, "Result displays net run profit")
	var edge := RunRules.new(content)
	edge.vault = 119
	verify(not edge.start(0), "Minimum bankroll enforced")
	edge.vault = 120
	verify(edge.start(0) and edge.cash == 120 and edge.vault == 0, "Partial bankroll allowed")
	edge.discover_exit()
	edge.cash = 23
	verify(not edge.extract(edge.revision), "Unaffordable fee rejected")
	edge.cash = 300
	edge.heat = 5
	verify(edge.extraction_quote().fee == 105, "Heat-five surcharge matches smoky den")
	edge.heat = 6
	verify(not edge.extract(edge.revision), "Lockdown closes public exit")
	var report := {"checks": checks, "failed": failures.size(), "failures": failures}
	var output := ProjectSettings.globalize_path("res://../output/3d")
	DirAccess.make_dir_recursive_absolute(output)
	var file := FileAccess.open(output.path_join("run-rules.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "  "))
	file.close()
	print("RUN_RULES ", JSON.stringify(report))
	quit(0 if failures.is_empty() else 1)

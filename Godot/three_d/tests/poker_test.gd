extends SceneTree
const Poker = preload("res://three_d/rules/poker.gd")
var checked := 0
var failed: Array[String] = []
func verify(ok: bool, description: String) -> void:
	checked += 1
	if not ok:
		failed.append(description)
		push_error(description)
func card(rank: int, suit: String) -> Dictionary:
	return {"rank": rank, "suit": suit}
func person(id: String, seat: int, contribution: int, hole: Array, folded := false) -> Dictionary:
	return {"id": id, "seatIndex": seat, "handContribution": contribution, "holeCards": hole, "folded": folded}
func normalize_json(value: Variant) -> Variant:
	# JSON numbers decode as floats; card ranks and seed values are integers.
	if value is Dictionary:
		for key in value:
			value[key] = normalize_json(value[key])
	elif value is Array:
		for i in range(value.size()):
			value[i] = normalize_json(value[i])
	elif value is float and value == floor(value):
		return int(value)
	return value

func _initialize() -> void:
	var fixtures: Dictionary = normalize_json(JSON.parse_string(FileAccess.get_file_as_string("res://three_d/tests/poker-fixtures.json")))
	for i in range(fixtures.hands.size()):
		var entry: Dictionary = fixtures.hands[i]
		var result := Poker.evaluate_best_hand(entry.cards)
		verify(result.rank == entry.expected.rank and result.values == entry.expected.values and result.name == entry.expected.name, "Hand parity %d" % i)
	for i in range(fixtures.comparisons.size()):
		var entry: Dictionary = fixtures.comparisons[i]
		verify(signi(Poker.compare_hands(entry.a, entry.b)) == entry.expected, "Comparison parity %d" % i)
	for entry in fixtures.random:
		var rng := Poker.DeterministicRng.new(int(entry.seed))
		for expected in entry.expected:
			verify(absf(rng.next() - expected) < 1e-15, "RNG parity seed %d" % entry.seed)
	for entry in fixtures.decks:
		verify(Poker.shuffle_deck(Poker.create_deck(), Poker.DeterministicRng.new(int(entry.seed))) == entry.expected, "Shuffled deck parity seed %d" % entry.seed)
	var board := [card(2,"C"),card(3,"D"),card(7,"H"),card(9,"S"),card(11,"C")]
	var players := [person("a",0,50,[card(14,"S"),card(14,"H")]),person("b",1,100,[card(13,"S"),card(13,"H")]),person("c",2,100,[card(12,"S"),card(12,"H")])]
	var result := Poker.settle_pots(players, board)
	verify(result.awards == {"a":150,"b":100,"c":0}, "Short-stack winner cannot take side pot")
	verify(result.pots.size() == 2 and result.pots[0].amount == 150 and result.pots[1].amount == 100, "Contributions split into correct layers")
	players[0].folded = true
	result = Poker.settle_pots(players, board)
	verify(result.awards == {"a":0,"b":250,"c":0}, "Folded chips stay in pot but folded player cannot win")
	players[0].folded = false
	players[0].handContribution = 150
	result = Poker.settle_pots(players, board)
	verify(result.awards == {"a":350,"b":0,"c":0}, "Unmatched excess contribution returns to owner")
	var royal := [card(10,"S"),card(11,"S"),card(12,"S"),card(13,"S"),card(14,"S")]
	players = [person("a",0,5,[card(2,"H"),card(3,"H")]),person("b",1,5,[card(4,"H"),card(5,"H")]),person("c",2,5,[card(6,"H"),card(7,"H")],true)]
	result = Poker.settle_pots(players, royal)
	verify(result.awards == {"a":8,"b":7,"c":0}, "Tied showdown awards odd chip in existing seat order")
	players = [person("a",0,0,[card(2,"H"),card(3,"H")]),person("b",1,0,[card(4,"H"),card(5,"H")])]
	result = Poker.settle_pots(players, royal)
	verify(result.pots.is_empty() and result.awards == {"a":0,"b":0}, "Zero contributions create no money")
	# Many valid contribution shapes: a live maximum contributor guarantees eligible pots.
	var rng := Poker.DeterministicRng.new(72)
	for i in range(100):
		var amounts := [1 + int(rng.next()*100),1 + int(rng.next()*100),1 + int(rng.next()*100)]
		players = [person("a",0,amounts[0],[card(14,"S"),card(14,"H")]),person("b",1,amounts[1],[card(13,"S"),card(13,"H")]),person("c",2,amounts[2],[card(12,"S"),card(12,"H")])]
		result = Poker.settle_pots(players, board)
		verify(result.awards.a + result.awards.b + result.awards.c == amounts[0] + amounts[1] + amounts[2], "Chip conservation %d" % i)
	var output := ProjectSettings.globalize_path("res://../output/3d")
	DirAccess.make_dir_recursive_absolute(output)
	var report := {"checks":checked,"failed":failed.size(),"failures":failed,"scope":"Hand evaluation, comparison, browser-compatible RNG/shuffle and side-pot accounting; full betting state machine not yet migrated"}
	var file := FileAccess.open(output.path_join("poker-rules.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "  "))
	file.close()
	print("POKER_RULES ", JSON.stringify(report))
	quit(0 if failed.is_empty() else 1)

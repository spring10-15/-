extends Area3D
## An interaction anchor; the world owns actions, this node owns targeting only.
@export var action_id: StringName
@export var title := ""
@export var enabled := true
@export var disabled_reason := ""

func prompt() -> String:
	return "E  ·  " + title if enabled else disabled_reason

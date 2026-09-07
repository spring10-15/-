#!/bin/zsh
# Launch the new 3D entry without requiring the Godot editor.
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
exec /Applications/Godot.app/Contents/MacOS/Godot --path "$project_dir" --scene res://three_d/scenes/main.tscn

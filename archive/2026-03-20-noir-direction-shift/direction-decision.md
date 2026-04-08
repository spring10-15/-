# Noir Direction Shift

Date: 2026-03-20

## Decision

The project is officially shifting away from a finished-target pixel-noir presentation.

The new target style is:

- noir tavern illustration
- pseudo-2.5D scene staging
- fixed cinematic camera per mode
- tactical UI layered above the scene

## Why

The supplied reference images demonstrated a better fit for the game's real strengths:

- danger and atmosphere in the bar
- pressure and intimacy at the table
- cinematic consequence during extraction

This direction better supports the fantasy of:

- carrying money and contraband through a dangerous venue
- reading rooms and exits
- feeling watched, cornered, and lucky to get out

## What Changes Right Now

- Scene layer begins migrating first
- Pixel prototype layout remains useful as a systems shell
- UI readability remains protected during the migration
- The project is not becoming a free-roam 3D game

## What Stays True

- search -> play -> search -> play -> extract remains the core loop
- the game still uses controlled screens, not exploration spaces
- the scene should support the UI, not replace it
- poker readability remains more important than visual purity

## First Migration Step Completed

- menu/search use the tavern overview scene
- table uses the table-view scene
- summary uses the extraction alley scene
- scene grading and cropping now happen in-canvas

## Next Recommended Step

Reskin the current panel shell so it feels less like a pixel prototype and more like:

- ledger paper
- route slips
- tabletop dossiers
- evidence cards

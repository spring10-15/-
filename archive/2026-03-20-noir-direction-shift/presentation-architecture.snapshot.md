# Presentation Architecture v2

## Goal

Define how the game should present as a noir illustrated, mode-driven tactical drama without turning into a free-roam 3D sim.

This document answers:

- what each mode's camera should do
- what belongs in scene art versus UI
- how the current prototype should evolve from placeholder pixel staging into illustrated scene plates
- how to keep later art replacements low-risk

## High-Level Strategy

The game should present as:

- `scene-first tactical drama`
- `illustrated noir spaces`
- `fixed cinematic cameras`
- `explicit but embedded interaction overlays`

The chosen implementation direction for the prototype is now:

- illustrated background plate per mode
- controlled crop and grade in canvas
- DOM interaction overlay on top
- lightweight feedback layer above both

This means:

- the player always feels inside one dangerous venue and its adjacent escape spaces
- every mode gets a distinct lens, not just a different panel layout
- UI remains readable and direct, but the scene carries much more of the fantasy

## Core Screen Stack

Every major screen should still use 3 layers.

### Layer 1: Scene Layer

Role:

- painted or composited room view
- lighting, smoke, mirror, street, or back-room identity
- heat expression through grade, edge pressure, and threat presence

Implementation form:

- canvas-driven scene plate
- current build uses user-supplied reference illustrations as stand-in background plates
- later builds can replace those with bespoke painted scenes, foreground planes, and animated accents

Rule:

- this layer sells place, tone, and danger
- it should not hold critical click targets

### Layer 2: Interaction Layer

Role:

- ledgers
- inventory
- table controls
- destination cards
- extraction decisions
- settlement records

Implementation form:

- DOM panels over the scene
- still explicit and tactical
- gradually reskinned to feel like physical objects in the world

Rule:

- everything important to click still lives here
- readability wins over purity

### Layer 3: Feedback Layer

Role:

- toasts
- item reads
- handoff overlays
- room traces
- warnings and short-lived reinforcement states

Implementation form:

- transient overlays and compact banners

Rule:

- brief, contextual, and non-structural

## Mode Camera Architecture

## 1. Menu

Presentation:

- a threshold into the bar world
- not a plain utility screen

Camera:

- wide tavern overview
- room depth visible
- invitation tone rather than pressure tone

Current stand-in:

- [德扑酒馆全貌.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑酒馆全貌.png)

## 2. Search

Presentation:

- a strategic wide room view
- the player reads people, counters, tables, and exits at once

Camera:

- broad interior composition
- ideal for stash, intel, shop, and route planning

Current stand-in:

- [德扑酒馆全貌.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑酒馆全貌.png)

Screen purpose:

Search should answer:

1. What do I have?
2. What is safe?
3. What can I do before I sit or leave?
4. Which route is really worth the risk right now?

## 3. Table

Presentation:

- intimate pressure view
- the player should feel seated at the table, not looking at a board from far away

Camera:

- near-table perspective
- players, chips, cards, and props are close and psychologically sharp

Current stand-in:

- [德扑牌桌视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑牌桌视角.png)

Rule:

- this mode may be more dramatic than search, but must remain the most mechanically readable screen in the whole game

## 4. Extraction / Summary

Presentation:

- service exits, alleys, backlifts, or compromised escape spaces
- commitment and aftermath, not sandbox movement

Camera:

- directional, narrow, consequential

Current stand-in:

- [德扑撤离视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑撤离视角.png)

Rule:

- extraction should feel decisive without becoming an action minigame

## Information Split

Put these in the scene layer:

- room identity
- camera mood
- heat pressure
- public vs private vs desperate exit feeling
- whether a table feels rough, refined, or dangerous

Put these in the interaction layer:

- exact cash
- stash values
- item values
- legal actions
- route costs
- reward and collateral math

Put these in the feedback layer:

- item reads
- table cues
- room handoff overlays
- room trace results
- extraction warnings

## Heat Expression

Heat should now read through scene grading, not only through UI accents.

- Safe:
  - warmer interior grade
  - more breathable shadows
- Pressured:
  - cooler edge spill
  - more observation, less comfort
- Dangerous:
  - harder contrast
  - more cyan and red threat signals
- Lockdown:
  - severe edge compression
  - visually fewer “friendly” exits

## Current Migration Rule

The migration order is:

1. Replace pixel scene backgrounds with illustrated scene plates
2. Keep current tactical UI intact while readability is preserved
3. Reskin panels and controls to feel more like ledgers, route slips, and tabletop objects
4. Add selective 2.5D motion layers only after the static scene grammar is stable

## What We Are Not Doing

- full 3D free movement
- explorable tavern navigation
- action-extraction gameplay
- expensive full-character animation before the core scene language is locked

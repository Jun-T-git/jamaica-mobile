# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Modern Jamaica** (モダンジャマイカ) is a React Native mathematical puzzle game where players construct expression trees to reach target numbers using exactly 5 given numbers (1-6) and mathematical operations (+, -, ×, ÷).

## Development Commands

```bash
# Start development
npm start                    # Start Metro bundler
npm run android             # Build and run Android app
npm run ios                 # Build and run iOS app (requires Xcode)

# Code Quality 
npm run lint                # Run ESLint
npm test                    # Run Jest tests

# iOS Setup (if needed)
bundle install              # Install Ruby dependencies
bundle exec pod install    # Install CocoaPods dependencies
```

## Architecture Overview

### State Management
- **Zustand store** (`src/store/gameStore.ts`) manages all game state
- Central store handles game modes, problem generation, node connections, and statistics
- No Redux - uses Zustand for simplicity and performance

### Expression Tree System
- **TreeNode classes** (`src/models/TreeNode.ts`) implement mathematical expression trees
- `LeafNode`: Initial numbers (1-6)
- `InternalNode`: Operations combining two child nodes 
- `ExpressionTree`: Container with evaluation and validation methods
- Players build trees by connecting nodes with operators until one root node remains

### Game Flow Architecture
```
Problem Generation → Node Display → User Tree Building → Validation → Next Problem
```

### Screen Navigation
- `ModeSelectionScreen`: Choose Challenge or Infinite mode
- `ChallengeModeScreen`: Timed gameplay with scoring
- `InfiniteModeScreen`: Practice mode with statistics
- All screens use custom headers (headerShown: false)

## Key Technical Patterns

### Node Connection Logic
The core game mechanic in `gameStore.ts` `connectNodes()`:
1. Validates two unconnected nodes can be combined
2. Calculates result based on selected operator
3. Creates new `InternalNode` with result value
4. Marks original nodes as "used" (becomes children)
5. Updates tree positioning and checks for puzzle completion

### Problem Generation Strategy
Two approaches in `utils/problemGenerator.ts`:
- **Exhaustive search**: Generate random numbers/targets until valid solution exists
- **Reverse generation**: Build expression tree backwards from target value
- Problems validated for solvability, reasonable difficulty, and numerical variety

### Game State Structure
```typescript
// Current puzzle state
nodes: NodeData[]           // All tree nodes with positioning
currentProblem: ProblemData // 5 numbers + target + solutions
selectedNodeId: string     // Currently selected node for connection

// Mode-specific state  
challengeState: ChallengeState  // Timer, problem count, resets
infiniteStats: InfiniteStats    // Accuracy, streaks, timing
```

## Current Development Status

### Completed Foundation
- Complete game logic and state management
- Problem generation with difficulty balancing
- Screen navigation and mode switching
- Timer system for challenge mode
- Statistics tracking for infinite mode
- TypeScript types and mathematical models

### Missing Core UI (Primary Development Need)
- **Interactive tree building interface** - Currently shows placeholder text
- Drag-and-drop node connection system using react-native-gesture-handler
- Visual representation of expression tree growth
- Node selection and operator choice interface
- Animation system for tree construction using react-native-reanimated

### Architecture Notes for UI Development
- `NodeData` interface includes `position: {x, y}` for UI placement
- Tree depth calculation determines visual hierarchy
- `isUsed` flag controls node interaction availability
- Color schemes defined per mode in `constants/index.ts`
- Japanese UI text throughout - maintain consistency

## Special Considerations

### Japanese Localization
All UI text is in Japanese. Key terms:
- チャレンジモード (Challenge Mode)
- 無限に遊ぶモード (Infinite Mode) 
- 目標 (Target)
- 問題数 (Problem Count)
- リセット (Reset)

### Game Balance Configuration
Timer and difficulty settings in `constants/index.ts`:
- Challenge mode: 60s initial + 30s per correct answer
- Numbers: Always exactly 5, ranging 1-6
- Targets: Range 10-60 with guaranteed solutions
- Reset limit: 2 per challenge game

### Tree Building UX Requirements
Based on design document, the core mechanic should feel like "growing a tree":
- Visual tree growth animations
- Intuitive node connection (drag-and-drop or tap-select)
- Clear parent-child relationships in visual layout
- Smooth layout adjustments as tree expands upward
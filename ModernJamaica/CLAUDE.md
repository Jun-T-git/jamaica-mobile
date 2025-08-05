# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Modern Jamaica** (モダンジャマイカ/ジャマイカの木) is a React Native 0.80.2 mathematical puzzle game where players construct expression trees to reach target numbers using exactly 5 given numbers (1-6) and mathematical operations (+, -, ×, ÷).

## Development Commands

```bash
# Start development
npm start                    # Start Metro bundler
npm run android             # Build and run Android app
npm run ios                 # Build and run iOS app (requires Xcode)

# Code Quality 
npm run lint                # Run ESLint
npm test                    # Run Jest tests
npm test -- --coverage      # Run tests with coverage

# iOS Setup (if needed)
cd ios
bundle install              # Install Ruby dependencies
bundle exec pod install     # Install CocoaPods dependencies
cd ..
```

## Architecture Overview

### Technology Stack
- **React Native 0.80.2** with TypeScript
- **Zustand** for state management (no Redux)
- **React Navigation 7.x** for screen navigation
- **react-native-gesture-handler** for touch interactions
- **react-native-google-mobile-ads** for monetization
- **react-native-sound** for audio feedback

### Project Structure
```
src/
├── components/          # Atomic design pattern
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Combined components
│   └── organisms/      # Complex features
├── screens/            # Main game screens
├── store/              # Zustand stores
├── utils/              # Core game logic
├── types/              # TypeScript definitions
├── constants/          # Game configuration
├── config/             # Mode configurations
├── design/             # Design system themes
├── hooks/              # Custom React hooks
└── services/           # External services
```

### State Management Architecture
- **gameStore.ts**: Central store managing all game state
  - Supports both Challenge and Infinite modes in unified state
  - Handles timer, scores, problem generation, node connections
  - Undo/Redo with full history tracking
  - Real-time validation and combo scoring
- **settingsStore.ts**: User preferences and sound toggles
- No prop drilling - use Zustand hooks directly in components

### Expression Tree System
Core game mechanics in `utils/` and `store/gameStore.ts`:
- **Node Data Structure**: Each node has position, value, depth, parent/child relationships
- **Tree Building**: `connectNodes()` validates connections, calculates results, creates InternalNodes
- **Problem Types**: Addition-only, Multiplication-only, Mixed operations
- **Tree Validation**: Checks single root node equals target value

### Game Flow Architecture
```
Mode Selection → Problem Generation → Node Display → Tree Building → Validation → Next/Score
```

## Key Technical Patterns

### Node Connection Logic
The `connectNodes()` function in gameStore:
1. Validates two nodes can be combined (not already used)
2. Calculates result based on selected operator
3. Creates new InternalNode with calculated value
4. Marks original nodes as "used" (become children)
5. Updates tree structure and checks completion

### Problem Generation Strategy
Three problem types in `utils/problemGenerator.ts`:
- **Addition Problems**: Sum-based targets
- **Multiplication Problems**: Product-based targets  
- **Mixed Problems**: Combination of operations
- Configurable difficulty and target ranges per mode
- Validates all problems have solutions

### Game Mode Configuration
Mode-specific settings in `config/gameMode.ts`:
- **Challenge Mode**: 60s initial + 10s bonus, 2 skips, score tracking
- **Infinite Mode**: 5 minute total, unlimited skips, statistics focus
- Each mode has distinct color themes and UI treatments

### Design System
Modern dark theme with atomic design pattern:
- Glass morphism effects and gradients
- Mode-specific color palettes (orange/purple)
- Consistent spacing and typography scales
- Accessibility-focused contrast ratios

## Current Development Status

### Completed Foundation
- Complete game logic and mathematical models
- State management with Zustand
- Navigation and screen structure
- Timer and scoring systems
- Sound effects integration
- AdMob ad service setup
- TypeScript types throughout

### Critical Missing UI Components
The game logic is complete but needs interactive UI:
- **GameBoard visual tree builder** - Currently shows placeholder
- **Drag-and-drop node connections** using gesture handlers
- **Visual expression tree representation** with node hierarchy
- **Operator selection interface** for choosing +, -, ×, ÷
- **Tree growth animations** using react-native-reanimated
- **Node selection states** and visual feedback

### Implementation Notes for UI Development
- `NodeData` includes `position: {x, y}` ready for visual placement
- Tree depth calculation available for hierarchy layout
- `isUsed` flag controls interaction availability
- Mode-specific themes in `design/themes.ts`
- All text in Japanese - maintain localization

## Sound System
Audio feedback managed by `services/soundService.ts`:
- Six sound effects: button, connect, countdown, start, success, tap
- User-configurable via settings
- Preloaded for performance

## AdMob Integration
- Full SDK integration with banner and interstitial ad support
- Service abstraction in `services/adService.ts`
- Privacy configuration in iOS Info.plist

## Testing Approach
- Jest with React Native preset
- Problem generator unit tests
- Mock SVG components for testing
- Japanese comments in test files

## Japanese Localization
All UI text is in Japanese. Key terms:
- チャレンジモード (Challenge Mode)
- 無限に遊ぶ (Infinite Play)
- 目標 (Target)
- スキップ (Skip)
- やり直す (Undo)

## Development Priorities
1. Implement interactive GameBoard component
2. Add visual tree representation
3. Create node connection animations
4. Build operator selection UI
5. Test complete gameplay flow
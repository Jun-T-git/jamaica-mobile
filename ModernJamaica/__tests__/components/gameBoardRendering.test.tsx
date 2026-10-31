import React, { Profiler } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

jest.mock('react-native-vector-icons/MaterialIcons', () => jest.fn(() => null));
import { GameBoard } from '../../src/components/organisms/GameBoard';
import { useGameStore } from '../../src/store/gameStore';
import { GameMode } from '../../src/types';

jest.mock('../../src/store/gameStore', () => ({
  useGameStore: require('zustand').create(() => ({
    nodes: [1, 2, 3, 4, 4].map((value, index) => ({
      id: `leaf-${index}`, value, position: { x: 0, y: 0 },
      isLeaf: true, depth: 0, isUsed: false,
    })),
    connectNodes: jest.fn(),
    undoLastMove: jest.fn(),
    canUndo: () => false,
    skipProblem: jest.fn(),
    gameState: {
      mode: 'challenge', currentCombo: 0, comboExpiresAt: 0,
      skipCount: 2, timeLeft: 90,
    },
    wrongAnswerCount: 0,
  })),
}));
jest.mock('../../src/utils/SoundManager', () => ({
  soundManager: { play: jest.fn() }, SoundType: { TAP: 'tap' },
}));
jest.mock('../../src/services/hapticService', () => ({
  hapticService: { selection: jest.fn() },
}));

let tree: ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
});

test.each([[320, 568], [390, 844], [768, 1024]])('幅%d・高さ%dの盤面で各段を等間隔に保ち、高さ上限と領域の縮小に追随する', (width, screenHeight) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: screenHeight, scale: 2, fontScale: 1 });
  const leaves = [1, 2, 3, 4, 5].map((value, index) => ({
    id: `leaf-${index}`, value, position: { x: 0, y: 0 },
    isLeaf: true, depth: 0, isUsed: true,
  }));
  const parents = [0, 1, 2, 3].map(index => ({
    id: `parent-${index}`, value: 20 + index, position: { x: 0, y: 0 },
    isLeaf: false, depth: index + 1, isUsed: index < 3,
    leftChildId: index === 0 ? 'leaf-0' : `parent-${index - 1}`,
    rightChildId: `leaf-${index + 1}`, operator: '+' as const,
  }));
  act(() => { useGameStore.setState({ nodes: [...leaves, ...parents] }); });
  act(() => { tree = create(<GameBoard gameInfo={{ target: 23, instruction: '' }} />); });
  const area = () => tree.root.findByProps({ testID: 'game-tree-area' });
  const minimumHeight = StyleSheet.flatten(area().props.style).minHeight;
  const measure = (height: number) => {
    act(() => area().props.onLayout({ nativeEvent: { layout: { height } } }));
    const nodeStyles = tree.root.findAllByType(TouchableOpacity)
      .map(button => StyleSheet.flatten(button.props.style))
      .filter(style => typeof style?.top === 'number');
    const levels = [...new Set(nodeStyles.map(style => style.top as number))].sort((a, b) => a - b);
    expect(levels).toHaveLength(5);
    const step = levels[1] - levels[0];
    levels.slice(1).forEach((top, index) => expect(top - levels[index]).toBeCloseTo(step));
    expect(step).toBeGreaterThan(nodeStyles[0].height * 1.15);
    // 各円は盤面内に収まり、計測後も最小高さが増殖しない。
    expect(levels[4] - levels[0] + nodeStyles[0].height).toBeLessThanOrEqual(height);
    expect(StyleSheet.flatten(area().props.style).minHeight).toBe(minimumHeight);
    return step;
  };
  const smallStep = measure(minimumHeight);
  const cappedStep = measure(minimumHeight + 200);
  expect(cappedStep).toBeGreaterThanOrEqual(smallStep);
  if (width < 768) expect(cappedStep).toBeGreaterThan(smallStep);
  // 広い領域でも木を伸ばし続けず、上下の余白を増やす。
  expect(measure(minimumHeight + 1000)).toBeCloseTo(cappedStep);
  if (width < 768) {
    const nodeSize = tree.root.findAllByType(TouchableOpacity)
      .map(button => StyleSheet.flatten(button.props.style))
      .find(style => typeof style?.top === 'number').height;
    expect(cappedStep * 4 + nodeSize).toBeCloseTo(380);
  }
  expect(measure(minimumHeight)).toBeCloseTo(smallStep);
});

test('残り時間だけの更新では盤面を再描画せず、スキップ残数とモード変更には追随する', () => {
  const onRender = jest.fn();
  const gameInfo = { target: 20, instruction: '最初の数字をタップしてください' };
  const render = () => (
    <Profiler id="board" onRender={onRender}>
      <GameBoard gameInfo={gameInfo} />
    </Profiler>
  );
  act(() => { tree = create(render()); });
  onRender.mockClear();
  (MaterialIcons as unknown as jest.Mock).mockClear();

  act(() => {
    const { gameState } = useGameStore.getState();
    useGameStore.setState({ gameState: { ...gameState, timeLeft: 89 } });
  });
  expect(onRender).not.toHaveBeenCalled();

  // 親のヘッダー更新でも同じpropsの盤面は再描画しない。
  act(() => { tree.update(render()); });
  expect(MaterialIcons).not.toHaveBeenCalled();

  act(() => {
    const { gameState } = useGameStore.getState();
    useGameStore.setState({ gameState: { ...gameState, skipCount: 0 } });
  });
  expect(onRender).toHaveBeenCalled();
  const skipButton = () => tree.root.findAllByType(TouchableOpacity).find(button =>
    button.findAllByProps({ name: 'skip-next' }).length > 0,
  )!;
  expect(skipButton().props.disabled).toBe(true);

  act(() => {
    const { gameState } = useGameStore.getState();
    useGameStore.setState({ gameState: { ...gameState, mode: GameMode.INFINITE } });
  });
  expect(skipButton().props.disabled).toBe(false);

  // メモ化後もストア側の盤面変更は表示に反映する。
  act(() => {
    const { nodes } = useGameStore.getState();
    useGameStore.setState({ nodes: nodes.map((node, index) =>
      index === 0 ? { ...node, value: 10 } : node,
    ) });
  });
  expect(tree.root.findAllByType(Text).some(text => text.props.children === 10)).toBe(true);
});

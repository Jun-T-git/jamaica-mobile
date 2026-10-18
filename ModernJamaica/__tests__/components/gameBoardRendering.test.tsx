import React, { Profiler } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
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

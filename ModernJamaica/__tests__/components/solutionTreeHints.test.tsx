import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { SolutionTree } from '../../src/components/molecules/SolutionTree';
import { findSolutionExample } from '../../src/utils/solutionExample';

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode }) => require('react').createElement('Svg', {}, props.children),
  Line: (props: object) => require('react').createElement('Line', props),
}));

test('ヒント1〜3は計算を各段階まで描き、答えで4段階すべて描く', () => {
  const numbers = [4, 4, 1, 2, 3];
  const solution = findSolutionExample({ numbers, target: 15 })!;
  let tree: ReactTestRenderer;
  const render = (stage: number) => <SolutionTree root={solution.tree} numbers={numbers} target={15} showAnswer
    revealSteps={stage} steps={solution.steps} expression={solution.expression} />;
  act(() => { tree = create(render(1)); });
  const image = tree!.root.findByProps({ accessibilityRole: 'image' });
  act(() => image.props.onLayout({ nativeEvent: { layout: { width: 320 } } }));
  for (const stage of [1, 2, 3, 4]) {
    act(() => tree!.update(render(stage)));
    expect(tree!.root.findAllByType('Line' as never)).toHaveLength(stage * 2);
    expect(tree!.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel)
      .toContain(solution.steps[stage - 1]);
    if (stage < 4) expect(tree!.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel)
      .not.toContain(solution.steps[stage]);
  }
  act(() => tree!.unmount());
});

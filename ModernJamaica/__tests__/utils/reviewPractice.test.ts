import { combinePracticeNodes, createPracticeNodes, practiceHistoryFromHint } from '../../src/utils/reviewPractice';
import { findSolutionExample } from '../../src/utils/solutionExample';

test('復習の局所盤面で5数字を1回ずつ使い、途中結果から正解まで計算できる', () => {
  const initial = createPracticeNodes([1, 2, 3, 4, 5]);
  let nodes = initial;
  let currentId = 'leaf-0';
  for (let index = 1; index < 5; index++) {
    const move = combinePracticeNodes(nodes, currentId, `leaf-${index}`, '+', 15);
    expect(move).not.toBeNull();
    expect(move!.result).toBe(index === 4 ? 'correct' : 'progress');
    nodes = move!.nodes;
    currentId = `step-${index}`;
  }
  expect(nodes.filter(node => !node.used)).toHaveLength(1);
  expect(nodes.find(node => !node.used)?.value).toBe(15);
  expect(initial.every(node => !node.used)).toBe(true);
});

test('同じノードの再利用と0での除算は盤面を変えない', () => {
  const nodes = createPracticeNodes([2, 2, 3, 4, 5]);
  expect(combinePracticeNodes(nodes, 'leaf-0', 'leaf-0', '+', 20)).toBeNull();
  const zero = combinePracticeNodes(nodes, 'leaf-0', 'leaf-1', '-', 20)!.nodes;
  expect(combinePracticeNodes(zero, 'leaf-2', 'step-1', '÷', 20)).toBeNull();
});

test('3段階のヒント盤面を操作履歴として再現できる', () => {
  const numbers = [4, 4, 1, 2, 3];
  const target = 15;
  const solution = findSolutionExample({ numbers, target });
  expect(solution).not.toBeNull();
  for (const stage of [1, 2, 3]) {
    const history = practiceHistoryFromHint(numbers, target, solution!.tree, stage);
    expect(history).toHaveLength(stage + 1);
    expect(history![stage].filter(node => !node.used)).toHaveLength(5 - stage);
    expect(history![stage].filter(node => node.id.startsWith('step-'))).toHaveLength(stage);
    const next = practiceHistoryFromHint(numbers, target, solution!.tree, stage + 1);
    if (stage < 3) expect(next![stage]).toEqual(history![stage]);
  }
  expect(practiceHistoryFromHint(numbers, target, solution!.tree, 4)).toBeNull();
});

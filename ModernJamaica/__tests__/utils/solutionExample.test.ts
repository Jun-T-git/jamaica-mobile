import { findSolutionExample, SolutionTreeNode } from '../../src/utils/solutionExample';
import { generateProblem } from '../../src/utils/problemGenerator';
import { DifficultyLevel } from '../../src/types';

test.each(Object.values(DifficultyLevel))('生成された%sの問題の解答手順は数字を各1回消費して目標に到達する', difficulty => {
  let seed = 31;
  const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 12; i++) {
    const problem = generateProblem(difficulty, rng);
    const solution = findSolutionExample(problem);
    expect(solution).not.toBeNull();
    expect(solution!.steps).toHaveLength(4);
    const leaves: number[] = [];
    const sourceIndexes: number[] = [];
    const checkTree = (node: SolutionTreeNode): number => {
      if (!node.left && !node.right) {
        leaves.push(node.value);
        sourceIndexes.push(node.sourceIndex!);
        expect(problem.numbers[node.sourceIndex!]).toBe(node.value);
        return node.value;
      }
      expect(node.left).toBeDefined();
      expect(node.right).toBeDefined();
      expect(['＋', '×', '−', '÷']).toContain(node.operator);
      const left = checkTree(node.left!);
      const right = checkTree(node.right!);
      const result = node.operator === '＋' ? left + right
        : node.operator === '×' ? left * right
          : node.operator === '−' ? left - right
            : left / right;
      expect(result).toBe(node.value);
      expect(result).toBeGreaterThan(0);
      return result;
    };
    expect(checkTree(solution!.tree)).toBe(problem.target);
    expect(leaves.sort((a, b) => a - b)).toEqual([...problem.numbers].sort((a, b) => a - b));
    expect(sourceIndexes.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    const available = [...problem.numbers];
    for (const step of solution!.steps) {
      const [, left, op, right, result] = step.match(/^(\d+) ([＋×−÷]) (\d+) = (\d+)$/)!;
      const a = Number(left), b = Number(right), c = Number(result);
      for (const operand of [a, b]) {
        const index = available.indexOf(operand);
        expect(index).toBeGreaterThanOrEqual(0);
        available.splice(index, 1);
      }
      const expected = op === '＋' ? a + b : op === '×' ? a * b : op === '−' ? a - b : a / b;
      expect(c).toBe(expected);
      expect(c).toBeGreaterThan(0);
      available.push(c);
    }
    expect(available).toEqual([problem.target]);
  }
});
test('不正な問題や解のない問題は解答例を捏造しない', () => {
  expect(findSolutionExample({ numbers: [1, 2], target: 3 })).toBeNull();
  expect(findSolutionExample({ numbers: [1, 1, 1, 1, 1], target: 100 })).toBeNull();
});

test('元の数字の順で描ける解があれば、交差しにくい木を選ぶ', () => {
  const solution = findSolutionExample({ numbers: [4, 4, 1, 2, 3], target: 15 })!;
  const indexes = (node: SolutionTreeNode): number[] => {
    if (!node.left && !node.right) return [node.sourceIndex!];
    const values = [...indexes(node.left!), ...indexes(node.right!)].sort((a, b) => a - b);
    expect(values[values.length - 1] - values[0] + 1).toBe(values.length);
    return values;
  };
  expect(indexes(solution.tree)).toEqual([0, 1, 2, 3, 4]);
});

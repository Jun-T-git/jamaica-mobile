import type { SolutionTreeNode } from './solutionExample';

export type PracticeOperator = '+' | '-' | '×' | '÷';

export interface PracticeNode {
  id: string;
  value: number;
  level: number;
  column: number;
  used: boolean;
  operator?: PracticeOperator;
  leftId?: string;
  rightId?: string;
}

export type PracticeMove = { nodes: PracticeNode[]; result: 'progress' | 'correct' | 'wrong' } | null;

export const createPracticeNodes = (numbers: number[]): PracticeNode[] => numbers.map((value, index) => ({
  id: `leaf-${index}`, value, level: 0, column: index * 2, used: false,
}));

const calculate = (left: number, right: number, operator: PracticeOperator): number | null => {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '×') return left * right;
  return right === 0 ? null : left / right;
};

/** 復習専用の局所状態。スコア・制限時間・本番の gameStore には作用しない。 */
export function combinePracticeNodes(nodes: PracticeNode[], firstId: string, secondId: string,
  operator: PracticeOperator, target: number): PracticeMove {
  const first = nodes.find(node => node.id === firstId && !node.used);
  const second = nodes.find(node => node.id === secondId && !node.used);
  if (!first || !second || firstId === secondId) return null;
  const value = calculate(first.value, second.value, operator);
  if (value === null || !Number.isFinite(value)) return null;

  const level = Math.max(first.level, second.level) + 1;
  if (level > 4) return null;
  const occupied = nodes.filter(node => node.level === level).map(node => node.column);
  const midpoint = (first.column + second.column) / 2;
  const free = Array.from({ length: 9 }, (_, column) => column).filter(column => !occupied.includes(column));
  const spaced = free.filter(column => occupied.every(existing => Math.abs(existing - column) >= 2));
  const candidates = spaced.length ? spaced : free;
  if (!candidates.length) return null;
  const column = candidates.sort((a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint) || Math.abs(a - 4) - Math.abs(b - 4))[0];

  const next: PracticeNode[] = [
    ...nodes.map(node => node.id === firstId || node.id === secondId ? { ...node, used: true } : node),
    { id: `step-${nodes.length - 4}`, value, level, column, used: false, operator, leftId: firstId, rightId: secondId },
  ];
  const active = next.filter(node => !node.used);
  return { nodes: next, result: active.length > 1 ? 'progress' : Math.abs(value - target) < 0.001 ? 'correct' : 'wrong' };
}

/** ヒントの途中盤面を練習へ適用する際の履歴。元の練習を保持するかどうかは呼び出し側が決める。 */
export function practiceHistoryFromHint(numbers: number[], target: number, root: SolutionTreeNode, stage: number): PracticeNode[][] | null {
  if (!Number.isInteger(stage) || stage < 1 || stage > 3) return null;
  const history = [createPracticeNodes(numbers)];
  let step = 0;
  let valid = true;
  const visit = (node: SolutionTreeNode): string => {
    if (!node.left || !node.right) return `leaf-${node.sourceIndex}`;
    const leftId = visit(node.left);
    const rightId = visit(node.right);
    step++;
    if (step <= stage) {
      const operator = node.operator === '＋' ? '+' : node.operator === '−' ? '-' : node.operator as PracticeOperator;
      const move = combinePracticeNodes(history[history.length - 1], leftId, rightId, operator, target);
      if (move) history.push(move.nodes);
      else valid = false;
    }
    return `step-${step}`;
  };
  visit(root);
  return valid && history.length === stage + 1 ? history : null;
}

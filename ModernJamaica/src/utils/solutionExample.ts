import { ProblemData } from '../types';

export interface SolutionExample {
  expression: string;
  steps: string[];
  tree: SolutionTreeNode;
}

export interface SolutionTreeNode {
  value: number;
  sourceIndex?: number;
  operator?: string;
  left?: SolutionTreeNode;
  right?: SolutionTreeNode;
}

interface Term {
  value: number;
  expression: string;
  steps: string[];
  tree: SolutionTreeNode;
}

/** 生成器と同じ正の整数の探索空間。数字の位置を消費し、重複数字も各1回使う。 */
export function findSolutionExample(problem: Pick<ProblemData, 'numbers' | 'target'>): SolutionExample | null {
  if (problem.numbers.length !== 5 || problem.numbers.some(n => !Number.isInteger(n) || n <= 0)) return null;
  const search = (terms: Term[], failed: Set<string>, adjacentOnly: boolean): Term | null => {
    if (terms.length === 1) return terms[0].value === problem.target ? terms[0] : null;
    const values = terms.map(t => t.value);
    const key = (adjacentOnly ? values : values.sort((a, b) => a - b)).join(',');
    if (failed.has(key)) return null;
    for (let i = 0; i < terms.length; i++) {
      for (let j = i + 1; j < terms.length; j++) {
        if (adjacentOnly && j !== i + 1) continue;
        const a = terms[i];
        const b = terms[j];
        const high = a.value >= b.value ? a : b;
        const low = a.value >= b.value ? b : a;
        const operations: [Term, string, Term, number][] = [
          [a, '＋', b, a.value + b.value],
          [a, '×', b, a.value * b.value],
        ];
        if (high.value > low.value) operations.push([high, '−', low, high.value - low.value]);
        if (low.value > 1 && high.value % low.value === 0) operations.push([high, '÷', low, high.value / low.value]);
        for (const [left, operator, right, value] of operations) {
          const combined: Term = {
            value,
            expression: `(${left.expression} ${operator} ${right.expression})`,
            steps: [...left.steps, ...right.steps, `${left.value} ${operator} ${right.value} = ${value}`],
            tree: { value, operator, left: left.tree, right: right.tree },
          };
          const remaining = adjacentOnly
            ? [...terms.slice(0, i), combined, ...terms.slice(j + 1)]
            : [...terms.filter((_, k) => k !== i && k !== j), combined];
          const result = search(remaining, failed, adjacentOnly);
          if (result) return result;
        }
      }
    }
    failed.add(key);
    return null;
  };
  const initial = problem.numbers.map((value, sourceIndex) => ({ value, expression: String(value), steps: [], tree: { value, sourceIndex } }));
  // 元の数字の横並びで線が交差しにくい、隣接する項の組み合わせを優先する。
  const result = search(initial, new Set(), true) ?? search(initial, new Set(), false);
  return result ? { expression: result.expression, steps: result.steps, tree: result.tree } : null;
}

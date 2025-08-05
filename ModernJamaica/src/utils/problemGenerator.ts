import { ProblemData, DifficultyLevel } from '../types';
import { getDifficultyConfig } from '../config/difficulty';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 難易度に基づいて問題を生成
 * 5つの数字全てを使って目標値を作れることを保証
 */
export function generateProblem(difficulty: DifficultyLevel): ProblemData {
  const config = getDifficultyConfig(difficulty);
  const { min, max } = config.numberRange;
  
  // 1. 範囲内のランダムな整数を5つ生成
  const numbers = Array(5).fill(0).map(() => randomInt(min, max));
  
  // 5つの数字を使って目標値を生成（解の存在を保証）
  const target = calculateTarget([...numbers]);
  
  return {
    numbers: shuffle(numbers),
    target,
    difficulty,
  };
}

/**
 * 数字の配列から目標値を再帰的に計算
 * このプロセス自体が解法となるため、必ず解ける問題が生成される
 */
function calculateTarget(nums: number[]): number {
  // ベースケース：数字が1つだけなら、それが結果
  if (nums.length === 1) {
    return nums[0];
  }
  
  // 2つの数字をランダムに選択
  const shuffled = shuffle(nums);
  const a = shuffled[0];
  const b = shuffled[1];
  const remaining = shuffled.slice(2);
  
  // ランダムな演算子を選択して適用
  const operators = ['+', '-', '×', '÷'];
  const operator = operators[randomInt(0, 3)];
  const result = applyOperator(a, b, operator);
  
  // 結果と残りの数字で再帰的に計算
  return calculateTarget([result, ...remaining]);
}

/**
 * 2つの数値に演算子を適用
 * 除算が不可能な場合は別の演算子で再試行
 */
function applyOperator(a: number, b: number, operator: string): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return Math.abs(a - b);  // 負の数を避ける
    case '×':
      return a * b;
    case '÷':
      // 整数除算が可能な場合のみ実行
      if (b !== 0 && a % b === 0) return a / b;
      if (a !== 0 && b % a === 0) return b / a;
      // 除算不可なら別の演算子で再試行
      const fallbackOp = ['+', '-', '×'][randomInt(0, 2)];
      return applyOperator(a, b, fallbackOp);
    default:
      return a + b;
  }
}

/**
 * 後方互換性のための関数
 * 既存のコードがこの関数を使用している場合に備えて残す
 * @deprecated generateProblem(DifficultyLevel.NORMAL)を使用してください
 */
export function generateProblemExhaustive(): ProblemData {
  return generateProblem(DifficultyLevel.NORMAL);
}


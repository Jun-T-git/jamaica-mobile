import { ProblemData, DifficultyLevel } from '../types';
import { getDifficultyConfig } from '../config/difficulty';

type Rng = () => number;

const NUMBER_COUNT = 5;
const MAX_HAND_ATTEMPTS = 50;

function randomInt(min: number, max: number, rng: Rng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * 5つの数字を全て使って作れる値と、その解の数を数え上げる
 * 人が見つけやすい解だけを数えるため、途中結果は正の整数に限定する
 * （0を経由する解・負の数・割り切れない割り算は数えない）
 */
export function countSolutions(numbers: number[]): Map<number, number> {
  // 同じ残り数字に至る経路を再探索しない。キャッシュはこの呼出し内に限定する。
  const memo = new Map<string, Map<number, number>>();

  const search = (values: number[]): Map<number, number> => {
    const n = values.length;
    if (n === 1) return new Map([[values[0], 1]]);

    const key = [...values].sort((a, b) => a - b).join(',');
    const cached = memo.get(key);
    if (cached) return cached;
    const counts = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = values[i];
        const b = values[j];
        const rest: number[] = [];
        for (let k = 0; k < n; k++) {
          if (k !== i && k !== j) rest.push(values[k]);
        }

        const results = [a + b, a * b];
        if (a !== b) results.push(Math.abs(a - b));
        const high = Math.max(a, b);
        const low = Math.min(a, b);
        // ÷1 は ×1 と同じ結果になるため数えない
        if (low > 1 && high % low === 0) results.push(high / low);

        for (const result of results) {
          rest.push(result);
          // 同じ結果の演算や重複数字も別経路として加算し、従来の解の数を保つ。
          if (n === 2) {
            counts.set(result, (counts.get(result) || 0) + 1);
          } else {
            search(rest).forEach((count, target) => {
              counts.set(target, (counts.get(target) || 0) + count);
            });
          }
          rest.pop();
        }
      }
    }
    memo.set(key, counts);
    return counts;
  };

  return search(numbers);
}

/**
 * 難易度に基づいて問題を生成
 * - 目標値は難易度ごとの範囲内に収める（0や極端に大きな値は出題しない）
 * - 「全部足すだけ」で解ける問題は出題しない
 * - 解の数が難易度の帯に入る目標値から選ぶ（解が多いほど易しい）
 *
 * rng を渡すと同じ乱数列から同じ問題を再現できる
 */
export function generateProblem(
  difficulty: DifficultyLevel,
  rng: Rng = Math.random,
): ProblemData {
  const config = getDifficultyConfig(difficulty);
  const { min, max } = config.numberRange;
  const { targetRange, solutionBand } = config;

  let fallback: ProblemData | null = null;

  for (let attempt = 0; attempt < MAX_HAND_ATTEMPTS; attempt++) {
    const numbers = Array.from({ length: NUMBER_COUNT }, () =>
      randomInt(min, max, rng),
    );
    const sum = numbers.reduce((total, num) => total + num, 0);

    const inRange = Array.from(countSolutions(numbers).entries())
      .filter(
        ([target]) =>
          target >= targetRange.min &&
          target <= targetRange.max &&
          target !== sum,
      )
      .sort((x, y) => x[1] - y[1] || x[0] - y[0]);

    if (inRange.length === 0) continue;

    // 帯の条件を満たす手札が見つからなかった場合の保険（最も解が多い目標値）
    if (!fallback) {
      const [target, solutionCount] = inRange[inRange.length - 1];
      fallback = { numbers, target, difficulty, solutionCount };
    }

    const start = Math.floor(inRange.length * solutionBand.minPercentile);
    const end = Math.max(
      start + 1,
      Math.ceil(inRange.length * solutionBand.maxPercentile),
    );
    const candidates = inRange
      .slice(start, end)
      .filter(([, count]) => count >= solutionBand.minCount);

    if (candidates.length === 0) continue;

    const [target, solutionCount] =
      candidates[randomInt(0, candidates.length - 1, rng)];
    return { numbers, target, difficulty, solutionCount };
  }

  if (fallback) return fallback;

  // 到達しない想定。ゲームを止めないよう、全難易度の範囲に収まる固定問題を返す
  // 4 × 4 + 3 + 2 − 1 = 20
  return { numbers: [4, 4, 3, 2, 1], target: 20, difficulty };
}

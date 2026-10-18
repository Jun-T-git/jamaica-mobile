import { DifficultyConfig } from '../config/difficulty';

type TimeConfig = DifficultyConfig['time'];

/**
 * 次の正解で得られる時間ボーナス（秒）
 * 正解のたびに減り、bonusMin で下げ止まる。下限は人が 1 問を解ける時間より
 * ずっと短いので、どれだけ速く解いても残り時間はやがて尽きる
 *
 * @param correctCount - これまでの正解数（今回の正解を含めない）
 */
export const calculateTimeBonus = (time: TimeConfig, correctCount: number): number => {
  return Math.max(time.bonusMin, time.bonus - Math.max(correctCount, 0) * time.bonusDecayStep);
};

/**
 * 自己記録まわりの表示コンポーネントが、想定の文言で描画できることを確認する
 */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { PlayerStatsStrip } from '../../src/components/molecules/PlayerStatsStrip';
import { ScoreTierBar } from '../../src/components/molecules/ScoreTierBar';
import { SCORE_TIERS } from '../../src/config/scoreTiers';
import { DifficultyLevel } from '../../src/types';

const render = (element: React.ReactElement): ReactTestRenderer => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree;
};

const textOf = (tree: ReactTestRenderer): string =>
  JSON.stringify(tree.toJSON());

describe('PlayerStatsStrip', () => {
  test('まだ遊んでいなければ何も描画しない', () => {
    const tree = render(
      <PlayerStatsStrip streakDays={0} totalCorrect={0} gamesPlayed={0} />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  test('連続日数・累計正解・プレイ回数を出す', () => {
    const tree = render(
      <PlayerStatsStrip streakDays={3} totalCorrect={128} gamesPlayed={12} />,
    );
    const text = textOf(tree);
    expect(text).toContain('3日目');
    expect(text).toContain('128問');
    expect(text).toContain('12回');
  });
});

describe('ScoreTierBar', () => {
  test('未到達なら最初の段位までの残りを出す', () => {
    const tree = render(
      <ScoreTierBar difficulty={DifficultyLevel.NORMAL} score={2000} />,
    );
    const text = textOf(tree);
    expect(text).toContain('ランクなし');
    expect(text).toContain(
      `ブロンズまで あと${(SCORE_TIERS.normal[0].threshold - 2000).toLocaleString()}点`,
    );
  });

  test('最高段位に到達すると到達メッセージを出す', () => {
    const top = SCORE_TIERS.hard[SCORE_TIERS.hard.length - 1];
    const tree = render(
      <ScoreTierBar difficulty={DifficultyLevel.HARD} score={top.threshold} />,
    );
    const text = textOf(tree);
    expect(text).toContain(top.label);
    expect(text).toContain('最高ランク到達');
  });
});

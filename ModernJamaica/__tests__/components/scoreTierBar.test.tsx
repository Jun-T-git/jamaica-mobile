/**
 * 基準スコアの表示文言を確認する
 */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
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

import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Alert, TouchableOpacity } from 'react-native';
import { ProblemReviewCard } from '../../src/components/molecules/ProblemReviewCard';
import { adService } from '../../src/services/adService';
import { useMonetizationStore } from '../../src/store/monetizationStore';
import { DifficultyLevel } from '../../src/types';

const mockReviewProblems = [
  { problem: { numbers: [1, 2, 3, 4, 5], target: 15, difficulty: DifficultyLevel.EASY }, result: 'correct' },
  { problem: { numbers: [2, 3, 4, 5, 6], target: 20, difficulty: DifficultyLevel.EASY }, result: 'skipped' },
  { problem: { numbers: [1, 3, 4, 5, 7], target: 18, difficulty: DifficultyLevel.EASY }, result: 'unfinished' },
];
jest.mock('../../src/store/gameStore', () => ({ useGameStore: (selector: (state: unknown) => unknown) => selector({ reviewProblems: mockReviewProblems }) }));
jest.mock('../../src/utils/SoundManager', () => ({ soundManager: { play: jest.fn() }, SoundType: { BUTTON: 'button' } }));
jest.mock('../../src/services/analyticsService', () => ({ analyticsService: { logEvent: jest.fn() } }));
jest.mock('../../src/services/adService', () => ({ adService: { isRewardConfigured: () => true, showRewardForReview: jest.fn() } }));
jest.mock('../../src/components/molecules/PracticeTree', () => ({ PracticeTree: ({ nodes }: { nodes: { id: string }[] }) =>
  require('react').createElement(require('react-native').Text, null, `練習の木・${nodes.filter(node => node.id.startsWith('step-')).length}手`) }));
jest.mock('../../src/components/molecules/SolutionTree', () => ({ SolutionTree: ({ showAnswer }: { showAnswer: boolean }) =>
  require('react').createElement(require('react-native').Text, null, showAnswer ? '計算結果あり' : '元の数字ノードのみ') }));

let tree: ReactTestRenderer;
const text = () => JSON.stringify(tree.toJSON());
const rows = () => tree.root.findAllByType(TouchableOpacity).map(node => node.props.accessibilityLabel).filter((label: unknown) => typeof label === 'string' && /^問題\d/.test(label));
const press = (label: string) => {
  const button = tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === label)!;
  expect(button).toBeDefined();
  act(() => button.props.onPress());
};
beforeEach(() => { jest.clearAllMocks(); useMonetizationStore.setState({ hasRemovedAds: true, reviewExpiresAt: 0, rewardBusy: false, purchaseBusy: false }); });
afterEach(() => { act(() => tree?.unmount()); jest.restoreAllMocks(); });

test('全問題から未解答だけに絞り、ヒントと答えを見た後も練習へ戻れる', () => {
  act(() => { tree = create(<ProblemReviewCard onPurchase={jest.fn()} onOpenChange={jest.fn()} />); });
  press('解答例を見る・復習する。全3問、解けなかった2問');
  expect(rows()).toHaveLength(3);
  press('問題2、スキップ、目標20、数字2、3、4、5、6');
  expect(text()).toContain('練習の木');
  expect(text()).not.toContain('計算結果あり');
  press('ヒント1');
  expect(text()).toContain('計算結果あり');
  press('自分の手順に戻る');
  expect(text()).toContain('練習の木');
  press('ヒント2');
  press('ヒントの続きから解く');
  expect(text()).toContain('練習の木・2手');
  expect(text()).not.toContain('計算結果あり');
  press('答え');
  expect(text()).toContain('計算結果あり');
  press('次の問題');
  expect(text()).toContain('練習の木');
  expect(text()).not.toContain('計算結果あり');
  press('問題一覧に戻る');
  press('解けなかった問題のみ');
  expect(rows()).toHaveLength(2);
  expect(rows()).not.toContain('問題1、正解、目標15、数字1、2、3、4、5');
});

test('無課金でも正解した問題のヒント・答えを見られ、未正解だけ一覧で広告を案内する', () => {
  useMonetizationStore.setState({ hasRemovedAds: false, reviewExpiresAt: 0 });
  act(() => { tree = create(<ProblemReviewCard onPurchase={jest.fn()} onOpenChange={jest.fn()} />); });
  expect(text()).not.toContain('広告視聴で1時間見放題');
  press('解答例を見る・復習する。全3問、解けなかった2問');
  expect(rows()).toHaveLength(3);
  expect(rows()[0]).not.toContain('広告視聴');
  expect(rows()[1]).toContain('広告視聴で1時間見放題');
  expect(rows()[2]).toContain('広告視聴で1時間見放題');
  expect(text()).toContain('広告なしで復習する');
  press('問題1、正解、目標15、数字1、2、3、4、5');
  expect(text()).toContain('練習の木');
  expect(text()).toContain('ヒント1');
  press('答え');
  expect(text()).toContain('計算結果あり');
  expect(adService.showRewardForReview).not.toHaveBeenCalled();
});

test('未正解の問題は広告視聴を確認し、報酬を得てから開く', async () => {
  useMonetizationStore.setState({ hasRemovedAds: false, reviewExpiresAt: 0 });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  jest.mocked(adService.showRewardForReview).mockResolvedValue('earned');
  act(() => { tree = create(<ProblemReviewCard onPurchase={jest.fn()} onOpenChange={jest.fn()} />); });
  press('解答例を見る・復習する。全3問、解けなかった2問');
  press('問題2、スキップ、目標20、数字2、3、4、5、6、広告視聴で1時間見放題');
  expect(text()).toContain('問題一覧');
  expect(alert).toHaveBeenCalledWith('広告を見て問題を開く', expect.stringContaining('1時間見放題'), expect.any(Array));
  const actions = alert.mock.calls[0][2]!;
  await act(async () => { actions[1].onPress?.(); await Promise.resolve(); });
  expect(adService.showRewardForReview).toHaveBeenCalledTimes(1);
  expect(text()).toContain('問題 2');
  expect(text()).toContain('ヒント1');
  expect(text()).not.toContain('広告を見て解放');
});

test('視聴済みの問題は見放題中と表示し、一覧から買い切り画面へ進める', () => {
  const onPurchase = jest.fn();
  const onOpenChange = jest.fn();
  useMonetizationStore.setState({ hasRemovedAds: false, reviewExpiresAt: Date.now() + 60_000 });
  act(() => { tree = create(<ProblemReviewCard onPurchase={onPurchase} onOpenChange={onOpenChange} />); });
  press('解答例を見る・復習する。全3問、解けなかった2問');
  expect(rows()[1]).toContain('見放題中');
  expect(rows()[1]).not.toContain('広告視聴');
  press('広告削除プランを見る');
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  expect(onPurchase).toHaveBeenCalledTimes(1);
});

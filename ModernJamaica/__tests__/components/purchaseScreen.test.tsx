import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { Button } from '../../src/components/atoms/Button';
import { PurchaseScreen } from '../../src/screens/PurchaseScreen';
import { useMonetizationStore } from '../../src/store/monetizationStore';
import { purchaseService } from '../../src/services/purchaseService';
import { PurchaseSource } from '../../src/types/purchase';

jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../../src/utils/SoundManager', () => ({ soundManager: { play: jest.fn() }, SoundType: { BUTTON: 'button' } }));
jest.mock('../../src/services/analyticsService', () => ({ analyticsService: { logEvent: jest.fn() } }));
jest.mock('../../src/services/purchaseService', () => ({ purchaseService: {
  supported: true, loadProduct: jest.fn(async () => {}), purchase: jest.fn(async () => 'cancelled'), restore: jest.fn(async () => false),
} }));

let tree: ReactTestRenderer;
const goBack = jest.fn();
const render = (source: PurchaseSource = 'result_review') => {
  act(() => {
    tree = create(<PurchaseScreen
      navigation={{ goBack, addListener: () => () => {} } as never}
      route={{ key: 'purchase', name: 'Purchase', params: { source } }} />);
  });
};
const text = () => JSON.stringify(tree.toJSON());
beforeEach(() => {
  jest.clearAllMocks();
  useMonetizationStore.setState({ hasRemovedAds: false, price: '¥480', productStatus: 'available', purchaseBusy: false, purchaseOperation: null, pendingPurchase: false });
});
afterEach(() => { act(() => tree?.unmount()); });

test('価格と買い切り条件を表示し、購入操作まで決済を開始しない', async () => {
  render();
  expect(text()).toContain('買い切り・月額料金なし・自動更新なし');
  expect(text()).toContain('¥480');
  expect(purchaseService.purchase).not.toHaveBeenCalled();
  const buy = tree.root.findByType(Button);
  expect(buy.props.title).toBe('¥480で購入する');
  await act(async () => buy.props.onPress());
  expect(purchaseService.purchase).toHaveBeenCalledWith('result_review');
  expect(text()).not.toContain('広告なしになりました');
});
test('価格の読込中に購入できず、閉じる操作は使える', () => {
  useMonetizationStore.setState({ price: null, productStatus: 'loading' });
  render();
  expect(tree.root.findByType(Button).props.disabled).toBe(true);
  const close = tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === '購入画面を閉じる')!;
  act(() => close.props.onPress());
  expect(goBack).toHaveBeenCalledTimes(1);
});
test('価格取得エラー時にも復元・再読み込み・無料で続ける導線を残す', async () => {
  useMonetizationStore.setState({ price: null, productStatus: 'error' });
  render();
  expect(text()).toContain('価格を取得できませんでした');
  expect(text()).toContain('購入を復元');
  expect(text()).toContain('今は無料で続ける');
  const retry = tree.root.findByType(Button);
  expect(retry.props.title).toBe('価格を再読み込み');
  await act(async () => retry.props.onPress());
  expect(purchaseService.loadProduct).toHaveBeenCalledTimes(2);
});
test('購入済みになると購入ボタンを除き、元のリザルトへ戻れる', () => {
  render();
  act(() => useMonetizationStore.setState({ hasRemovedAds: true }));
  expect(text()).toContain('広告なしになりました');
  expect(text()).not.toContain('¥480で購入する');
  expect(tree.root.findByType(Button).props.title).toBe('リザルトに戻る');
  act(() => tree.root.findByType(Button).props.onPress());
  expect(goBack).toHaveBeenCalledTimes(1);
});
test('購入失敗は画面内で説明し、復元中を購入処理と区別する', async () => {
  (purchaseService.purchase as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  render();
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(text()).toContain('購入を完了できませんでした');
  act(() => useMonetizationStore.setState({ purchaseBusy: true, purchaseOperation: 'restore' }));
  expect(tree.root.findByType(Button).props.title).toBe('購入を復元中…');
  expect(tree.root.findByType(Button).props.disabled).toBe(true);
});

test('購入エラーの後に復元されても、購入済み画面に古いエラーを残さない', async () => {
  (purchaseService.purchase as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  render();
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(text()).toContain('購入を完了できませんでした');
  act(() => useMonetizationStore.setState({ hasRemovedAds: true }));
  expect(text()).toContain('広告なしになりました');
  expect(text()).not.toContain('購入を完了できませんでした');
  expect(text()).not.toContain('¥480で購入する');
});

test('購入成功後は購入ボタンを購入済み表示に切り替える', async () => {
  (purchaseService.purchase as jest.Mock).mockImplementationOnce(async () => {
    useMonetizationStore.setState({ hasRemovedAds: true, entitlementChecked: true });
    return 'purchased';
  });
  render();
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(text()).toContain('広告なしになりました');
  expect(text()).not.toContain('¥480で購入する');
  expect(tree.root.findByType(Button).props.title).toBe('リザルトに戻る');
});

test.each(['menu', 'settings', 'result_review'] as PurchaseSource[])(
  '%s から購入済み画面を開いても、購入操作なしで呼び出し元へ戻れる', source => {
    useMonetizationStore.setState({ hasRemovedAds: true });
    render(source);
    expect(purchaseService.purchase).not.toHaveBeenCalled();
    expect(tree.root.findByType(Button).props.title).toBe(source === 'result_review' ? 'リザルトに戻る' : '元の画面に戻る');
    act(() => tree.root.findByType(Button).props.onPress());
    expect(goBack).toHaveBeenCalledTimes(1);
  },
);

test('対象問題と支払条件を常時表示し、無料の閲覧条件は詳細から確認できる', () => {
  render();
  expect(text()).toContain('全画面広告を削除');
  expect(text()).not.toContain('バナー');
  expect(text()).toContain('対象は今回プレイした問題。');
  expect(text()).toContain('次のプレイで一覧が切り替わります。');
  expect(text()).toContain('買い切り・月額料金なし・自動更新なし');
  expect(text()).not.toContain('無料：動画広告1回');
  const details = tree.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityState?.expanded === false)!;
  act(() => details.props.onPress());
  expect(text()).toContain('無料：動画広告1回で、その後1時間見放題');
  expect(text()).toContain('購入後：動画広告なし・時間制限なし');
  expect(text()).toContain('購入履歴はAppleが管理します。');
  expect(text()).toContain('再インストール・機種変更後も同じアカウントで復元できます。');
});

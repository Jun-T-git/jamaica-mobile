import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Modal, TextInput, Text } from 'react-native';
import { NicknamePromptModal } from '../../src/components/organisms/NicknamePromptModal';
import { Button } from '../../src/components/atoms/Button';

const mockRegister = jest.fn();
jest.mock('../../src/store/settingsStore', () => ({ useSettingsStore: (select: Function) => select({ registerNickname: mockRegister }) }));
jest.mock('../../src/utils/SoundManager', () => ({ soundManager: { play: jest.fn() }, SoundType: { BUTTON: 'button' } }));
let tree: ReactTestRenderer;
const close = jest.fn();
const show = jest.fn();
beforeEach(() => { mockRegister.mockReset(); close.mockReset(); show.mockReset(); });
afterEach(() => act(() => tree?.unmount()));
const mount = () => act(() => { tree = create(<NicknamePromptModal initialName="プレイヤー1234" onClose={close} onShow={show} />); });
const button = (title: string) => tree.root.findAllByType(Button).find(x => x.props.title === title)!;
const contains = (part: string) => tree.root.findAllByType(Text).some(x => typeof x.props.children === 'string' && x.props.children.includes(part));

test('prefills actual saved name, explains Settings, and permits later/back dismissal', () => {
  mount();
  expect(tree.root.findByType(TextInput).props.value).toBe('プレイヤー1234');
  expect(contains('「設定」でいつでも')).toBe(true);
  act(() => tree.root.findByType(Modal).props.onShow());
  expect(show).toHaveBeenCalledTimes(1);
  act(() => tree.root.findByType(Modal).props.onRequestClose());
  act(() => button('あとで設定する').props.onPress());
  expect(close).toHaveBeenCalledTimes(2);
  expect(mockRegister).not.toHaveBeenCalled();
});

test('guards same-tick double submit and back while saving, then closes on confirmed save', async () => {
  let finish!: (value: unknown) => void;
  mockRegister.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  mount();
  const save = button('この名前で登録').props.onPress;
  await act(async () => {
    save(); save();
    tree.root.findByType(Modal).props.onRequestClose();
  });
  expect(mockRegister).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  await act(async () => finish({ status: 'saved', displayName: 'プレイヤー1234', rankingSynced: true }));
  expect(close).toHaveBeenCalledTimes(1);
});

test.each(['invalid', 'storage_error'])('keeps editable name and permits retry after %s', async status => {
  mockRegister.mockResolvedValue({ status, message: '名前を確認してください' });
  mount();
  await act(async () => button('この名前で登録').props.onPress());
  expect(close).not.toHaveBeenCalled();
  expect(tree.root.findByType(TextInput).props.editable).toBe(true);
  expect(contains(status === 'invalid' ? '名前を確認' : '保存を確認できません')).toBe(true);
  mockRegister.mockResolvedValue({ status: 'saved', rankingSynced: true });
  await act(async () => button('この名前で登録').props.onPress());
  expect(close).toHaveBeenCalledTimes(1);
});

test('local-only save is stated explicitly and does not offer a duplicate registration', async () => {
  mockRegister.mockResolvedValue({ status: 'saved', displayName: 'さくら', rankingSynced: false });
  mount();
  await act(async () => button('この名前で登録').props.onPress());
  expect(close).not.toHaveBeenCalled();
  expect(contains('ランキングへの反映は確認できていません')).toBe(true);
  expect(tree.root.findAllByType(Button)).toHaveLength(1);
  act(() => button('ゲームを始める').props.onPress());
  expect(close).toHaveBeenCalledTimes(1);
});

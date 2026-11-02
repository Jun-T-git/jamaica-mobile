import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ModeSelectionScreen } from '../../src/screens/ModeSelectionScreen';
import { TutorialModal } from '../../src/components/organisms/TutorialModal';
import { NicknamePromptModal } from '../../src/components/organisms/NicknamePromptModal';
import { acknowledgeNicknamePromptShown, NICKNAME_PROMPT_KEY, TUTORIAL_COMPLETED_KEY } from '../../src/services/nicknamePromptService';

let mockFocused = true;
const mockLoadName = jest.fn(async () => true);
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused }));
jest.mock('../../src/store/settingsStore', () => ({ useSettingsStore: (select: Function) => select({ loadDisplayName: mockLoadName }) }));
jest.mock('../../src/store/gameStore', () => ({ useGameStore: (select: Function) => select({ loadStoredData: mockLoadData }) }));
const mockLoadData = jest.fn();
jest.mock('../../src/store/monetizationStore', () => ({ useMonetizationStore: (select: Function) => select({ hasRemovedAds: true }) }));
jest.mock('../../src/components/atoms/Logo', () => ({ Logo: () => null }));
jest.mock('../../src/components/organisms/TutorialModal', () => ({ TutorialModal: jest.fn(() => null) }));
jest.mock('../../src/components/organisms/NicknamePromptModal', () => ({ NicknamePromptModal: jest.fn(() => null) }));
jest.mock('../../src/utils/SoundManager', () => ({ soundManager: { play: jest.fn() }, SoundType: { BUTTON: 'button' } }));

let tree: ReactTestRenderer;
const navigation = { navigate: jest.fn() };
const element = () => <ModeSelectionScreen navigation={navigation} />;
const prompt = () => tree.root.findAllByType(NicknamePromptModal);
const tutorial = () => tree.root.findByType(TutorialModal);
const write = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
const read = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
beforeEach(async () => {
  acknowledgeNicknamePromptShown();
  mockFocused = true;
  mockLoadName.mockReset().mockResolvedValue(true);
  jest.mocked(AsyncStorage.getItem).mockImplementation(read);
  jest.mocked(AsyncStorage.setItem).mockImplementation(write);
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@display_name', 'プレイヤー1234');
  await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
});
afterEach(() => act(() => tree?.unmount()));
const mount = async () => { await act(async () => { tree = create(element()); }); };
const refresh = async () => { await act(async () => { tree.update(element()); }); };

test('existing default is invited, but shown/closed invitation does not return after navigation or remount', async () => {
  await mount();
  expect(prompt()).toHaveLength(1);
  expect(prompt()[0].props.initialName).toBe('プレイヤー1234');
  await act(async () => { prompt()[0].props.onShow(); prompt()[0].props.onClose(); });
  mockFocused = false; await refresh();
  mockFocused = true; await refresh();
  expect(prompt()).toHaveLength(0);
  act(() => tree.unmount());
  await mount();
  expect(prompt()).toHaveLength(0);
});

test('new user waits for tutorial persistence AND native dismissal before invitation', async () => {
  await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  await mount();
  expect(tutorial().props.visible).toBe(true);
  expect(prompt()).toHaveLength(0);
  let finish!: () => void;
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    if (key === TUTORIAL_COMPLETED_KEY) await new Promise<void>(resolve => { finish = resolve; });
    return write(key, value);
  });
  await act(async () => tutorial().props.onClose());
  expect(prompt()).toHaveLength(0);
  await act(async () => finish());
  expect(Platform.OS).toBe('ios');
  expect(prompt()).toHaveLength(0);
  await act(async () => tutorial().props.onDismiss());
  expect(prompt()).toHaveLength(1);
  await act(async () => { prompt()[0].props.onShow(); prompt()[0].props.onClose(); });
  // A manual tutorial replay does not renew the invitation.
  await act(async () => { tutorial().props.onClose(); tutorial().props.onDismiss(); });
  expect(prompt()).toHaveLength(0);
});

test('reservation is retained when unmounted before native onShow', async () => {
  await mount();
  expect(prompt()).toHaveLength(1);
  act(() => tree.unmount());
  await mount();
  expect(prompt()).toHaveLength(1);
  await act(async () => prompt()[0].props.onShow());
  act(() => tree.unmount());
  await mount();
  expect(prompt()).toHaveLength(0);
});

test('does not display over Settings and rechecks a changed/custom name on return', async () => {
  mockFocused = false;
  await mount();
  expect(prompt()).toHaveLength(0);
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
  await AsyncStorage.setItem('@display_name', 'さくら');
  await AsyncStorage.setItem('@display_name_set', 'true');
  mockFocused = true;
  await refresh();
  expect(prompt()).toHaveLength(0);
});

test('a failed profile load cannot open a prompt from an unconfirmed fallback', async () => {
  mockLoadName.mockResolvedValue(false);
  await mount();
  expect(prompt()).toHaveLength(0);
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
});

test('failed tutorial persistence does not invite or block the game', async () => {
  await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  await mount();
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
  await act(async () => tutorial().props.onClose());
  await act(async () => tutorial().props.onDismiss());
  expect(tutorial().props.visible).toBe(false);
  expect(prompt()).toHaveLength(0);
});

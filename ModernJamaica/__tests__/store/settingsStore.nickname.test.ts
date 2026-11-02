import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../../src/store/settingsStore';
import { userService } from '../../src/services/userService';
import { rankingService } from '../../src/services/rankingService';

jest.mock('@react-native-firebase/auth', () => ({ getAuth: jest.fn(), signInAnonymously: jest.fn() }));
jest.mock('../../src/services/rankingService', () => ({ rankingService: { updateDisplayName: jest.fn() } }));
jest.mock('../../src/utils/SoundManager', () => ({ soundManager: {} }));
jest.mock('../../src/services/hapticService', () => ({ hapticService: {} }));
const read = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
beforeEach(async () => {
  jest.mocked(AsyncStorage.getItem).mockImplementation(read);
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  useSettingsStore.setState({ displayName: '', isDisplayNameSet: false });
});

test('concurrent initial loads generate/persist one default name and share completion', async () => {
  const generate = jest.spyOn(userService, 'generateDefaultDisplayName').mockReturnValue('プレイヤー1234');
  const first = useSettingsStore.getState().loadDisplayName();
  const second = useSettingsStore.getState().loadDisplayName();
  expect(first).toBe(second);
  expect(await first).toBe(true);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(await AsyncStorage.getItem('@display_name')).toBe('プレイヤー1234');
});

test('failed reads return unconfirmed and never overwrite a persisted custom profile', async () => {
  await AsyncStorage.setItem('@display_name', 'さくら');
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('unreadable'));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(await useSettingsStore.getState().loadDisplayName()).toBe(false);
  expect(await AsyncStorage.getItem('@display_name')).toBe('さくら');
  warn.mockRestore();
});

test('local save remains reflected in Settings even when ranking is unconfirmed', async () => {
  jest.mocked(rankingService.updateDisplayName).mockResolvedValue(false);
  const result = await useSettingsStore.getState().registerNickname('さくら');
  expect(result).toMatchObject({ status: 'saved', rankingSynced: false });
  expect(useSettingsStore.getState()).toMatchObject({ displayName: 'さくら', isDisplayNameSet: true });
});

test('a delayed startup snapshot cannot overwrite a newer name saved in Settings', async () => {
  await AsyncStorage.setItem('@display_name', 'プレイヤー1234');
  let finish!: () => void;
  let delayed = true;
  jest.mocked(AsyncStorage.getItem).mockImplementation(async key => {
    const snapshot = await read(key);
    if (key === '@display_name' && delayed) {
      delayed = false;
      await new Promise<void>(resolve => { finish = resolve; });
    }
    return snapshot;
  });
  const loading = useSettingsStore.getState().loadDisplayName();
  await Promise.resolve(); await Promise.resolve();
  jest.mocked(rankingService.updateDisplayName).mockResolvedValue(true);
  expect(await useSettingsStore.getState().updateDisplayNameWithFirebase('さくら')).toBe(true);
  finish();
  expect(await loading).toBe(false);
  expect(useSettingsStore.getState()).toMatchObject({ displayName: 'さくら', isDisplayNameSet: true });
  expect(await AsyncStorage.getItem('@display_name')).toBe('さくら');
});

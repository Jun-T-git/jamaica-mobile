import AsyncStorage from '@react-native-async-storage/async-storage';
import { rankingService } from '../../src/services/rankingService';
import { registerNickname } from '../../src/services/nicknameRegistrationService';

jest.mock('@react-native-firebase/auth', () => ({ getAuth: jest.fn(), signInAnonymously: jest.fn() }));
jest.mock('../../src/services/rankingService', () => ({ rankingService: { updateDisplayName: jest.fn() } }));
const sync = jest.mocked(rankingService.updateDisplayName);
const writeStoredItem = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
beforeEach(async () => {
  jest.useRealTimers();
  jest.mocked(AsyncStorage.setItem).mockImplementation(writeStoredItem);
  await AsyncStorage.clear();
  sync.mockReset().mockResolvedValue(true);
});
afterEach(() => jest.useRealTimers());

test.each(['', '   ', 'a'.repeat(21), 'admin'])('invalid input never saves or sends (%s)', async name => {
  expect((await registerNickname(name)).status).toBe('invalid');
  expect(await AsyncStorage.getItem('@display_name')).toBeNull();
  expect(sync).not.toHaveBeenCalled();
});

test('normalizes and persists both keys before ranking sync', async () => {
  sync.mockImplementation(async name => {
    expect(await AsyncStorage.getItem('@display_name')).toBe(name);
    expect(await AsyncStorage.getItem('@display_name_set')).toBe('true');
    return true;
  });
  expect(await registerNickname('  さくら  ')).toEqual({ status: 'saved', displayName: 'さくら', rankingSynced: true });
});

test.each(['@display_name', '@display_name_set'])('partial storage failure is not success or server sync (%s)', async failedKey => {
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    if (key === failedKey) throw new Error('disk full');
    return writeStoredItem(key, value);
  });
  expect(await registerNickname('さくら')).toEqual({ status: 'storage_error' });
  expect(sync).not.toHaveBeenCalled();
  jest.mocked(AsyncStorage.setItem).mockImplementation(writeStoredItem);
  expect((await registerNickname('さくら')).status).toBe('saved');
});

test.each(['false', 'reject'])('does not misreport local save as confirmed ranking sync (%s)', async failure => {
  if (failure === 'false') sync.mockResolvedValue(false);
  else sync.mockRejectedValue(new Error('offline'));
  expect(await registerNickname('さくら')).toEqual({ status: 'saved', displayName: 'さくら', rankingSynced: false });
  expect(await AsyncStorage.getItem('@display_name')).toBe('さくら');
});

test('a stalled connection is bounded, even if its late result succeeds', async () => {
  jest.useFakeTimers();
  let finish!: (value: boolean) => void;
  sync.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const result = registerNickname('さくら');
  await jest.advanceTimersByTimeAsync(12000);
  expect(await result).toEqual({ status: 'saved', displayName: 'さくら', rankingSynced: false });
  finish(true);
  expect(jest.getTimerCount()).toBe(0);
});

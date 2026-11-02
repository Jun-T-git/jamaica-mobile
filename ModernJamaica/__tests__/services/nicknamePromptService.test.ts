import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  claimNicknamePrompt,
  NICKNAME_PROMPT_KEY,
  TUTORIAL_COMPLETED_KEY,
} from '../../src/services/nicknamePromptService';

const readStoredItem = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;

beforeEach(async () => {
  jest.mocked(AsyncStorage.getItem).mockImplementation(readStoredItem);
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@display_name', 'プレイヤー1234');
  await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
});

test('returns the persisted name unchanged and records the invitation before granting it', async () => {
  expect(await claimNicknamePrompt()).toEqual({ status: 'claimed', displayName: 'プレイヤー1234' });
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBe('true');
  expect(await AsyncStorage.getItem('@display_name')).toBe('プレイヤー1234');
  expect(await AsyncStorage.getItem('@display_name_set')).toBeNull();
});

test('concurrent callers and a later mount cannot each claim an invitation', async () => {
  const results = await Promise.all([claimNicknamePrompt(), claimNicknamePrompt()]);
  expect(results.filter(result => result.status === 'claimed')).toHaveLength(1);
  expect(await claimNicknamePrompt()).toEqual({ status: 'not_needed' });
});

test.each([null, 'false'])('waits for tutorial completion (%s), including its async persistence', async value => {
  if (value === null) await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  else await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, value);
  expect(await claimNicknamePrompt()).toEqual({ status: 'not_needed' });
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
  await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  expect((await claimNicknamePrompt()).status).toBe('claimed');
});

test.each(['さくら', 'プレイヤー', 'プレイヤー0', 'プレイヤー10000', 'プレイヤー0123', ''])('protects non-generated or missing names (%s)', async name => {
  await AsyncStorage.setItem('@display_name', name);
  const storedName = await AsyncStorage.getItem('@display_name');
  expect(await claimNicknamePrompt()).toEqual({ status: 'not_needed' });
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
  expect(await AsyncStorage.getItem('@display_name')).toBe(storedName);
});

test('protects an explicitly chosen name even when it looks generated', async () => {
  await AsyncStorage.setItem('@display_name_set', 'true');
  expect(await claimNicknamePrompt()).toEqual({ status: 'not_needed' });
});

test.each([NICKNAME_PROMPT_KEY, '@display_name_set'])('fails closed on an invalid record (%s)', async key => {
  await AsyncStorage.setItem(key, 'broken');
  expect(await claimNicknamePrompt()).toEqual({ status: 'unavailable', stage: 'load' });
});

test.each(['@display_name', '@display_name_set', TUTORIAL_COMPLETED_KEY, NICKNAME_PROMPT_KEY])('read failure cannot become permission to display or overwrite (%s)', async key => {
  jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async k => {
    if (k === key) throw new Error('read failed');
    return readStoredItem(k);
  });
  expect(await claimNicknamePrompt()).toEqual({ status: 'unavailable', stage: 'load' });
  jest.mocked(AsyncStorage.getItem).mockImplementation(readStoredItem);
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
  expect(await AsyncStorage.getItem('@display_name')).toBe('プレイヤー1234');
});

test('record failure is not a successful claim and does not poison later attempts', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  expect(await claimNicknamePrompt()).toEqual({ status: 'unavailable', stage: 'record' });
  expect(await AsyncStorage.getItem(NICKNAME_PROMPT_KEY)).toBeNull();
  expect((await claimNicknamePrompt()).status).toBe('claimed');
});

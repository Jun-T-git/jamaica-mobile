jest.mock('../../src/services/analyticsService', () => ({ analyticsService: { logEvent: jest.fn() } }));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { FirstValueMeasurementService } from '../../src/services/firstValueMeasurementService';
import { analyticsService } from '../../src/services/analyticsService';
import { FIRST_SOLVE_KEY, PLAYER_STATS_KEY } from '../../src/services/playerStatsService';
const KEY = '@jamaica_common_first_value_v1';
const event = { schema_version: 1, activation_key: 'first_problem_solved', definition_version: 1, first_status: 'new_since_measurement' };
beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); delete NativeModules.PurchaseModule; });
test('empty state and newly observed correct remain unknown without verified install evidence', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.recordFirstCorrect();
  await service.acceptInstallEvidence('unknown');
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).scope).toBe('unknown');
});
test.each([
  [FIRST_SOLVE_KEY, 'true'],
  [PLAYER_STATS_KEY, JSON.stringify({ totalCorrect: 1 })],
  [PLAYER_STATS_KEY, JSON.stringify({ gamesPlayed: 1 })],
  [PLAYER_STATS_KEY, JSON.stringify({ firstPlayedAt: 100 })],
])('existing history %s is never promoted by a later proof', async (key, value) => {
  await AsyncStorage.setItem(key, value);
  const service = new FirstValueMeasurementService(false);
  await service.initialize();
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).scope).toBe('existing');
});
test('verified new + first correct sends once across concurrent callbacks, updates and restarts', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  await Promise.all([service.recordFirstCorrect(), service.recordFirstCorrect()]);
  await AsyncStorage.setItem(FIRST_SOLVE_KEY, 'true');
  const restarted = new FirstValueMeasurementService(false);
  await restarted.acceptInstallEvidence('verified_new');
  await restarted.recordFirstCorrect();
  expect(analyticsService.logEvent).toHaveBeenCalledTimes(1);
  expect(analyticsService.logEvent).toHaveBeenCalledWith('value_first_reached', event);
});
test('delayed verified proof releases a pending correct without reclassifying self-written history', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.initialize();
  await service.recordFirstCorrect();
  await AsyncStorage.setItem(PLAYER_STATS_KEY, JSON.stringify({ gamesPlayed: 1, firstPlayedAt: 100, totalCorrect: 1 }));
  await AsyncStorage.setItem(FIRST_SOLVE_KEY, 'true');
  const restarted = new FirstValueMeasurementService(false);
  await restarted.acceptInstallEvidence('verified_new');
  expect(analyticsService.logEvent).toHaveBeenCalledTimes(1);
});
test('verified existing excludes pending correct', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.recordFirstCorrect();
  await service.acceptInstallEvidence('verified_existing');
  await service.acceptInstallEvidence('verified_new');
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});
test.each([KEY, PLAYER_STATS_KEY])('damaged ledger/history %s fails closed', async key => {
  await AsyncStorage.setItem(key, 'broken');
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});
test('failed durable sent write suppresses SDK handoff; later successful retry sends once', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  const set = jest.spyOn(AsyncStorage, 'setItem');
  const implementation = set.getMockImplementation()!;
  set.mockImplementation(async (key, value) => {
    if (key === KEY && JSON.parse(value).sent) throw new Error('storage');
    return implementation(key, value);
  });
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
  set.mockImplementation(implementation);
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).toHaveBeenCalledTimes(1);
});
test('missing native module, unsupported result and native rejection stay unknown', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.refreshInstallEvidence();
  NativeModules.PurchaseModule = { getMeasurementInstallEvidence: jest.fn(async () => { throw new Error('offline'); }) };
  await service.refreshInstallEvidence();
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});
test('startup consumes native verified proof and sends no identifiers or receipt data', async () => {
  NativeModules.PurchaseModule = { getMeasurementInstallEvidence: jest.fn(async () => 'verified_new') };
  const service = new FirstValueMeasurementService(false);
  await service.refreshInstallEvidence();
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).toHaveBeenCalledWith('value_first_reached', event);
});

test('resetting gameplay records cannot reset the durable activation ledger', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  await AsyncStorage.multiRemove([FIRST_SOLVE_KEY, PLAYER_STATS_KEY]);
  const restarted = new FirstValueMeasurementService(false);
  await restarted.acceptInstallEvidence('verified_new');
  await restarted.recordFirstCorrect();
  expect(analyticsService.logEvent).toHaveBeenCalledTimes(1);
});
test('failed initial history read never sends even with subsequent verified-new evidence', async () => {
  jest.spyOn(AsyncStorage, 'multiGet').mockRejectedValueOnce(new Error('storage'));
  const service = new FirstValueMeasurementService(false);
  await service.initialize();
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});

test('previously eligible scope cannot send on a disabled/unknown launch until proof is verified again', async () => {
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  const restarted = new FirstValueMeasurementService(false);
  await restarted.refreshInstallEvidence();
  await restarted.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
  await restarted.acceptInstallEvidence('verified_new');
  expect(analyticsService.logEvent).toHaveBeenCalledTimes(1);
});

test.each([{ gamesPlayed: '10' }, { totalCorrect: -1 }, { firstPlayedAt: '100' }, { gamesPlayed: 1.5 }, { lastPlayDate: 123 }])('invalid legacy history %j is blocked, never guessed new', async history => {
  await AsyncStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(history));
  const service = new FirstValueMeasurementService(false);
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});

test('DEBUG first correct is consumed without replay or relabeling the next production correct', async () => {
  const debug = new FirstValueMeasurementService(true);
  await debug.initialize();
  await debug.acceptInstallEvidence('verified_new');
  await debug.recordFirstCorrect();
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).reached).toBe(false);
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).blocked).toBe(true);
  const production = new FirstValueMeasurementService(false);
  await production.acceptInstallEvidence('verified_new');
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
  await production.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});
test('native disabled/screenshot first correct is consumed before proof and never relabeled after enabling', async () => {
  NativeModules.PurchaseModule = { measurementCollectionAllowed: false };
  const disabled = new FirstValueMeasurementService(false);
  await disabled.initialize();
  await disabled.recordFirstCorrect();
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).reached).toBe(false);
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!).blocked).toBe(true);
  NativeModules.PurchaseModule.measurementCollectionAllowed = true;
  const enabled = new FirstValueMeasurementService(false);
  await enabled.acceptInstallEvidence('verified_new');
  await enabled.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});

test('failed excluded-first write still blocks later enabling within the process', async () => {
  NativeModules.PurchaseModule = { measurementCollectionAllowed: false };
  const service = new FirstValueMeasurementService(false);
  await service.initialize();
  const set = jest.spyOn(AsyncStorage, 'setItem');
  const implementation = set.getMockImplementation()!;
  set.mockImplementation(async (key, value) => {
    if (key === KEY && JSON.parse(value).blocked) throw new Error('storage');
    return implementation(key, value);
  });
  await service.recordFirstCorrect();
  set.mockImplementation(implementation);
  NativeModules.PurchaseModule.measurementCollectionAllowed = true;
  await service.acceptInstallEvidence('verified_new');
  await service.recordFirstCorrect();
  expect(analyticsService.logEvent).not.toHaveBeenCalled();
});

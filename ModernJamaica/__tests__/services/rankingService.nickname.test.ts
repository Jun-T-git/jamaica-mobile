import { rankingService } from '../../src/services/rankingService';
const mockDoc = { get: jest.fn(), update: jest.fn() };
jest.mock('@react-native-firebase/firestore', () => jest.fn(() => ({ collection: () => ({ doc: () => mockDoc }) })));
jest.mock('../../src/services/userService', () => ({ userService: { getAuthUserId: jest.fn(async () => 'test-user') } }));
beforeEach(() => { mockDoc.get.mockReset(); mockDoc.update.mockReset().mockResolvedValue(undefined); });
const exists = { exists: () => true };

test('late old auth/read cannot write over a newer name', async () => {
  let releaseOld!: (doc: typeof exists) => void;
  mockDoc.get.mockReturnValueOnce(new Promise(resolve => { releaseOld = resolve; })).mockResolvedValueOnce(exists);
  const old = rankingService.updateDisplayName('古い名前');
  await Promise.resolve(); await Promise.resolve();
  expect(await rankingService.updateDisplayName('新しい名前')).toBe(true);
  releaseOld(exists);
  expect(await old).toBe(false);
  expect(mockDoc.update).toHaveBeenCalledTimes(1);
  expect(mockDoc.update).toHaveBeenCalledWith(expect.objectContaining({ displayName: '新しい名前' }));
});

test('already sent old write finishes before the newer write is sent', async () => {
  let releaseOld!: () => void;
  mockDoc.get.mockResolvedValue(exists);
  mockDoc.update.mockImplementationOnce(() => new Promise<void>(resolve => { releaseOld = resolve; }));
  const old = rankingService.updateDisplayName('古い名前');
  for (let i = 0; i < 6; i++) await Promise.resolve();
  expect(mockDoc.update).toHaveBeenCalledTimes(1);
  const newer = rankingService.updateDisplayName('新しい名前');
  for (let i = 0; i < 6; i++) await Promise.resolve();
  expect(mockDoc.update).toHaveBeenCalledTimes(1);
  releaseOld();
  expect(await old).toBe(true);
  expect(await newer).toBe(true);
  expect(mockDoc.update.mock.calls.map(([change]) => change.displayName)).toEqual(['古い名前', '新しい名前']);
});

test('a failed older write does not poison later name changes', async () => {
  mockDoc.get.mockResolvedValue(exists);
  mockDoc.update.mockRejectedValueOnce(new Error('offline'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(await rankingService.updateDisplayName('古い名前')).toBe(false);
  expect(await rankingService.updateDisplayName('新しい名前')).toBe(true);
  log.mockRestore();
});

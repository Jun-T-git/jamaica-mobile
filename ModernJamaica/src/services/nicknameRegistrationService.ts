import AsyncStorage from '@react-native-async-storage/async-storage';
import { rankingService } from './rankingService';
import { userService } from './userService';

export type NicknameRegistrationResult =
  | { status: 'invalid'; message: string }
  | { status: 'storage_error' }
  | { status: 'saved'; displayName: string; rankingSynced: boolean };

// A ranking connection must not indefinitely prevent returning to the game.
const RANKING_CONFIRMATION_TIMEOUT_MS = 12000;

export async function registerNickname(name: string): Promise<NicknameRegistrationResult> {
  const validation = userService.validateDisplayName(name);
  if (!validation.isValid) return { status: 'invalid', message: validation.error || '名前を確認してください。' };
  const displayName = name.trim();
  try {
    await AsyncStorage.setItem('@display_name', displayName);
    await AsyncStorage.setItem('@display_name_set', 'true');
  } catch {
    // A partial write is not confirmed registration. Retrying completes both keys.
    return { status: 'storage_error' };
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const rankingSynced = await Promise.race([
      rankingService.updateDisplayName(displayName).catch(() => false),
      new Promise<boolean>(resolve => {
        timer = setTimeout(() => resolve(false), RANKING_CONFIRMATION_TIMEOUT_MS);
      }),
    ]);
    return { status: 'saved', displayName, rankingSynced };
  } catch {
    return { status: 'saved', displayName, rankingSynced: false };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

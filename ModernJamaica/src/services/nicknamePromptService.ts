import AsyncStorage from '@react-native-async-storage/async-storage';

export const NICKNAME_PROMPT_KEY = '@jamaica_nickname_prompt_presented_v1';
export const TUTORIAL_COMPLETED_KEY = '@jamaica_tutorial_completed';

export type NicknamePromptClaim =
  | { status: 'claimed'; displayName: string }
  | { status: 'not_needed' }
  | { status: 'unavailable'; stage: 'load' | 'record' };

// Serialize claims across callers/remounts. A failed operation must not poison the queue.
let claims: Promise<void> = Promise.resolve();

/**
 * Reserve the one-time invitation only after the saved tutorial is complete.
 * Never generate/replace a name or send it to a server. The caller must retain
 * a successful claim until its UI is presented; reservation precedes display
 * so a storage failure never produces an invitation that will repeat on restart.
 */
export function claimNicknamePrompt(): Promise<NicknamePromptClaim> {
  const result = claims.then(readAndClaim);
  claims = result.then(() => undefined, () => undefined);
  return result;
}

async function readAndClaim(): Promise<NicknamePromptClaim> {
  let name: string | null;
  let explicitlySet: string | null;
  let tutorial: string | null;
  let presented: string | null;
  try {
    [name, explicitlySet, tutorial, presented] = await Promise.all([
      AsyncStorage.getItem('@display_name'),
      AsyncStorage.getItem('@display_name_set'),
      AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY),
      AsyncStorage.getItem(NICKNAME_PROMPT_KEY),
    ]);
  } catch {
    return { status: 'unavailable', stage: 'load' };
  }

  if ((presented !== null && presented !== 'true') ||
      (explicitlySet !== null && explicitlySet !== 'true' && explicitlySet !== 'false')) {
    return { status: 'unavailable', stage: 'load' };
  }
  // A legacy/custom name without its flag is still protected. Only the actual
  // generated-name format (1..9999) is eligible; a user-set matching name is not.
  if (presented === 'true' || explicitlySet === 'true' || tutorial !== 'true' ||
      !name || !/^プレイヤー[1-9]\d{0,3}$/.test(name)) {
    return { status: 'not_needed' };
  }
  try {
    await AsyncStorage.setItem(NICKNAME_PROMPT_KEY, 'true');
  } catch {
    return { status: 'unavailable', stage: 'record' };
  }
  return { status: 'claimed', displayName: name };
}

// Retain a reservation across an effect cancellation before native presentation.
// Once onShow fires, a remount must not invite the player again.
let pendingInvitation: Extract<NicknamePromptClaim, { status: 'claimed' }> | null = null;
let preparation: Promise<NicknamePromptClaim> | null = null;

export function prepareNicknamePrompt(): Promise<NicknamePromptClaim> {
  if (pendingInvitation) return Promise.resolve(pendingInvitation);
  if (preparation) return preparation;
  preparation = claimNicknamePrompt().then(result => {
    if (result.status === 'claimed') pendingInvitation = result;
    return result;
  }).finally(() => { preparation = null; });
  return preparation;
}

export function acknowledgeNicknamePromptShown(): void {
  pendingInvitation = null;
}

export async function isNicknamePromptStillEligible(displayName: string): Promise<boolean> {
  try {
    const [name, explicitlySet] = await Promise.all([
      AsyncStorage.getItem('@display_name'), AsyncStorage.getItem('@display_name_set'),
    ]);
    return name === displayName && (explicitlySet === null || explicitlySet === 'false');
  } catch {
    return false;
  }
}

export async function hasCompletedTutorial(): Promise<boolean | null> {
  try { return (await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY)) === 'true'; }
  catch { return null; }
}

export async function completeTutorial(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    return true;
  } catch { return false; }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { analyticsService } from './analyticsService';
import { FIRST_SOLVE_KEY, PLAYER_STATS_KEY } from './playerStatsService';

const KEY = '@jamaica_common_first_value_v1';
type InstallEvidence = 'verified_new' | 'verified_existing' | 'unknown';
type Scope = 'unknown' | 'existing' | 'new_since_measurement';
interface State {
  version: 1;
  scope: Scope;
  reached: boolean;
  sent: boolean;
  blocked: boolean;
}
interface EvidenceBridge {
  getMeasurementInstallEvidence(): Promise<InstallEvidence>;
}

/** Native code must verify the install transaction + rollout cutoff; never derive new from empty storage. */
export class FirstValueMeasurementService {
  private state?: State;
  private queue: Promise<void> = Promise.resolve();
  private started = false;
  private verifiedThisLaunch = false;

  constructor(private readonly development = __DEV__) {}

  private collectionAllowed(): boolean {
    return !this.development && NativeModules.PurchaseModule?.measurementCollectionAllowed !== false;
  }

  private serial(work: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(work).catch(() => {
      // Fail closed. No send or new-scope inference on storage/native errors.
    });
    return this.queue;
  }

  initialize(): Promise<void> {
    if (!this.started) {
      this.started = true;
      this.serial(async () => {
        const entries = await AsyncStorage.multiGet([KEY, FIRST_SOLVE_KEY, PLAYER_STATS_KEY]);
        const values = Object.fromEntries(entries);
        let state: State;
        if (values[KEY] !== null) {
          try {
            const saved = JSON.parse(values[KEY]!);
            if (saved.version !== 1 || !['unknown', 'existing', 'new_since_measurement'].includes(saved.scope)
              || typeof saved.reached !== 'boolean' || typeof saved.sent !== 'boolean'
              || typeof saved.blocked !== 'boolean' || (saved.sent && !saved.reached)) throw new Error('invalid');
            state = saved;
          } catch {
            // A damaged ledger may have recorded a previous send: never reset it into an eligible scope.
            state = { version: 1, scope: 'unknown', reached: false, sent: false, blocked: true };
          }
        } else {
          let history: Record<string, unknown> = {};
          let damaged = false;
          try {
            if (values[PLAYER_STATS_KEY]) history = JSON.parse(values[PLAYER_STATS_KEY]!);
            if (!history || typeof history !== 'object' || Array.isArray(history)) throw new Error('invalid');
          } catch { history = {}; damaged = true; }
          if (values[FIRST_SOLVE_KEY] !== null && !['true', 'false'].includes(values[FIRST_SOLVE_KEY]!)) damaged = true;
          const positive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;
          for (const field of ['gamesPlayed', 'totalCorrect', 'streakDays', 'bestStreakDays']) {
            const value = history[field];
            if (value !== undefined && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) damaged = true;
          }
          const firstPlayedAt = history.firstPlayedAt;
          if (firstPlayedAt !== undefined && firstPlayedAt !== null
            && (typeof firstPlayedAt !== 'number' || !Number.isFinite(firstPlayedAt) || firstPlayedAt < 0)) damaged = true;
          const lastPlayDate = history.lastPlayDate;
          if (lastPlayDate !== undefined && lastPlayDate !== null
            && (typeof lastPlayDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lastPlayDate))) damaged = true;
          const solved = values[FIRST_SOLVE_KEY] === 'true' || positive(history.totalCorrect);
          const played = solved || positive(history.gamesPlayed) || positive(history.firstPlayedAt)
            || positive(history.streakDays) || positive(history.bestStreakDays) || typeof lastPlayDate === 'string';
          state = { version: 1, scope: played ? 'existing' : 'unknown', reached: solved, sent: false, blocked: damaged };
        }
        await this.persist(state);
      });
    }
    return this.queue;
  }

  /** Invoked at startup; missing native support is unknown, never verified_new. */
  async refreshInstallEvidence(): Promise<void> {
    this.verifiedThisLaunch = false;
    await this.initialize();
    const bridge = NativeModules.PurchaseModule as EvidenceBridge | undefined;
    if (!bridge?.getMeasurementInstallEvidence) return;
    try {
      await this.acceptInstallEvidence(await bridge.getMeasurementInstallEvidence());
    } catch { /* offline/unverified/unsupported stays unknown */ }
  }

  /** Internal bridge boundary. Raw receipts, versions and identifiers are never Analytics params. */
  acceptInstallEvidence(evidence: InstallEvidence): Promise<void> {
    this.initialize();
    return this.serial(async () => {
      this.verifiedThisLaunch = false;
      const state = this.state;
      if (!state || state.blocked || state.scope === 'existing' || evidence === 'unknown') return;
      if (evidence !== 'verified_new' && evidence !== 'verified_existing') return;
      await this.persist({ ...state, scope: evidence === 'verified_new' ? 'new_since_measurement' : 'existing' });
      this.verifiedThisLaunch = evidence === 'verified_new';
      await this.sendIfEligible();
    });
  }

  recordFirstCorrect(): Promise<void> {
    const allowedAtObservation = this.collectionAllowed();
    this.initialize();
    return this.serial(async () => {
      if (!this.state || this.state.blocked || this.state.scope === 'existing') return;
      if (!allowedAtObservation || !this.collectionAllowed()) {
        // Consume an excluded first correct; never relabel a later correct as the first.
        // Preserve a valid production pending value that was already observed earlier.
        if (!this.state.reached) {
          // Even if the durable write fails, a later toggle cannot reclassify the next correct in this process.
          this.state = { ...this.state, blocked: true };
          await this.persist(this.state);
        }
        return;
      }
      if (!this.state.reached) await this.persist({ ...this.state, reached: true });
      await this.sendIfEligible();
    });
  }

  private async persist(state: State) {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    this.state = state;
  }

  private async sendIfEligible() {
    const state = this.state;
    if (!this.collectionAllowed() || !this.verifiedThisLaunch || !state || state.blocked || state.scope !== 'new_since_measurement' || !state.reached || state.sent) return;
    // Persist before SDK handoff: crashes can lose delivery, but cannot re-send on every launch.
    await this.persist({ ...state, sent: true });
    analyticsService.logEvent('value_first_reached', {
      schema_version: 1,
      activation_key: 'first_problem_solved',
      definition_version: 1,
      first_status: 'new_since_measurement',
    });
  }
}

export const firstValueMeasurementService = new FirstValueMeasurementService();

import { analyticsService } from './analyticsService';

type ProblemResult = 'success' | 'defeat' | 'cancelled';
type ErrorCode = 'network' | 'timeout' | 'storage' | 'validation' | 'permission' | 'unknown';

/** One in-memory operation per playable problem. Never infer a result on kill/background. */
class ProblemMeasurementService {
  private active = false;

  start() {
    if (this.active) return;
    this.active = true;
    analyticsService.logEvent('action_start', {
      schema_version: 1,
      action_name: 'solve_problem',
    });
  }

  finish(...[result, errorCode]: [ProblemResult] | ['error', ErrorCode]) {
    if (!this.active) return;
    // Consume before handing the event to the SDK so repeated callbacks cannot send twice.
    this.active = false;
    analyticsService.logEvent('action_result', {
      schema_version: 1,
      action_name: 'solve_problem',
      result,
      ...(result === 'error' ? { error_code: errorCode ?? 'unknown' } : {}),
    });
  }
}

export const problemMeasurementService = new ProblemMeasurementService();

/**
 * Game-related utility functions
 */

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds (can be undefined for safety)
 * @returns Formatted time string (e.g., "1:23", "0:05")
 */
export const formatTime = (seconds: number | undefined): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  // カウントダウンなので、残り時間が小数でも切り上げて表示する
  const totalSeconds = Math.ceil(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

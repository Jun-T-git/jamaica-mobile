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
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get time color based on remaining time for challenge mode
 * @param timeLeft - Remaining time in seconds
 * @param warningTime - Time threshold for warning color
 * @param primaryColor - Normal color
 * @param dangerColor - Warning color
 * @returns Color string
 */
export const getTimeColor = (
  timeLeft: number,
  warningTime: number,
  primaryColor: string,
  dangerColor: string
): string => {
  return timeLeft <= warningTime ? dangerColor : primaryColor;
};
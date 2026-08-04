// Shared notification utilities moved out of NotificationContext to preserve
// React Fast Refresh behavior (files exporting components only).

export const DEFAULT_TOAST_DURATION = 4500; // milliseconds

/**
 * Format a small notification message from structured data.
 * Keep this generic so other components can reuse it.
 */
export function formatNotificationMessage({ name, action }) {
  if (!name && !action) return '';
  if (!name) return String(action);
  if (!action) return String(name);
  return `${name} ${action}`;
}

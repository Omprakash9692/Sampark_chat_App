

export const DEFAULT_TOAST_DURATION = 4500; // milliseconds


export function formatNotificationMessage({ name, action }) {
  if (!name && !action) return '';
  if (!name) return String(action);
  if (!action) return String(name);
  return `${name} ${action}`;
}

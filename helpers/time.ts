export const formatTimeAgo = (timestamp: number, ignoreAgo = false) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  // If more than 24 hours, show actual date
  if (hours >= 24) {
    return new Date(timestamp).toLocaleString();
  }

  // Show relative time
  if (hours > 0) {
    return `${hours}hr${hours > 1 ? "s" : ""} ${ignoreAgo ? "" : "ago"}`;
  }
  if (minutes > 0) {
    return `${minutes}min${minutes > 1 ? "s" : ""} ${ignoreAgo ? "" : "ago"}`;
  }
  return `${seconds}s ${ignoreAgo ? "" : "ago"}`;
};

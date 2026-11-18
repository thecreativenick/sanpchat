// e.g. "1 minute ago", "5 minutes ago"
const timeAgo = (count: number, unit: string): string =>
  `${count} ${unit}${count === 1 ? '' : 's'} ago`;

export const relativeTime = (timestamp: number): string => {
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = Date.now() - timestamp;

  // Timestamps in the future (e.g. clock drift between devices)
  if (elapsed < 0) {
    return 'just now';
  } else if (elapsed < msPerMinute) {
    return timeAgo(Math.floor(elapsed / msPerSecond), 'second');
  } else if (elapsed < msPerHour) {
    return timeAgo(Math.floor(elapsed / msPerMinute), 'minute');
  } else if (elapsed < msPerDay) {
    return timeAgo(Math.floor(elapsed / msPerHour), 'hour');
  } else if (elapsed < msPerMonth) {
    return timeAgo(Math.floor(elapsed / msPerDay), 'day');
  } else if (elapsed < msPerYear) {
    return timeAgo(Math.floor(elapsed / msPerMonth), 'month');
  } else {
    return timeAgo(Math.floor(elapsed / msPerYear), 'year');
  }
};

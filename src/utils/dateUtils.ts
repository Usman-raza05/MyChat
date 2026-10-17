import { strings } from '../strings';

export const formatMessageTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatChatListDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return strings.chatScreen.daySeparatorYesterday;
  }

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export const getDaySeparatorLabel = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return strings.chatScreen.daySeparatorToday;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return strings.chatScreen.daySeparatorYesterday;

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatLastSeen = (isoString: string | null): string => {
  if (!isoString) return strings.chatScreen.offlineBanner;
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 2 * 60 * 1000) return strings.chatScreen.online;
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / 60000)}m ago`;

  const timeStr = formatMessageTime(isoString);
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return strings.chatScreen.lastSeenTodayAt(timeStr);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return strings.chatScreen.lastSeenYesterdayAt(timeStr);

  return strings.chatScreen.lastSeen(formatChatListDate(isoString));
};

export const generateAvatarColors = (name: string, isDark: boolean) => {
  let hash = 0;
  for (const char of (name || 'User').toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  const bg = isDark ? `hsl(${hash}, 45%, 28%)` : `hsl(${hash}, 45%, 86%)`;
  const text = isDark ? `hsl(${hash}, 50%, 80%)` : `hsl(${hash}, 50%, 28%)`;
  return { bg, text };
};

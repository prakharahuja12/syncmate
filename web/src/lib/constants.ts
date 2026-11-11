const stripTrailingSlash = (url: string): string => url.trim().replace(/\/+$/, '');

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_URL || 'https://syncmate-2d9o.onrender.com/api/v1'
);

export const SOCKET_URL = stripTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || 'https://syncmate-2d9o.onrender.com'
);

export const WEB_URL = stripTrailingSlash(
  import.meta.env.VITE_WEB_URL ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://syncmate-one.vercel.app')
);

export const CATEGORY_COLORS = {
  hackathon: '#8E4EC6',
  college: '#3E63DD',
  personal: '#30A46C',
  meeting: '#F5A524',
  competition: '#D6409F',
  other: '#8B8D98',
} as const;

export const CATEGORY_LABELS = {
  hackathon: 'Hackathon',
  college: 'College',
  personal: 'Personal',
  meeting: 'Meeting',
  competition: 'Competition',
  other: 'Other',
} as const;

export const PRIORITY_COLORS = {
  high: '#E5484D',
  medium: '#F5A524',
  low: '#30A46C',
} as const;

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

export const PARTICIPATION_LABELS = {
  interested: 'Interested',
  planning: 'Planning to register',
  registered: 'Registered',
  not_interested: 'Not interested',
} as const;

export const PARTICIPATION_ICONS = {
  interested: '👀',
  planning: '🗓️',
  registered: '✅',
  not_interested: '✖️',
} as const;


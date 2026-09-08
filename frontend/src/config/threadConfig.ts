/**
 * Thread Configuration
 * Defines the identity, color, and icons for each "thread" in ReTh.
 */

export type ThreadId = 'redthread' | 'blueth' | 'purpleth' | 'greenth' | 'goldth';

export interface ThreadConfig {
  id: ThreadId;
  label: string;
  labelEs: string;
  color: string;
  icon: string;
  gradient: string;
  activeBg: string; // Background color for active item
}

export const THREAD_CONFIGS: Record<ThreadId, ThreadConfig> = {
  redthread: {
    id: 'redthread',
    label: 'RedThread',
    labelEs: 'RedThread',
    color: '#ff4d4f',
    icon: '❤️',
    gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    activeBg: 'rgba(255, 77, 79, 0.1)',
  },
  blueth: {
    id: 'blueth',
    label: 'Blueth',
    labelEs: 'Blueth',
    color: '#3B82F6',
    icon: '🌊',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    activeBg: 'rgba(59, 130, 246, 0.1)',
  },
  purpleth: {
    id: 'purpleth',
    label: 'Purpleth',
    labelEs: 'Purpleth',
    color: '#a855f7',
    icon: '✨',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
    activeBg: 'rgba(168, 85, 247, 0.1)',
  },
  greenth: {
    id: 'greenth',
    label: 'Greenth',
    labelEs: 'Greenth',
    color: '#10b981',
    icon: '🌿',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    activeBg: 'rgba(16, 185, 129, 0.1)',
  },
  goldth: {
    id: 'goldth',
    label: 'Goldth',
    labelEs: 'Goldth',
    color: '#f59e0b',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    activeBg: 'rgba(245, 158, 11, 0.1)',
  },
};

export const getThreadConfig = (id: ThreadId): ThreadConfig => {
  return THREAD_CONFIGS[id] || THREAD_CONFIGS.redthread;
};

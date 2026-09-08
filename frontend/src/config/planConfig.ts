/**
 * Plan Configuration
 * Defines visual identity for subscription tiers: Free, Premium, VIP
 */

export type SubscriptionTier = 'free' | 'premium' | 'vip';

export interface PlanConfig {
  tier: SubscriptionTier;
  label: string;
  labelEs: string;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
    light: string;
    dark: string;
  };
  icon: string;
  features: string[];
  boostAllocation: string;
  limits?: {
    maxStates?: number;
    maxCountries?: number;
  };
}

export const PLAN_CONFIGS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    tier: 'free',
    label: 'Free',
    labelEs: 'Gratis',
    color: {
      primary: '#9E9E9E',
      secondary: '#757575',
      gradient: 'linear-gradient(135deg, #BDBDBD 0%, #9E9E9E 50%, #757575 100%)',
      light: '#F5F5F5',
      dark: '#616161',
    },
    icon: '👤',
    features: ['Basic matching', 'Limited likes', 'Standard filters'],
    boostAllocation: '1 Boost / semana',
    limits: {
      maxStates: 0,
      maxCountries: 0,
    },
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    labelEs: 'Premium',
    color: {
      primary: '#C0C0C0', // Silver metallic base
      secondary: '#8F8F8F', // Cool shadow
      gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 25%, #C0C0C0 50%, #8F8F8F 100%)', // Polished silver with white highlight
      light: '#E6E6E6',
      dark: '#8F8F8F',
    },
    icon: '⭐',
    features: [
      'See who likes you',
      'Unlimited likes',
      'Advanced filters',
      'Extended radar',
      'Rewind feature',
    ],
    boostAllocation: '1 Boost / día',
    limits: {
      maxStates: 10,
      maxCountries: 0,
    },
  },
  vip: {
    tier: 'vip',
    label: 'VIP',
    labelEs: 'VIP',
    color: {
      primary: '#D4AF37', // Metallic gold base
      secondary: '#8D6E27', // Dark gold shadow
      gradient: 'linear-gradient(135deg, #F5E29A 0%, #FFD700 25%, #D4AF37 50%, #8D6E27 100%)', // Luxurious gold with soft white shine
      light: '#F5E29A',
      dark: '#8D6E27',
    },
    icon: '👑',
    features: [
      'All Premium features',
      'Priority support',
      'Exclusive events',
      'Video calls',
      'Message translation',
      'Profile boost',
    ],
    boostAllocation: '3 Boosts / día',
    limits: {
      maxStates: 20,
      maxCountries: 20,
    },
  },
};

/**
 * Get plan configuration by tier
 */
export const getPlanConfig = (tier?: SubscriptionTier | string): PlanConfig => {
  const normalizedTier = (tier?.toLowerCase() || 'free') as SubscriptionTier;
  return PLAN_CONFIGS[normalizedTier] || PLAN_CONFIGS.free;
};

/**
 * Get plan color by tier
 */
export const getPlanColor = (tier?: SubscriptionTier | string): string => {
  return getPlanConfig(tier).color.primary;
};

/**
 * Get plan gradient by tier
 */
export const getPlanGradient = (tier?: SubscriptionTier | string): string => {
  return getPlanConfig(tier).color.gradient;
};

/**
 * Get plan label by tier (localized)
 */
export const getPlanLabel = (tier?: SubscriptionTier | string, lang: 'en' | 'es' = 'es'): string => {
  const config = getPlanConfig(tier);
  return lang === 'es' ? config.labelEs : config.label;
};

/**
 * Get plan icon by tier
 */
export const getPlanIcon = (tier?: SubscriptionTier | string): string => {
  return getPlanConfig(tier).icon;
};

/**
 * Check if tier is premium or higher
 */
export const isPremiumOrHigher = (tier?: SubscriptionTier | string): boolean => {
  const normalizedTier = (tier?.toLowerCase() || 'free') as SubscriptionTier;
  return normalizedTier === 'premium' || normalizedTier === 'vip';
};

/**
 * Check if tier is VIP
 */
export const isVIP = (tier?: SubscriptionTier | string): boolean => {
  const normalizedTier = (tier?.toLowerCase() || 'free') as SubscriptionTier;
  return normalizedTier === 'vip';
};

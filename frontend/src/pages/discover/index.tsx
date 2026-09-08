import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Divider,
  Paper,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  EmojiObjects as InterestsIcon,
  Tune as TuneIcon,
  Bolt as BoltIcon,
  InfoOutlined as InfoIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import ProfileCard, { Profile } from '../../components/profile/ProfileCard';
import apiClient from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import DiscoverEmptyState from '../../components/discovery/DiscoverEmptyState';
import QuickInterests from '../../components/discovery/QuickInterests';
import { useSnackbar } from 'notistack';
import { calculateProfileScore, calculateCompletionPercentage, getProfileSuggestions } from '../../utils/profileScoring';
import AsyncLocationSelector from '../../components/common/AsyncLocationSelector';

const LocationMap = dynamic(() => import('../../components/common/LocationMap'), {
  ssr: false,
  loading: () => <Box sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress size={24} />
  </Box>
});

import SocialBatteryWidget from '../../components/common/SocialBatteryWidget';
import TimeOutModal from '../../components/common/TimeOutModal';
import InteractionSettingsDialog, { InteractionMode, LayoutMode } from '../../components/discovery/InteractionSettingsDialog';
import StackLayout from '../../components/discovery/layouts/StackLayout';
import StickerBookLayout from '../../components/discovery/layouts/StickerBookLayout';
import CarouselLayout from '../../components/discovery/layouts/CarouselLayout';
import GridLayout from '../../components/discovery/layouts/GridLayout';
import DiscoverToolbar from '../../components/discovery/DiscoverToolbar';
import CareNarrativePanel from '../../components/discovery/CareNarrativePanel';
import CompatibilityTechnicalPanel from '../../components/discovery/CompatibilityTechnicalPanel';
import ProfileDetailModal from '../../components/discovery/ProfileDetailModal';
import BoostActivationModal from '../../components/discovery/BoostActivationModal';
import boostService, { BoostStatus } from '../../services/boostService';
import DiscoveryModeSelector, { DiscoveryMode } from '../../components/discovery/DiscoveryModeSelector';
import { useAppTheme } from '../../context/ThemeContext';
import DiscoveryRefinementCard from '../../components/discovery/DiscoveryRefinementCard';
import CuriosityGenderSelector from '../../components/discovery/CuriosityGenderSelector';

export default function Discover() {
  const { mode } = useAppTheme();
  const isLight = mode === 'light';
  const router = useRouter();
  const { t, i18n } = useTranslation('discover');
  const { enqueueSnackbar } = useSnackbar();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [queue, setQueue] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now()); // CARE: Track dwell time
  const [history, setHistory] = useState<Profile[]>([]); // New: Track swiped profiles for Undo
  const [shownProfileIds, setShownProfileIds] = useState<Set<string>>(new Set()); // Track all shown profiles

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [ageRange, setAgeRange] = useState<number[]>([18, 50]);
  const [useAgeRule, setUseAgeRule] = useState(false);
  const [distance, setDistance] = useState<number>(50);
  const [searchStates, setSearchStates] = useState<string[]>([]);
  const [searchCountries, setSearchCountries] = useState<string[]>([]);
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('suggested');
  const [minCompatibility, setMinCompatibility] = useState<number>(0);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showInterests, setShowInterests] = useState(false);

  // Boost State
  const [boostStatus, setBoostStatus] = useState<BoostStatus | null>(null);
  const [boostActive, setBoostActive] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [boostMultiplier, setBoostMultiplier] = useState(1);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostCareMessage, setBoostCareMessage] = useState('');

  const [isCurious, setIsCurious] = useState(false); // Curiosity Mode State
  const [showCuriositySelector, setShowCuriositySelector] = useState(false);
  const [curiosityGenders, setCuriosityGenders] = useState<string[]>([]);
  const [locationScope, setLocationScope] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const regionCache = useRef<Map<string, any>>(new Map());

  // Social Battery State
  const [batteryLevel, setBatteryLevel] = useState(85); // Default 85%
  const [showTimeOutModal, setShowTimeOutModal] = useState(false);

  // Interaction State
  const [showInteractionSettings, setShowInteractionSettings] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('buttons'); // Default per blueprint
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('stack'); // Default layout
  const [selectedProfileDetail, setSelectedProfileDetail] = useState<Profile | null>(null);
  const [showCompatibility, setShowCompatibility] = useState(false); // Mobile toggle for panels
  const [showCareNarrative, setShowCareNarrative] = useState(false); // Mobile toggle for CARE

  // Refinement Card State
  const [likesSinceLastCard, setLikesSinceLastCard] = useState(0);
  const [refinementSuggestion, setRefinementSuggestion] = useState<any>(null);
  const [options, setOptions] = useState<any>({});
  const [recentlyShownSections, setRecentlyShownSections] = useState<string[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedInteraction = localStorage.getItem('interactionMode');
    const savedLayout = localStorage.getItem('layoutMode');
    if (savedInteraction) setInteractionMode(savedInteraction as InteractionMode);
    if (savedLayout) setLayoutMode(savedLayout as LayoutMode);
  }, []);

  const isFilterActive = useMemo(() => {
    return ageRange[0] !== 18 ||
      ageRange[1] !== 50 ||
      distance !== 50 ||
      searchStates.length > 0 ||
      searchCountries.length > 0 ||
      onlineOnly ||
      minCompatibility > 0;
  }, [ageRange, distance, searchStates, searchCountries, onlineOnly, minCompatibility]);

  // Auto-collapse logic when cards are present
  useEffect(() => {
    if (queue.length > 0) {
      setShowInterests(false);
    }
  }, [queue.length]);

  // CARE: Reset dwell time when profile changes
  useEffect(() => {
    setViewStartTime(Date.now());
  }, [queue[0]?.user_id]);

  const userPlan = myProfile?.subscription_tier || 'free';
  const isPremium = ['premium', 'vip'].includes(userPlan);
  const isVIP = userPlan === 'vip';

  // More Mode State
  const [selectedMoreCategory, setSelectedMoreCategory] = useState<any>(null); // Store entire category object

  // Dynamic import for code splitting
  const MoreModeSelection = dynamic(() => import('../../components/discovery/MoreModeSelection'));
  const DiscoveryRadarLoader = dynamic(() => import('../../components/discovery/DiscoveryRadarLoader'));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Only fetch queue automatically if NOT in 'more' mode OR if a category is selected in 'more' mode
    if (discoveryMode !== 'more' || selectedMoreCategory) {
      fetchQueue();
    }
    fetchMyProfile();
    fetchBoostStatus();
  }, [isAuthenticated, router, discoveryMode, selectedMoreCategory]);


  const fetchBoostStatus = async () => {
    try {
      const status = await boostService.getStatus();
      setBoostStatus(status);
      setBoostActive(status.is_active);
      setBoostTimeLeft(status.time_left_seconds);
      setBoostMultiplier(status.multiplier || 1);
    } catch (err) {
      console.error('Failed to fetch boost status', err);
    }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await apiClient.get('/profiles/me');
      setMyProfile(res.data);
      if (res.data.distance_preference_km) {
        setDistance(res.data.distance_preference_km);
      }
      if (res.data.search_states) {
        setSearchStates(res.data.search_states);
      }
      if (res.data.search_countries) {
        setSearchCountries(res.data.search_countries);
      }
      if (res.data.location_scope) {
        setLocationScope(res.data.location_scope);
      }
      if (res.data.feeling_curious !== undefined) {
        setIsCurious(!!res.data.feeling_curious);
      }
      if (res.data.curiosity_genders) {
        setCuriosityGenders(res.data.curiosity_genders);
      }

      // Fetch metadata options
      const lang = i18n.language || 'es';
      const optionsRes = await apiClient.get(`/options?lang=${lang}`);
      setOptions(optionsRes.data);
    } catch (err) {
      console.error('Failed to fetch my profile', err);
    }
  };

  // Reload queue when mode changes
  useEffect(() => {
    setQueue([]); // Clear current queue to avoid mixing modes
    fetchQueue();
  }, [discoveryMode, isCurious, curiosityGenders]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 10,
        mode: discoveryMode
      };
      if (ageRange[0] !== 18 || ageRange[1] !== 50) {
        params.age_min = ageRange[0];
        params.age_max = ageRange[1];
      }
      if (distance < 100) params.distance_km = distance;
      if (searchStates.length > 0) params.states = searchStates;
      if (searchCountries.length > 0) params.countries = searchCountries;
      if (onlineOnly) params.online = true;
      if (isCurious) {
        params.curiosity_mode = true;
        if (curiosityGenders.length > 0) {
          params.curiosity_genders = curiosityGenders;
        }
      }
      // Compatibility Logic
      if (minCompatibility > 0) {
        if (discoveryMode === 'opposites') {
          // For opposites, user wants "Low Similarity" (<70%)
          // We use minCompatibility state variable to track "is compatibility filter active",
          // but here we invert it for the API query
          params.max_compatibility = 70;
        } else {
          params.min_compatibility = minCompatibility;
        }
      }

      // MORE MODE LOGIC
      if (discoveryMode === 'more' && selectedMoreCategory) {
        if (selectedMoreCategory.type === 'relationship') {
          params.intention = selectedMoreCategory.id;
        } else if (selectedMoreCategory.type === 'interest') {
          params.interest = selectedMoreCategory.id;
        } else if (selectedMoreCategory.type === 'status') {
          // Map status IDs to specific params
          if (selectedMoreCategory.id === 'verified') params.is_verified = true;
          if (selectedMoreCategory.id === 'wants_kids') params.family_plans = 'wants_children';
          if (selectedMoreCategory.id === 'no_kids') params.family_plans = 'does_not_want_children';
        }
      }


      const response = await apiClient.get('/discovery/queue', { params });

      // Filter out profiles already shown in this session
      const newProfiles = response.data.filter(
        (p: Profile) => !shownProfileIds.has(p.user_id)
      );

      // Update shown profiles set
      setShownProfileIds(prev => {
        const updated = new Set(prev);
        newProfiles.forEach((p: Profile) => updated.add(p.user_id));
        return updated;
      });

      if (newProfiles.length === 0 && myProfile) {
        const completion = calculateCompletionPercentage(calculateProfileScore(myProfile));
        if (completion < 100) {
          const suggestions = getProfileSuggestions(myProfile);
          if (suggestions.length > 0) {
            const refinementItem = {
              user_id: `refinement-empty-${Date.now()}`,
              isRefinement: true,
              suggestion: suggestions[0],
              currentCompletion: completion
            };
            setQueue([refinementItem as any]);
            setLoading(false);
            return;
          }
        }
      }

      setQueue(newProfiles);
    } catch (err) {
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCuriosityChange = async (v: boolean) => {
    if (v) {
      setShowCuriositySelector(true);
    } else {
      setIsCurious(false);
      setCuriosityGenders([]);
      try {
        await apiClient.put('/profiles/me', {
          feeling_curious: false,
          curiosity_genders: []
        });
        enqueueSnackbar("Modo Curioso desactivado.", { variant: 'info', autoHideDuration: 2000 });
      } catch (err) {
        console.error("Failed to save curiosity state", err);
      }
    }
  };

  const handleSaveToProfile = async () => {
    try {
      setIsUpdatingProfile(true);

      const payload: any = {
        distance_preference_km: distance,
        search_states: searchStates,
        search_countries: searchCountries,
      };

      // Determine current access level
      const currentAccessLevel = isVIP ? 'vip' : isPremium ? 'premium' : 'free';

      // If we have an active locationScope (e.g. from continent selection)
      if (locationScope?.mode === 'continent') {
        payload.location_scope = {
          ...locationScope,
          access_level: currentAccessLevel
        };
      } else {
        // Default countries mode
        payload.location_scope = {
          mode: 'countries',
          selected_continent: null,
          selected_countries: searchCountries,
          excluded_countries: locationScope?.excluded_countries || [],
          limit: isVIP ? 20 : isPremium ? 10 : 0,
          access_level: currentAccessLevel
        };
      }

      await apiClient.put('/profiles/me', payload);
      enqueueSnackbar(t('filters.syncSuccess', 'Preferencias guardadas en tu perfil.'), { variant: 'success' });
      setShowFilters(false);
    } catch (err) {
      console.error('Failed to sync preferences', err);
      enqueueSnackbar(t('errors.updateFailed', 'Error al sincronizar preferencias'), { variant: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleApplyFilters = async () => {
    setShowFilters(false);
    fetchQueue();

    // Sync with profile
    try {
      setIsUpdatingProfile(true);
      await apiClient.put('/profiles/distancia', {
        distance_km: distance,
        search_states: searchStates,
        search_countries: searchCountries
      });
      enqueueSnackbar(t('filters.distance.syncMessage', 'Este ajuste también se guardará en tu perfil.'), { variant: 'info', autoHideDuration: 2000 });
    } catch (err) {
      console.error('Failed to sync distance preference', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSwipe = async (interaction: 'like' | 'pass' | 'superlike') => {
    if (queue.length === 0) return;

    const targetProfile = queue[0];

    // Check if it's a refinement card
    if ((targetProfile as any).isRefinement) {
      // Refinement cards don't use standard swipe API
      setQueue(prev => prev.slice(1));
      return;
    }

    const dwellTime = Date.now() - viewStartTime; // CARE: Calculate dwell time

    // Optimistic update
    setHistory(prev => [targetProfile, ...prev].slice(0, 10)); // Keep last 10
    setQueue((prev) => prev.slice(1));

    if (interaction === 'like') {
      setLikesSinceLastCard(prev => prev + 1);
    }

    try {
      const response = await apiClient.post('/discovery/swipe', {
        target_user_id: targetProfile.user_id,
        interaction,
        dwell_time_ms: dwellTime // CARE: Send dwell time
      });

      if (response.data.is_match) {
        setMatchAnimation(true);
        // Show match modal or notification
        setTimeout(() => setMatchAnimation(false), 3000);
      }
    } catch (err) {
      console.error('Swipe failed', err);
      // Revert optimistic update if needed (complex in practice)
    }

    // Fetch more if queue is low
    if (queue.length < 3) {
      const params: any = {
        mode: discoveryMode
      };
      if (ageRange[0] !== 18 || ageRange[1] !== 50) {
        params.age_min = ageRange[0];
        params.age_max = ageRange[1];
      }
      if (distance < 100) params.distance_km = distance;
      if (searchStates.length > 0) params.states = searchStates;
      if (searchCountries.length > 0) params.countries = searchCountries;
      if (onlineOnly) params.online = true;

      const response = await apiClient.get('/discovery/queue', { params });
      // Append new profiles avoiding duplicates (check against all shown profiles)
      const newProfiles = response.data.filter(
        (p: Profile) => !shownProfileIds.has(p.user_id) && !queue.find((q) => q.user_id === p.user_id)
      );

      // Update shown profiles set
      setShownProfileIds(prev => {
        const updated = new Set(prev);
        newProfiles.forEach((p: Profile) => updated.add(p.user_id));
        return updated;
      });

      setQueue((prev) => [...prev, ...newProfiles]);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousProfile = history[0];
    setQueue(prev => [previousProfile, ...prev]);
    setHistory(prev => prev.slice(1));
    enqueueSnackbar(t('undo.message', 'Regresaste al perfil anterior'), { variant: 'info', autoHideDuration: 1500 });
  };

  const handleVIPMessage = (profile: Profile) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    // Logic for VIP Message modal would go here
    enqueueSnackbar(t('vipMessage.comingSoon', 'Mensaje VIP: Próximamente'), { variant: 'info' });
  };

  const handleAddInterest = async (interest: string) => {
    try {
      const currentInterests = myProfile?.lifestyle_interests || myProfile?.interests || [];
      const updatedInterests = [...currentInterests, interest];

      const res = await apiClient.put('/profiles/me', {
        lifestyle_interests: updatedInterests
      });

      setMyProfile(res.data);
      enqueueSnackbar(t('emptyState.interestAdded', 'Interés añadido'), { variant: 'success' });
      fetchQueue();
    } catch (err) {
      console.error('Failed to add interest', err);
      enqueueSnackbar(t('errors.updateFailed', 'Error al actualizar perfil'), { variant: 'error' });
    }
  };

  const handleExpandSearch = () => {
    setAgeRange([18, 99]);
    setDistance(100);
    setOnlineOnly(false);
    setDiscoveryMode('free');
    setCuriosityGenders([]); // Reset curiosity genders on full expand

    // Small timeout to ensure state update is reflected in the next fetch if it relies on local state
    // But fetchQueue used in handleApplyFilters uses state directly.
    setTimeout(() => {
      fetchQueue();
    }, 100);
  };

  const handleProfileAction = (profileId: string, action: 'like' | 'pass' | 'superlike') => {
    // Find profile in queue
    const profile = queue.find(p => p.user_id === profileId);
    if (!profile) return;

    // Remove from queue
    setQueue(prev => prev.filter(p => p.user_id !== profileId));

    // Add to history for undo
    setHistory(prev => [profile, ...prev]);

    // Perform action (same as handleSwipe)
    handleSwipe(action);
  };

  const handleToggleBoost = async () => {
    if (!isPremium) {
      router.push('/suscripcion');
      return;
    }

    try {
      // If already active, don't allow "toggle off" from here if it's a backend controlled state
      // but for now, we just call activate which is the logic for consumption
      if (boostActive) return;

      const res = await boostService.activate();
      if (res.success) {
        // Correct order: Set time FIRST, then active flag
        setBoostTimeLeft(1800); // 30 minutes
        setBoostActive(true);
        setBoostMultiplier(res.multiplier || 1);
        enqueueSnackbar(res.care_message || t('boost.activated', '¡Boost activado! Tu perfil brillará durante 30 minutos'), { variant: 'success' });
      }
    } catch (err) {
      console.error('Failed to activate boost', err);
      enqueueSnackbar(t('errors.boostFailed', 'Error al activar Boost'), { variant: 'error' });
    }
  };

  // Timer for Boost
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (boostActive && boostTimeLeft > 0) {
      timer = setInterval(() => {
        setBoostTimeLeft(prev => {
          if (prev <= 1) {
            setBoostActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (boostActive && boostTimeLeft <= 0) {
      setBoostActive(false);
    }
    return () => clearInterval(timer);
  }, [boostActive, boostTimeLeft]);

  // Handle Refinement Card Logic
  useEffect(() => {
    if (!myProfile) return;

    const completion = calculateCompletionPercentage(calculateProfileScore(myProfile));
    if (completion >= 100) return;

    const threshold = completion < 50 ? 5 : (5 + Math.floor(Math.random() * 3)); // 5 or random 5-7

    if (likesSinceLastCard >= threshold) {
      import('../../utils/profileScoring').then(({ getProfileSuggestions }) => {
        const suggestions = getProfileSuggestions(myProfile);
        // Filter out recently shown sections to ensure variety
        const filteredSuggestions = suggestions.filter(
          s => !recentlyShownSections.includes(s.sectionId)
        );
        const availableSuggestions = filteredSuggestions.length > 0 ? filteredSuggestions : suggestions;

        if (availableSuggestions.length > 0) {
          const suggestion = availableSuggestions[0];
          const refinementItem = {
            user_id: `refinement-${Date.now()}`,
            isRefinement: true,
            suggestion,
            currentCompletion: completion
          };

          // Inject at next position in queue (or current if empty, but here we usually have a queue)
          setQueue(prev => {
            const newQueue = [...prev];
            // Insert at index 1 (right after the current profile)
            newQueue.splice(1, 0, refinementItem as any);
            return newQueue;
          });
          setLikesSinceLastCard(0);

          // Track this section as recently shown (keep last 3)
          setRecentlyShownSections(prev => {
            const updated = [suggestion.sectionId, ...prev];
            return updated.slice(0, 3); // Keep only last 3 sections
          });
        }
      });
    }
  }, [likesSinceLastCard, myProfile]);

  const handleRefinementSave = async (field: string, value: any) => {
    try {
      const payload = field === 'MULTIPLE' ? value : { [field]: value };
      const res = await apiClient.put('/profiles/me', payload);
      setMyProfile(res.data);
      enqueueSnackbar(t('refinement.saved', '¡Perfil actualizado! Estás más cerca de tu mejor versión ✨'), { variant: 'success' });

      // Auto-remove the refinement card from queue to continue exploration
      setQueue(prev => prev.slice(1));

      // Refresh profile to get updated suggestions
      fetchMyProfile();
    } catch (err) {
      console.error('Failed to save refinement', err);
      enqueueSnackbar(t('errors.updateFailed'), { variant: 'error' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTimeOut = (hours: number) => {
    // Logic: Setting a timeout drains the battery to 0 or low
    setBatteryLevel(0);
    enqueueSnackbar(`Modo Cueva activado por ${hours} horas 🦴. Nos vemos luego.`, { variant: 'warning', autoHideDuration: 4000 });
    // Here we would sync with backend
  };

  // Effect to fetch GeoJSON data for selected countries and states
  useEffect(() => {
    const fetchRegionData = async () => {
      const newRegions: any[] = [];
      const types: ('state' | 'country')[] = ['state', 'country'];

      // 1. Check if we are in Continent Mode (VIP)
      if (locationScope?.mode === 'continent' && locationScope.selected_continent) {
        const continent = locationScope.selected_continent;
        const cacheKey = `continent:${continent}`;

        try {
          if (regionCache.current.has(cacheKey)) {
            newRegions.push(regionCache.current.get(cacheKey));
          } else {
            const resp = await apiClient.get(`/profiles/continents/${continent}/geojson`);
            if (resp.data) {
              const region = {
                id: `continent-${continent}`,
                label: continent,
                type: 'country',
                geojson: resp.data,
                isAllSelection: true // This triggers weight: 4 in LocationMap
              };
              regionCache.current.set(cacheKey, region);
              newRegions.push(region);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch continent GeoJSON for ${continent}`, err);
        }
      }

      // 2. Fetch individual regions (if not in continent mode or for states)
      for (const type of types) {
        // Skip countries if already showing continent
        if (type === 'country' && locationScope?.mode === 'continent') continue;

        const items = type === 'state' ? searchStates : searchCountries;
        const missing = items.filter(name => !regionCache.current.has(`${type}:${name}`) && !name.startsWith('Todos'));

        if (missing.length > 0) {
          try {
            const params = new URLSearchParams();
            missing.forEach(m => params.append('q', m));
            params.append('place_type', type);
            params.append('include_geojson', 'true');

            const resp = await apiClient.get(`/profiles/places/bulk-search?${params.toString()}`);
            resp.data.forEach((item: any) => {
              if (item.geojson) {
                const region = {
                  id: `${type}-${item.query || item.label}`,
                  label: item.label,
                  type,
                  geojson: item.geojson,
                  isAllSelection: false
                };
                regionCache.current.set(`${type}:${item.query || item.label}`, region);
              }
            });
          } catch (err) {
            console.error(`Failed to fetch bulk GeoJSON for ${type}`, err);
          }
        }

        items.forEach(name => {
          if (!name.startsWith('Todos')) {
            const cached = regionCache.current.get(`${type}:${name}`);
            if (cached) newRegions.push(cached);
          }
        });
      }
      setRegions(newRegions);
    };

    if (searchCountries.length > 0 || searchStates.length > 0 || locationScope?.mode === 'continent') {
      fetchRegionData();
    } else {
      setRegions([]);
    }
  }, [searchCountries, searchStates, locationScope]);


  if (loading && queue.length === 0) {
    return (
      <Layout>
        <DiscoveryRadarLoader userImage={myProfile?.photos?.[0]} />
      </Layout>
    );
  }

  // Confirmed Partner Lock
  const isLinked = myProfile?.partner_id && (myProfile.relationship_status === 'in_relationship' || myProfile.relationship_status === 'married');

  if (isLinked) {
    return (
      <Layout>
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 80, color: 'gold', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {t('discoverLocked.title', 'Vínculo Confirmado')}
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {t('discoverLocked.message', 'Tu vínculo está confirmado. Discover se ha desactivado para respetar tu relación. Golth sigue disponible para explorar afinidades compartidas.')}
          </Typography>
          <Button variant="contained" color="secondary" href="/golth">
            Ir a Golth
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box
        ref={containerRef}
        sx={{
          pt: { xs: 0, sm: 3 },
          pb: { xs: 8, sm: 3 },
          px: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
          maxWidth: { xs: 900, md: 1200 }, // Increased for desktop to allow side space
          mx: 'auto',
          boxSizing: 'border-box',
          // overflowX: 'hidden' // Removed to avoid clipping floating buttons
        }}>
        {/* Mobile Toolbar */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%' }}>
          <DiscoverToolbar
            title={t('title', 'Descubrir')}
            isFilterActive={isFilterActive}
            setShowFilters={setShowFilters}
            setShowInteractionSettings={setShowInteractionSettings}
            batteryLevel={batteryLevel}
            setShowTimeOutModal={setShowTimeOutModal}
            boostActive={boostActive}
            onActivateBoost={handleToggleBoost}
            boostTimeLeft={boostTimeLeft}
            tier={isVIP ? 'vip' : isPremium ? 'premium' : 'free'}
            multiplier={boostMultiplier}
            currentMode={discoveryMode}
            onModeChange={(mode) => {
              setDiscoveryMode(mode);
              fetchQueue();
            }}
            isCurious={isCurious}
            onCuriousChange={handleCuriosityChange}
          />
        </Box>

        {/* Desktop Floating Header Island (2-Row Design) */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          width: '100%',
          justifyContent: 'center',
          mb: 4,
          position: 'relative',
          zIndex: 100
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#121214', // Deeper matte dark
            borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.05)',
            pb: 1,
            pt: 1.5,
            px: 3,
            minWidth: '650px',
            width: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            gap: 0.5
          }}>
            {/* TOP ROW: Tools - Title - Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

              {/* LEFT: Tools */}
              <Box sx={{ display: 'flex', gap: 1.5, width: '140px' }}>
                <IconButton onClick={() => setShowInteractionSettings(true)} size="small" sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => setShowFilters(true)} size="small" sx={{ color: isFilterActive ? '#69F0AE' : 'rgba(255,255,255,0.8)', p: 0.5 }}>
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* CENTER: Title */}
              <Typography variant="overline" sx={{ letterSpacing: 5, fontWeight: 900, color: 'white', fontSize: '14px', textAlign: 'center', opacity: 0.9 }}>
                DESCUBRIR
              </Typography>

              {/* RIGHT: Boost & Battery */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '140px', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleToggleBoost}
                  startIcon={<BoltIcon sx={{ fontSize: '1rem !important' }} />}
                  sx={{
                    borderRadius: '20px',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: boostActive ? '#FFD700' : 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    letterSpacing: 1,
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.4,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', boxShadow: 'none' }
                  }}
                >
                  {boostActive ? `X${boostMultiplier} ${formatTime(boostTimeLeft)}` : 'BOOST'}
                </Button>
                <SocialBatteryWidget
                  batteryLevel={batteryLevel}
                  onOpenTimeOut={() => setShowTimeOutModal(true)}
                  compact
                />
              </Box>
            </Box>

            {/* BOTTOM ROW: Modes */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DiscoveryModeSelector
                currentMode={discoveryMode}
                onModeChange={(mode) => {
                  setDiscoveryMode(mode);
                  setSelectedMoreCategory(null); // Reset sub-category on mode switch
                  if (mode !== 'more') fetchQueue(); // Fetch immediately for other modes
                }}
                isCurious={isCurious}
                onCuriousChange={handleCuriosityChange}
              />
            </Box>
          </Box>
        </Box>

      </Box>

      {/* MORE MODE: Selection Grid */}
      {
        discoveryMode === 'more' && !selectedMoreCategory ? (
          <Box sx={{ mt: 1, mb: 10 }}>
            <MoreModeSelection onSelectCategory={(cat: any) => setSelectedMoreCategory(cat)} />
          </Box>
        ) : null
      }

      {/* Normal Discovery Flow (Queue or Empty) - Hide if in More Mode Selection */}
      {
        (discoveryMode !== 'more' || selectedMoreCategory) && (
          <>
            {/* ... Existing alerts and queue rendering ... */}

            {/* Relationship Status Context Alert */}
            {(() => {
              const romanticDiscoveryWhitelist = [
                'single',
                'prefer_not_to_say',
                'open_relationship',
                'complicated',
                'divorced',
                'widowed'
              ];
              const isRomanticDiscoveryAllowed = romanticDiscoveryWhitelist.includes(myProfile?.relationship_status);

              if (myProfile && !isRomanticDiscoveryAllowed) {
                return (
                  <Alert severity="info" sx={{ mb: 3, width: '100%', borderRadius: 3 }}>
                    <strong>{t('friendshipMode.title')}</strong>: {t('friendshipMode.description')}
                  </Alert>
                );
              }
              return null;
            })()}

            {/* Completeness alert moved below for mobile or kept above for desktop if needed, 
                but here we follow user request to avoid opaquing cards in vertical mode */}
            {myProfile && calculateCompletionPercentage(calculateProfileScore(myProfile)) < 60 && (
              <Alert
                severity="warning"
                sx={{
                  mb: 4,
                  width: 'fit-content',
                  maxWidth: '90%',
                  mx: 'auto',
                  borderRadius: '20px',
                  bgcolor: isLight ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.05)',
                  color: isLight ? '#e65100' : '#ffa726',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)',
                  px: 3,
                  display: { xs: 'none', md: 'flex' }, // Hide on mobile (will appear below)
                  alignItems: 'center',
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  },
                  '& .MuiAlert-icon': {
                    mr: 1,
                    opacity: 0.9
                  }
                }}
              >
                {t('lowCompletenessAlert', 'Entre más detalles agregues a tu perfil, mejores coincidencias recibirás')}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                {error}
              </Alert>
            )}


            {matchAnimation && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.8)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <Typography variant="h2" fontWeight={700} sx={{ color: '#FF6B6B', mb: 2 }}>
                  {t('match.title')}
                </Typography>
                <Typography variant="h5">
                  {t('match.description', { name: queue[0]?.display_name })}
                </Typography>
              </Box>
            )}

            {queue.length > 0 ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                gap: { md: 2, lg: 3 },
                position: 'relative',
                px: { xs: 0, md: 2 }
              }}>
                {/* Left Sidebar: CARE Interpretation (Desktop Only) */}
                <Box sx={{
                  display: { xs: 'none', md: showCareNarrative ? 'block' : 'none' },
                  width: '320px',
                  position: 'sticky',
                  top: '20px',
                  zIndex: 5
                }}>
                  <CareNarrativePanel
                    profile={queue[0]}
                    isVisible={showCareNarrative}
                    standalone={true}
                  />
                </Box>

                <Box sx={{
                  width: { xs: '100%', md: '430px' }, // Fix width on desktop to mimic mobile card
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {/* Floating Side Action Buttons (Desktop Only) */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '-60px', // Adjusted since now there's more space
                    transform: 'translateY(-50%)',
                    display: { xs: 'none', md: 'flex' },
                    zIndex: 10
                  }}>
                    <IconButton
                      onClick={() => { setShowCareNarrative(!showCareNarrative); }}
                      sx={{
                        bgcolor: 'rgba(18,18,20,0.95)',
                        color: showCareNarrative ? '#AB47BC' : 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(30,30,32,1)' },
                        width: 48,
                        height: 48
                      }}
                    >
                      <PsychologyIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '-60px',
                    transform: 'translateY(-50%)',
                    display: { xs: 'none', md: 'flex' },
                    zIndex: 10
                  }}>
                    <IconButton
                      onClick={() => { setShowCompatibility(!showCompatibility); }}
                      sx={{
                        bgcolor: 'rgba(18,18,20,0.95)',
                        color: showCompatibility ? 'primary.main' : 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(30,30,32,1)' },
                        width: 48,
                        height: 48
                      }}
                    >
                      <BarChartIcon />
                    </IconButton>
                  </Box>

                  {layoutMode === 'stack' && (
                    (queue[0] as any).isRefinement ? (
                      <DiscoveryRefinementCard
                        currentCompletion={(queue[0] as any).currentCompletion}
                        suggestion={(queue[0] as any).suggestion}
                        profile={myProfile}
                        options={options}
                        onSave={handleRefinementSave}
                        onSkip={() => setQueue(prev => prev.slice(1))}
                      />
                    ) : (
                      <StackLayout
                        profiles={queue}
                        currentIndex={0}
                        onLike={() => handleSwipe('like')}
                        onPass={() => handleSwipe('pass')}
                        onSuperLike={() => handleSwipe('superlike')}
                        onUndo={history.length > 0 ? handleUndo : undefined}
                        onVIPMessage={() => handleVIPMessage(queue[0])}
                        isPremium={isPremium}
                        isBlind={queue[0]?.is_blind || discoveryMode === 'blind'}
                        isCurious={isCurious}
                        interactionMode={interactionMode}
                      />
                    )
                  )}

                  {layoutMode === 'sticker_book' && (
                    <StickerBookLayout
                      profiles={queue}
                      onProfileAction={(id, act) => {
                        const profile = queue.find(p => p.user_id === id);
                        if ((profile as any)?.isRefinement) {
                          setQueue(prev => prev.filter(p => p.user_id !== id));
                          return;
                        }
                        handleProfileAction(id, act);
                      }}
                      isPremium={isPremium}
                      isBlind={discoveryMode === 'blind'}
                      isCurious={isCurious}
                      interactionMode={interactionMode}
                    />
                  )}

                  {layoutMode === 'carousel' && (
                    <CarouselLayout
                      profiles={queue}
                      onProfileAction={(id, act) => {
                        const profile = queue.find(p => p.user_id === id);
                        if ((profile as any)?.isRefinement) {
                          setQueue(prev => prev.filter(p => p.user_id !== id));
                          return;
                        }
                        handleProfileAction(id, act);
                      }}
                      isPremium={isPremium}
                      isBlind={discoveryMode === 'blind'}
                      isCurious={isCurious}
                      interactionMode={interactionMode}
                    />
                  )}

                  {layoutMode === 'grid' && (
                    <GridLayout
                      profiles={queue}
                      onProfileAction={(id, act) => {
                        const profile = queue.find(p => p.user_id === id);
                        if ((profile as any)?.isRefinement) {
                          setQueue(prev => prev.filter(p => p.user_id !== id));
                          return;
                        }
                        handleProfileAction(id, act);
                      }}
                      isPremium={isPremium}
                      isBlind={discoveryMode === 'blind'}
                      isCurious={isCurious}
                      interactionMode={interactionMode}
                    />
                  )}
                </Box>

                {/* Right Sidebar: Technical Breakdown (Desktop Only) */}
                <Box sx={{
                  display: { xs: 'none', md: showCompatibility ? 'block' : 'none' },
                  width: '320px',
                  position: 'sticky',
                  top: '20px',
                  zIndex: 5
                }}>
                  <CompatibilityTechnicalPanel
                    profile={queue[0]}
                    isVisible={showCompatibility}
                    onViewProfile={(p) => setSelectedProfileDetail(p)}
                    standalone={true}
                  />
                </Box>
              </Box>
            ) : (
              <DiscoverEmptyState
                profile={myProfile}
                onRefresh={fetchQueue}
                onExpandSearch={handleExpandSearch}
                t={t}
              />
            )}

            {/* Completeness alert for mobile - MOVED BELOW CARDS */}
            {myProfile && calculateCompletionPercentage(calculateProfileScore(myProfile)) < 60 && (
              <Alert
                severity="warning"
                sx={{
                  mt: 3,
                  mb: 2,
                  width: 'fit-content',
                  maxWidth: '90%',
                  mx: 'auto',
                  borderRadius: '20px',
                  bgcolor: isLight ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.05)',
                  color: isLight ? '#e65100' : '#ffa726',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)',
                  px: 3,
                  display: { xs: 'flex', md: 'none' }, // Only show on mobile here
                  alignItems: 'center',
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  },
                  '& .MuiAlert-icon': {
                    mr: 1,
                    opacity: 0.9
                  }
                }}
              >
                {t('lowCompletenessAlert', 'Entre más detalles agregues a tu perfil, mejores coincidencias recibirás')}
              </Alert>
            )}

            {/* Mobile Action Toggles (Below Cards) */}
            {queue.length > 0 && !((queue[0] as any).isRefinement) && (
              <Box sx={{
                display: { xs: 'flex', md: 'none' },
                width: '100%',
                justifyContent: 'center',
                gap: 1.5,
                mt: 2.5,
                mb: 0.5,
                px: 2,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
              }}>
                {/* 1. CARE interpreta (Primary Action) */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { setShowCareNarrative(!showCareNarrative); setShowCompatibility(false); }}
                  startIcon={<InterestsIcon sx={{ fontSize: '1rem' }} />}
                  endIcon={showCareNarrative ? <ExpandLessIcon sx={{ fontSize: '0.9rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    borderColor: showCareNarrative ? 'secondary.main' : 'rgba(255,255,255,0.2)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.85rem',
                    py: 0.8,
                    px: 2,
                    '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(255,255,255,0.1)' },
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  {showCareNarrative ? 'Cerrar' : 'CARE interpreta'}
                </Button>

                {/* 2. Compatibilidad (Secondary Action) */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { setShowCompatibility(!showCompatibility); setShowCareNarrative(false); }}
                  startIcon={<TuneIcon sx={{ fontSize: '1rem' }} />}
                  endIcon={showCompatibility ? <ExpandLessIcon sx={{ fontSize: '0.9rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    borderColor: showCompatibility ? 'primary.main' : 'rgba(255,255,255,0.2)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.85rem',
                    py: 0.8,
                    px: 2,
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(255,255,255,0.1)' },
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  {showCompatibility ? 'Ocultar info' : 'Compatibilidad'}
                </Button>
              </Box>
            )}

            {/* Mobile-only Curiosity Switch (Immediately Below Layouts) */}
            {queue.length > 0 && (
              <Box sx={{
                display: { xs: 'flex', sm: 'none' },
                justifyContent: 'center',
                width: '100%',
                mt: 1.5,
                mb: 1.5,
                px: 2
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: '300px',
                    bgcolor: isCurious ? 'rgba(171, 71, 188, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    px: 2.5,
                    py: 0.8,
                    borderRadius: '24px',
                    border: '1.5px solid',
                    borderColor: isCurious ? 'rgba(171, 71, 188, 0.5)' : 'rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isCurious ? '0 4px 20px rgba(171, 71, 188, 0.3)' : 'none',
                  }}
                >
                  <Switch
                    checked={isCurious}
                    onChange={(e) => handleCuriosityChange(e.target.checked)}
                    color="secondary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#AB47BC',
                        '&:hover': {
                          backgroundColor: 'rgba(171, 71, 188, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#AB47BC',
                      },
                    }}
                  />
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: isCurious ? '#E1BEE7' : 'rgba(255, 255, 255, 0.75)',
                    letterSpacing: '0.3px'
                  }}>
                    Hoy me siento curioso
                  </Typography>
                </Box>
              </Box>
            )}
            <Divider sx={{ my: 5 }} />

            {/* Desktop Curiosity Switch (Aligned Right above Interests) */}
            {queue.length > 0 && (
              <Box sx={{
                display: { xs: 'none', sm: 'flex' },
                justifyContent: 'flex-end',
                width: '100%',
                mt: 2,
                mb: 1,
                px: 0
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 'auto',
                    gap: 2,
                    bgcolor: isCurious ? 'rgba(171, 71, 188, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    px: 3,
                    py: 1,
                    borderRadius: '24px',
                    border: '1.5px solid',
                    borderColor: isCurious ? 'rgba(171, 71, 188, 0.5)' : 'rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isCurious ? '0 4px 20px rgba(171, 71, 188, 0.3)' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCuriosityChange(!isCurious)}
                >
                  <Switch
                    checked={isCurious}
                    onChange={(e) => handleCuriosityChange(e.target.checked)}
                    color="secondary"
                    sx={{
                      mr: 0,
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#AB47BC',
                        '&:hover': {
                          backgroundColor: 'rgba(171, 71, 188, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#AB47BC',
                      },
                    }}
                  />
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: isCurious ? '#E1BEE7' : 'rgba(255, 255, 255, 0.75)',
                    letterSpacing: '0.3px',
                    userSelect: 'none'
                  }}>
                    Hoy me siento curioso
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Profile Detail Modal */}
            <ProfileDetailModal
              open={!!selectedProfileDetail}
              onClose={() => setSelectedProfileDetail(null)}
              profile={selectedProfileDetail}
              isPremium={isPremium}
              isBlind={selectedProfileDetail?.is_blind || discoveryMode === 'blind'}
              isCurious={isCurious}
              interactionMode={interactionMode}
              onLike={() => {
                handleSwipe('like');
                setSelectedProfileDetail(null);
              }}
              onPass={() => {
                handleSwipe('pass');
                setSelectedProfileDetail(null);
              }}
              onSuperLike={() => {
                handleSwipe('superlike');
                setSelectedProfileDetail(null);
              }}
            />


            {/* TimeOut Modal */}
            <TimeOutModal
              open={showTimeOutModal}
              onClose={() => setShowTimeOutModal(false)}
              onSetTimeOut={handleSetTimeOut}
              onRecharge={(amount) => {
                setBatteryLevel(amount);
                enqueueSnackbar("¡Batería recargada! 🔋⚡", { variant: 'success' });
              }}
              currentBattery={batteryLevel}
              userPersonality={myProfile?.social_style}
            />

            {/* Interaction Settings Dialog */}
            <InteractionSettingsDialog
              open={showInteractionSettings}
              containerRef={containerRef}
              onClose={() => setShowInteractionSettings(false)}
              currentMode={interactionMode}
              onModeChange={(mode) => {
                setInteractionMode(mode);
                localStorage.setItem('interactionMode', mode);
                enqueueSnackbar(`Modo de interacción: ${mode === 'buttons' ? 'Solo Botones' : mode === 'taps' ? 'Botones + Taps' : mode === 'swipes' ? 'Botones + Swipes' : 'Botones + Teclado'}`, { variant: 'success', autoHideDuration: 2000 });
              }}
              currentLayout={layoutMode}
              onLayoutChange={(layout) => {
                setLayoutMode(layout);
                localStorage.setItem('layoutMode', layout);
                enqueueSnackbar(`Layout: ${layout === 'stack' ? 'Cartas' : layout === 'sticker_book' ? 'Álbum' : layout === 'carousel' ? 'Carrusel' : 'Galería'}`, { variant: 'success', autoHideDuration: 2000 });
              }}
            />

            {/* Modal Behavior (Mobile/Tablet Only) */}
            <Dialog
              open={showCareNarrative}
              onClose={() => setShowCareNarrative(false)}
              maxWidth="md"
              fullWidth
              sx={{ display: { xs: 'block', md: 'none' } }} // Only modal on mobile/tablet
              PaperProps={{
                sx: {
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  backgroundImage: 'none'
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CareNarrativePanel
                  profile={queue[0]}
                  isVisible={showCareNarrative}
                  mobileOpen={true}
                />
              </Box>
            </Dialog>

            <Dialog
              open={showCompatibility}
              onClose={() => setShowCompatibility(false)}
              maxWidth="md"
              fullWidth
              sx={{ display: { xs: 'block', lg: 'none' } }} // Only modal on mobile/tablet
              PaperProps={{
                sx: {
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  backgroundImage: 'none'
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CompatibilityTechnicalPanel
                  profile={queue[0]}
                  isVisible={showCompatibility}
                  onViewProfile={(p) => setSelectedProfileDetail(p)}
                  mobileOpen={true}
                />
              </Box>
            </Dialog>

            {/* Filters Dialog - Locked to container context */}
            <Dialog
              open={showFilters}
              onClose={() => setShowFilters(false)}
              fullWidth
              maxWidth={false}
              disablePortal // Render inside containerRef
              PaperProps={{
                sx: {
                  width: '100%',
                  maxWidth: 800,
                  borderRadius: 4,
                  backgroundImage: 'none',
                  bgcolor: 'background.paper',
                  m: 0,
                  ml: { xs: 0, md: '250px' }, // Shift right as requested only on desktop
                }
              }}
              sx={{
                position: 'absolute', // Absolute to the relative Box
                zIndex: 1300,
                '& .MuiDialog-container': {
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  p: 0
                },
                '& .MuiBackdrop-root': {
                  position: 'absolute',
                  borderRadius: 4
                }
              }}
            >
              <DialogTitle sx={{ fontWeight: 700, px: 2, pt: 2, pb: 1, color: 'text.primary', fontSize: '1.25rem' }}>
                {t('filters.title')}
              </DialogTitle>
              <DialogContent sx={{ px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                  {/* Group 1: Age & Distance */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: '#121212',
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5
                    }}
                  >
                    {/* Age Filter */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t('filters.ageRange')}: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{ageRange[0]} - {ageRange[1]}</Box>
                        </Typography>

                        {/* Half Plus Seven Rule Switch */}
                        <Tooltip
                          title={
                            !myProfile?.birth_date
                              ? "Agrega tu fecha de nacimiento en tu perfil para usar esta regla."
                              : "Regla ½ + 7: Sugiere un rango de edad socialmente aceptado basado en tu edad."
                          }
                          arrow
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={useAgeRule}
                                disabled={!myProfile?.birth_date}
                                onChange={(e) => {
                                  setUseAgeRule(e.target.checked);
                                  if (e.target.checked) {
                                    let age = myProfile?.age;

                                    if (!age && myProfile?.birth_date) {
                                      // Fallback: Calculate Age from birth_date
                                      const birthDate = new Date(myProfile.birth_date);
                                      const ageDifMs = Date.now() - birthDate.getTime();
                                      const ageDate = new Date(ageDifMs);
                                      age = Math.abs(ageDate.getUTCFullYear() - 1970);
                                    }

                                    if (age) {
                                      const min = Math.floor(age / 2) + 7;
                                      const max = (age - 7) * 2;
                                      setAgeRange([Math.max(18, min), Math.min(99, max)]);
                                      enqueueSnackbar(`Regla ½+7 aplicada (${age} años): ${Math.max(18, min)} - ${Math.min(99, max)} años`, { variant: 'success', autoHideDuration: 3000 });
                                    }
                                  }
                                }}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: useAgeRule ? 'primary.main' : 'text.secondary' }}>
                                  Regla ½ + 7
                                </Typography>
                                <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </Box>
                            }
                            sx={{ mr: 0 }}
                          />
                        </Tooltip>
                      </Box>

                      <Slider
                        value={ageRange}
                        onChange={(_, newValue) => {
                          if (!useAgeRule) setAgeRange(newValue as number[]);
                        }}
                        valueLabelDisplay="auto"
                        min={18}
                        max={99}
                        disabled={useAgeRule}
                        size="small"
                        sx={{ color: 'primary.main', py: 1 }}
                      />
                    </Box>

                    {/* Distance Slider */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}>
                          {t('filters.distance.label')}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                          {`${distance} ${t('filters.distance.unit', 'km')}`}
                        </Typography>
                      </Box>
                      <Slider
                        value={distance}
                        min={5}
                        max={100}
                        step={5}
                        onChange={(_, val) => setDistance(val as number)}
                        size="small"
                        sx={{ color: 'primary.main', py: 1 }}
                      />
                    </Box>

                    {/* Map Integration */}
                    <Box sx={{ height: 160, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                      {myProfile?.location?.coordinates ? (
                        <LocationMap
                          lat={myProfile.location.coordinates[1]}
                          lng={myProfile.location.coordinates[0]}
                          radiusKm={distance}
                          regions={regions}
                          hasLocation={true}
                          zoom={distance > 80 ? 7 : distance > 40 ? 8 : 9}
                        />
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('filters.distance.noLocation', 'Configura tu ubicación en el perfil para ver el mapa')}
                          </Typography>
                        </Box>
                      )}
                      {myProfile?.city && (
                        <Box sx={{ position: 'absolute', bottom: 8, left: 8, zIndex: 1000, bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 1.5, boxShadow: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
                            {t('filters.distance.currentLocation', 'Buscando cerca de: ')}{myProfile.city}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {t('filters.distance.syncMessage', 'Este ajuste también se guardará en tu perfil.')}
                    </Typography>
                  </Paper>

                  {/* Group 2: Premium Filters */}
                  {isPremium ? (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#121212', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Derived base country for state search context */}
                      {(() => {
                        const baseCountry = myProfile?.location?.country || myProfile?.country;
                        return (
                          <AsyncLocationSelector
                            label={searchStates.includes(baseCountry ? `Todos:${baseCountry}` : 'Todos') || searchStates.some(s => s.startsWith('Todos'))
                              ? "Todos los estados"
                              : "Explorar por Estados (Premium)"}
                            placeholder={baseCountry ? `Estados de ${baseCountry}...` : "Escribe un estado..."}
                            value={searchStates}
                            onChange={(v: string[]) => {
                              if (v.some(s => s.startsWith('Todos') || s === 'Todos') && !searchStates.some(s => s.startsWith('Todos'))) {
                                // User selected "Todos"
                                const todosValue = baseCountry ? `Todos:${baseCountry}` : 'Todos';
                                setSearchStates([todosValue]);
                              } else if (v.some(s => s.startsWith('Todos')) && v.length > 1) {
                                // Force single selection if Todos is present
                                const todosValue = baseCountry ? `Todos:${baseCountry}` : 'Todos';
                                setSearchStates([todosValue]);
                              } else {
                                // Normal selection
                                setSearchStates(v);
                              }
                            }}
                            placeType="state"
                            forceCountry={baseCountry}
                          />
                        );
                      })()}
                      <AsyncLocationSelector
                        label={t('filters.premium.countries', 'Explorar por Países (Premium)')}
                        value={searchCountries}
                        onChange={async (v: string[]) => {
                          const newSelection = v.filter(x => !searchCountries.includes(x))[0];
                          const isContinent = newSelection && (
                            newSelection.startsWith('Continente: ') ||
                            (newSelection.startsWith('🌎 ') && newSelection.includes('(Todo el continente)'))
                          );

                          if (isContinent) {
                            if (locationScope?.mode === 'continent') {
                              enqueueSnackbar('⚠️ Solo puedes seleccionar un continente completo a la vez.', { variant: 'warning' });
                              return;
                            }

                            let continentName = '';
                            if (newSelection.startsWith('Continente: ')) {
                              continentName = newSelection.replace('Continente: ', '');
                            } else {
                              continentName = newSelection.split(' ')[1];
                            }

                            try {
                              const resp = await apiClient.get(`/profiles/continents/${continentName}/countries`);
                              const continentCountries = resp.data || [];
                              if (continentCountries.length > 0) {
                                setLocationScope({
                                  mode: 'continent',
                                  selected_continent: continentName,
                                  selected_countries: continentCountries,
                                  excluded_countries: [],
                                  limit: 20
                                });
                                setSearchCountries(continentCountries);
                                enqueueSnackbar(`✅ Se agregaron países de ${continentName}`, { variant: 'success' });
                              }
                            } catch (err) {
                              console.error("Error fetching continent countries", err);
                            }
                          } else {
                            if (v.length > 20 && !v.includes('Todos')) {
                              enqueueSnackbar('⚠️ Máximo 20 países permitidos.', { variant: 'warning' });
                              return;
                            }
                            setLocationScope({
                              mode: 'countries',
                              selected_continent: null,
                              selected_countries: v,
                              excluded_countries: [],
                              limit: 20
                            });
                            setSearchCountries(v);
                          }
                        }}
                        placeType="country"
                        maxItems={20}
                      />
                    </Paper>
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: '#121212',
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'primary.main',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(255, 77, 79, 0.05)' }
                      }}
                      onClick={() => router.push('/suscripcion')}
                    >
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom sx={{ fontSize: '0.85rem' }}>
                        {t('filters.premium.upsellTitle', 'Explora más allá de tu zona')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
                        {t('filters.premium.upsellDesc', 'Suscríbete a ReTh Premium o VIP para buscar personas en cualquier estado o país.')}
                      </Typography>
                      <Button size="small" variant="contained" fullWidth sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                        {t('filters.premium.upsellAction', 'Ver Planes Premium')}
                      </Button>
                    </Paper>
                  )}

                  {/* Group 3: Compatibility Only (Mode moved to main view) */}
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#121212', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>

                      {/* DYNAMIC FILTER: High Compatibility (>70%) */}
                      {/* Visible in: Suggested (Optional) */}
                      {/* Hidden in: Opposites (N/A), Blind (Mandatory), Free (N/A) */}
                      {discoveryMode === 'suggested' && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={minCompatibility === 70}
                              onChange={(e) => setMinCompatibility(e.target.checked ? 70 : 0)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {t('filters.highCompatibility', 'Solo alta compatibilidad (>70%)')}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                {t('filters.highCompatibilityDesc', 'Filtra perfiles con menor afinidad.')}
                              </Typography>
                            </Box>
                          }
                          sx={{ ml: -0.5, alignItems: 'flex-start' }}
                        />
                      )}

                      {/* Contextual Messages for hidden filters */}
                      {discoveryMode === 'blind' && (
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(225, 190, 231, 0.1)', borderRadius: 2, mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#E1BEE7', fontStyle: 'italic' }}>
                            En <strong>Blind Mode</strong> solo verás perfiles con alta compatibilidad (&gt;70%). Esta regla se aplica automáticamente.
                          </Typography>
                        </Box>
                      )}

                      {discoveryMode === 'opposites' && (
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, mb: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            En <strong>Opuestos</strong> verás perfiles con diferencias marcadas. La compatibilidad alta no se aplica aquí.
                          </Typography>
                        </Box>
                      )}

                      {discoveryMode === 'free' && (
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, mb: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            En <strong>Exploración libre</strong> todos los filtros de afinidad están deshabilitados para que explores sin límites.
                          </Typography>
                        </Box>
                      )}

                      {/* DYNAMIC FILTER: Online Only */}
                      {/* Visible in: Suggested, Opposites, Blind */}
                      {/* Hidden in: Free */}
                      {discoveryMode !== 'free' && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={onlineOnly}
                              onChange={(e) => setOnlineOnly(e.target.checked)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {t('filters.online.label', 'Solo usuarios conectados')}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                {t('filters.online.desc', 'Muestra solo personas activas ahora mismo.')}
                              </Typography>
                            </Box>
                          }
                          sx={{ ml: -0.5, alignItems: 'flex-start' }}
                        />
                      )}


                    </Box>
                  </Paper>

                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 2, pb: 2.5, pt: 0.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  onClick={() => setShowFilters(false)}
                  sx={{
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    minWidth: 100
                  }}
                >
                  {t('filters.cancel')}
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    minWidth: 140,
                    boxShadow: '0 4px 12px rgba(255, 77, 79, 0.2)'
                  }}
                >
                  {t('filters.apply')}
                </Button>
              </DialogActions>
            </Dialog>

            <CuriosityGenderSelector
              open={showCuriositySelector}
              containerRef={containerRef}
              onClose={() => setShowCuriositySelector(false)}
              initialSelected={curiosityGenders}
              onSave={async (genders) => {
                setCuriosityGenders(genders);
                setIsCurious(true);
                setShowCuriositySelector(false);
                try {
                  await apiClient.put('/profiles/me', {
                    feeling_curious: true,
                    curiosity_genders: genders
                  });
                  enqueueSnackbar("Modo Curioso activado 🌌: Explorando más allá de tus filtros habituales.", { variant: 'info' });
                } catch (err) {
                  console.error("Failed to save curiosity settings", err);
                }
              }}
            />
          </>
        )
      }
    </Layout >
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'discover'])),
    },
  };
}

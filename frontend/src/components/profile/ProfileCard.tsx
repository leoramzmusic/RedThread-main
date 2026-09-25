import { useState, useEffect } from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { getPlanConfig } from '../../config/planConfig';
import { MediaItem } from '../../types/media';
import apiClient from '../../services/api';

import ProfileOverlay from './ProfileOverlay';
import ProfileActions from './ProfileActions';
import ProfileDetailsModal from './ProfileDetailsModal';
import { InteractionMode } from '../discovery/InteractionSettingsDialog';
import { useAppTheme } from '../../context/ThemeContext';

export interface Profile {
  user_id: string;
  display_name: string;
  nickname?: string;
  age: number;
  bio: string;
  photos: string[];
  interests: string[];
  lifestyle_interests?: string[];
  affinity_score: number;
  subscription_tier?: string;
  is_public_figure?: boolean;
  verified?: boolean;
  online_status?: boolean;
  last_seen?: string;
  distance_km?: number;
  location_name?: string;
  plan?: string;
  compatibility_score?: number;
  show_age?: boolean;
  show_location?: boolean;
  show_gender?: boolean;

  // Extended fields for narrative
  occupation?: string;
  work_company?: string;
  school?: string;
  education_level?: string;
  education_center?: string;
  languages?: string[];

  mi_himno?: {
    featured_songs?: { title: string; artist: string; cover_url?: string }[];
    favorite_artists?: string[];
  };

  prompts?: { question: string; answer: string }[];

  relationship_goals?: string;
  neurodiversity?: string[];

  affinity_breakdown?: {
    interests?: number;
    values?: number;
    intent?: number;
    lifestyle?: number;
    proximity?: number;
    common_interests?: string[];
    common_lifestyle?: string[];
    common_intentions?: string[];
    unique_interests?: string[];
    unique_lifestyle?: string[];
    music?: number;
    personality?: number;
  };

  // CARE Engine signals
  activity_score?: number;      // 0-1, how active the user is
  responsiveness_score?: number; // 0-1, how quickly they respond
  match_highlights?: string[];   // Specific positive highlights
  is_discovery?: boolean;        // Whether this is an exploration item

  // Phase 2: Extended details
  unique_interests?: string[];
  interests_match?: number;
  music_match?: number;
  personality_match?: number;
  is_blind?: boolean; // Blind mode flag
  height_relevant?: boolean;
  height_preferences?: string[];
  height_cm?: number;

  // CARE Contextual Location & Narrative
  scenario_label?: string;
  connection_tone?: string;
  context_advice?: string;
  narrative_tone?: string;
  highlighted_fragments?: string[];
  professional_advice?: string;
  professional_tone?: string;
  professional_match?: number;
  show_professional_only_matches?: boolean;

  // Identity (New)
  gender?: string;
  gender_category?: string;
  sexual_orientation?: string;
  attraction_preferences?: string[];
  identity_context?: {
    tone: string;
    description: string;
  };
  is_curious?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onUndo?: () => void;
  onVIPMessage?: () => void;
  showActions?: boolean;
  isOwnProfile?: boolean;
  isPremium?: boolean;
  matchReason?: string; // CARE Engine explanation
  matchHighlights?: string[]; // CARE Engine highlights
  isDiscovery?: boolean; // Whether this is an exploration item
  isBlind?: boolean;
  isCurious?: boolean;
  interactionMode?: InteractionMode;
}

export default function ProfileCard({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onUndo,
  onVIPMessage,
  showActions = true,
  isOwnProfile = false,
  isPremium = false,
  matchReason,
  matchHighlights,
  isDiscovery,
  isBlind = false,
  isCurious = false,
  interactionMode = 'buttons', // Default mode
}: ProfileCardProps) {
  const { mode } = useAppTheme();
  const isLight = mode === 'light';
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Blind Mode Logic: Override photos
  const effectiveIsBlind = isBlind || profile.is_blind;
  const blindPlaceholder = 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=600&blur=80'; // Blurred abstract

  const photos = effectiveIsBlind
    ? [blindPlaceholder] // Only background image
    : (mediaItems.length > 0 ? mediaItems.map(m => m.url) : (profile.photos || []));

  // In Blind Mode, we have 3 fixed slides: 0:Identity, 1:Compatibility, 2:Personality
  const maxSlides = effectiveIsBlind ? 3 : photos.length;

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await apiClient.get(`/media/${profile.user_id}`);
        if (response.data && response.data.length > 0) {
          setMediaItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };
    if (profile.user_id && !effectiveIsBlind) fetchMedia();
  }, [profile.user_id, effectiveIsBlind]);

  // Taps Logic (State for counting taps)
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Handle Photo Navigation or Tap Actions
  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    // Only handle if not dragging
    if (isDragging) return;

    // Handle Tap Actions for 'taps' mode
    if (interactionMode === 'taps') {
      e.stopPropagation();
      const now = Date.now();
      const timeDiff = now - lastTapTime;

      if (timeDiff < 400) { // Double/Triple tap threshold
        setTapCount(prev => prev + 1);
      } else {
        setTapCount(1);
      }
      setLastTapTime(now);
      return;
    }

    // Default Photo Navigation for other modes
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;

    if (x < rect.width / 2) {
      // Previous slide
      setActivePhotoIndex(prev => Math.max(0, prev - 1));
    } else {
      // Next slide
      setActivePhotoIndex(prev => Math.min(maxSlides - 1, prev + 1));
    }
  };

  // Execute Tap Action after short delay to wait for more taps
  useEffect(() => {
    if (interactionMode !== 'taps' || tapCount === 0) return;

    const timer = setTimeout(() => {
      if (tapCount === 2 && onLike) {
        onLike();
      } else if (tapCount === 3 && onPass) {
        onPass();
      } else if (tapCount >= 4 && onSuperLike) {
        onSuperLike();
      }
      setTapCount(0);
    }, 450); // Wait slightly longer than tap threshold

    return () => clearTimeout(timer);
  }, [tapCount, interactionMode, onLike, onPass, onSuperLike]);

  // Keyboard Logic
  useEffect(() => {
    if (interactionMode !== 'keyboard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid interfering with inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'ArrowRight': onLike?.(); break;
        case 'ArrowLeft': onPass?.(); break;
        case 'ArrowUp': onSuperLike?.(); break;
        case 'ArrowDown': setShowInfo(true); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactionMode, onLike, onPass, onSuperLike]);

  // Drag Logic
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (interactionMode !== 'swipes') return; // Disable drag unless in swipes mode

    setIsPressed(true);
    setIsDragging(false);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartPos({ x: clientX, y: clientY });
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPressed) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsDragging(true);
      setDragPosition({ x: deltaX, y: deltaY });
    }
  };

  const handleDragEnd = () => {
    setIsPressed(false);
    if (isDragging) {
      const threshold = 100;
      if (dragPosition.y < -threshold && onSuperLike) {
        onSuperLike();
      } else if (dragPosition.y > threshold) {
        // Vertical Swipe Down - Show Info
        if (interactionMode === 'swipes') {
          setShowInfo(true);
        }
      } else if (dragPosition.x > threshold && onLike) {
        // Right swipe - Like with haptic feedback
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        onLike();
      } else if (dragPosition.x < -threshold && onPass) {
        onPass();
      }
      setDragPosition({ x: 0, y: 0 });
      setTimeout(() => setIsDragging(false), 100);
    }
  };

  // Styles
  const rotation = dragPosition.x * 0.1;
  const config = getPlanConfig(profile.subscription_tier);
  const isPremiumOrVip = profile.subscription_tier === 'premium' || profile.subscription_tier === 'vip';


  return (
    <Box
      sx={{
        perspective: 100,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        height: { xs: 'calc(100vh - 245px)', sm: '700px' },
        maxHeight: { xs: '740px', sm: '700px' },
        '@media (max-width:375px)': {
          height: 'calc(100vh - 170px) !important',
          maxHeight: '500px !important',
          mt: '0.2rem !important',
        },
      }}
    >
      <Card
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onClick={handleTap}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: '8px', sm: '12px' },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isCurious
            ? '0 4px 16px rgba(171, 71, 188, 0.22)'
            : `0 4px 16px ${isPremiumOrVip ? config.color.primary + '22' : 'rgba(0,0,0,0.12)'}`,
          border: isCurious
            ? '3px solid #AB47BC'
            : (isPremiumOrVip ? `2px solid ${config.color.primary}` : 'none'),
          cursor: isDragging ? 'grabbing' : 'pointer',
          transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: isDragging
              ? undefined
              : isCurious
                ? '0 8px 24px rgba(171, 71, 188, 0.26)'
                : `0 8px 24px ${isPremiumOrVip ? config.color.primary + '28' : 'rgba(0,0,0,0.16)'}`,
          },
          userSelect: 'none',
          bgcolor: 'black'
        }}
      >
        {/* Photo Layer */}
        <CardMedia
          component="img"
          image={photos[activePhotoIndex] || 'https://via.placeholder.com/400x600?text=No+Photo'}
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            filter: 'brightness(1)', // More vivid
            flexShrink: 0
          }}
        />

        {/* Narrative Overlay Gradient */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: { xs: '100%', sm: '60%' },
            background: {
              xs: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)',
              sm: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)'
            },
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Content Container - Adjusted Padding for Separation */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 2.5, sm: 3 },
            pb: { xs: 16, sm: 10 },
            zIndex: 2,
            color: 'white',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Fade in={true} key={activePhotoIndex} timeout={400}>
            <Box>
              <ProfileOverlay
                profile={profile}
                activePhotoIndex={activePhotoIndex}
                isBlind={effectiveIsBlind}
                matchReason={matchReason}
                matchHighlights={matchHighlights}
                isDiscovery={isDiscovery}
                isCurious={isCurious || profile.is_curious}
              />
            </Box>
          </Fade>
        </Box>

        {/* Story Progress Bar - Refined Ultra Thin */}
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 10 }, left: 4, right: 4, display: 'flex', gap: 0.5, zIndex: 10 }}>
          {Array.from({ length: maxSlides }).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                height: 4,
                bgcolor: idx === activePhotoIndex ? 'white' : 'rgba(255,255,255,0.4)',
                borderRadius: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)'
              }}
            />
          ))}
        </Box>

        {/* Online Status Indicator - Minimal Green Dot */}
        {(isOwnProfile || profile.online_status) && (
          <Tooltip title={isOwnProfile ? "Estás conectado y visible en Discover" : "Este usuario está conectado en Reth"}>
            <Box sx={{
              position: 'absolute',
              top: 35,
              left: 16,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#4CAF50',
              boxShadow: '0 0 12px rgba(76, 175, 80, 0.8), 0 2px 4px rgba(0,0,0,0.3)',
              border: '2px solid white',
              zIndex: 4,
              cursor: 'help'
            }} />
          </Tooltip>
        )}

        {/* Compatibility Indicator - Circular Percentage */}
        <Tooltip title={isOwnProfile
          ? "Esta vista compara tu perfil contigo mismo. Todas las coincidencias son perfectas."
          : "Compatibilidad basada en afinidad emocional y coincidencias de perfil"}>
          <Box
            onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
            sx={{
              position: 'absolute',
              top: 20,
              right: 8,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: (() => {
                const score = isOwnProfile ? 100 : (profile.affinity_score || 0);
                if (score > 70) return '#4CAF50';
                if (score > 30) return '#FFEB3B';
                return '#F44336';
              })(),
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: (() => {
                  const score = isOwnProfile ? 100 : (profile.affinity_score || 0);
                  if (score > 70) return '#4CAF50';
                  if (score > 30) return '#FF9800';
                  return '#F44336';
                })(),
                fontSize: '0.7rem',
                lineHeight: 1
              }}
            >
              {isOwnProfile ? '100' : Math.round(profile.affinity_score || 0)}%
            </Typography>
          </Box>
        </Tooltip>

        {/* Info/Upward Arrow Button - Mobile Story Style */}
        {showActions && (
          <Tooltip title="Ver detalles del perfil">
            <IconButton
              onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
              sx={{
                position: 'absolute',
                bottom: { xs: 140, sm: 110 },
                right: 16,
                zIndex: 4,
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                width: 44,
                height: 44,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', transform: 'scale(1.1)' },
                transition: 'all 0.2s'
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: '1.6rem', transform: 'rotate(-90deg)' }} />
            </IconButton>
          </Tooltip>
        )}


        {/* Action Buttons - Refined Solid Container */}
        {showActions && (
          <ProfileActions
            onLike={onLike}
            onPass={onPass}
            onSuperLike={onSuperLike}
            onUndo={onUndo}
            onVIPMessage={onVIPMessage}
            isPremium={isPremium}
          />
        )}

        {/* LIKE / NOPE OVERLAYS (Swipe Feedback) */}
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            left: 40,
            opacity: Math.max(0, Math.min(1, dragPosition.x / 100)),
            transform: 'rotate(-30deg)',
            border: '4px solid #69F0AE',
            borderRadius: 2,
            p: 1,
            zIndex: 10,
          }}
        >
          <Typography variant="h4" fontWeight={900} sx={{ color: '#69F0AE' }}>LIKE</Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            right: 40,
            opacity: Math.max(0, Math.min(1, -dragPosition.x / 100)),
            transform: 'rotate(30deg)',
            border: '4px solid #FF5252',
            borderRadius: 2,
            p: 1,
            zIndex: 10,
          }}
        >
          <Typography variant="h4" fontWeight={900} sx={{ color: '#FF5252' }}>NOPE</Typography>
        </Box>

        {/* SUPERLIKE OVERLAY */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: `translateX(-50%) scale(${Math.max(0.5, Math.min(1.2, -dragPosition.y / 100))})`,
            opacity: Math.max(0, Math.min(1, -dragPosition.y / 150)),
            border: '4px solid #2196F3',
            borderRadius: 2,
            p: 1.5,
            bgcolor: 'rgba(33, 150, 243, 0.1)',
            zIndex: 10,
            textAlign: 'center'
          }}
        >
          <StarIcon sx={{ fontSize: '2.5rem', color: '#2196F3', display: 'block', margin: '0 auto' }} />
          <Typography variant="h5" fontWeight={900} sx={{ color: '#2196F3' }}>SUPERLIKE</Typography>
        </Box>

        {/* PROFILE DETAILS MODAL */}
        <ProfileDetailsModal
          open={showInfo}
          onClose={() => setShowInfo(false)}
          profile={profile}
          matchReason={matchReason}
          photos={photos}
          isOwnProfile={isOwnProfile}
        />

      </Card>
    </Box>
  );
}

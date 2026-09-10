import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  GroupAdd as GroupAddIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import apiClient from '../../services/api';
import { getPromptsForLanguage } from '../../constants/funPrompts';

// Section Components
import PhotosSection from './edit/sections/PhotosSection';
import BasicInfoSection from './edit/sections/BasicInfoSection';
import AboutMeSection from './edit/sections/AboutMeSection';
import RelationshipGoalsSection from './edit/sections/RelationshipGoalsSection';
import InterestsSection from './edit/sections/InterestsSection';
import PronounsSection from './edit/sections/PronounsSection';
import AdditionalDataSection from './edit/sections/AdditionalDataSection';

import LocationSection from './edit/sections/LocationSection';
import ProfessionalAcademicSection from './edit/sections/ProfessionalAcademicSection';
import MusicSection from './edit/sections/MusicSection';
import IdentitySection from './edit/sections/IdentitySection';
import ProfileControlSection from './edit/sections/ProfileControlSection';
import SocialSection from './edit/sections/SocialSection';
import PersonalitySection from './edit/sections/PersonalitySection';
import CognitiveSection from './edit/sections/CognitiveSection';
import WellnessSection from './edit/sections/WellnessSection';



import CivilStatusSection from './edit/sections/CivilStatusSection';


import LanguagesSection from './edit/sections/LanguagesSection';
import InfoDrawers from './edit/InfoDrawers';

// Types
import { PromptItem } from './edit/types';

// Scoring
import { calculateProfileScore, getProfileSuggestions } from '../../utils/profileScoring';
import ProfileCompletionWidget from './ProfileCompletionWidget';



interface ProfileEditProps {
  profile: any;
  options: any;
  onSave: (data: any) => Promise<void>;
  onBack: () => void;
}

export default function ProfileEdit({ profile, options, onSave, onBack }: ProfileEditProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Drawer states
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [goalsInfoOpen, setGoalsInfoOpen] = useState(false);
  const [pronounsInfoOpen, setPronounsInfoOpen] = useState(false);

  // Drawer drag logic
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);


  // Form state
  const { control, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm({
    defaultValues: profile || {}
  });

  // Update form when profile data changes (e.g. initial load)
  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  // Section-specific states
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const [photos, setPhotos] = useState<string[]>(profile?.photos || []);

  const [lifestyleInterests, setLifestyleInterests] = useState<string[]>(profile?.lifestyle_interests || []);
  const [smartPhotos, setSmartPhotos] = useState(!!profile?.smart_photos_enabled);
  const [prompts, setPrompts] = useState<PromptItem[]>(profile?.prompts || []);
  const [promptSelectorOpen, setPromptSelectorOpen] = useState(false);
  const [citySearch, setCitySearch] = useState(profile?.city || '');

  // Verification states
  const [verified, setVerified] = useState(profile?.verified || false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [countryCode, setCountryCode] = useState(profile?.country_code || '+52');
  const [phoneVerified, setPhoneVerified] = useState(!!profile?.phone_verified);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Sync citySearch when profile changes (e.g. after save)
  useEffect(() => {
    if (profile?.city !== undefined) {
      setCitySearch(profile.city || '');
    }
  }, [profile?.city]);

  // Sync phone and countryCode when profile changes
  useEffect(() => {
    if (profile) {
      if (profile.phone !== undefined) setPhone(profile.phone || '');
      if (profile.country_code !== undefined) setCountryCode(profile.country_code || '+52');
      if (profile.phone_verified !== undefined) setPhoneVerified(!!profile.phone_verified);
      if (profile.smart_photos_enabled !== undefined) setSmartPhotos(!!profile.smart_photos_enabled);
    }
  }, [profile]);

  // Dialog states
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [changePhoneDialogOpen, setChangePhoneDialogOpen] = useState(false);
  const [verificationCodeDialogOpen, setVerificationCodeDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSticky, setShowSticky] = useState(false);
  const [offsetRight, setOffsetRight] = useState(24);
  const [unsavedPreviewDialogOpen, setUnsavedPreviewDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);



  const handlePreview = () => {
    if (isDirty) {
      setUnsavedPreviewDialogOpen(true);
    } else {
      router.push('/profile/preview');
    }
  };

  // Scroll detection and positioning
  useEffect(() => {
    const handleScrollAndResize = () => {
      // Position check
      const container = document.querySelector('.main-container') || formRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();

        // Visibility check: appears if container top is scrolled out of view (negative top)
        setShowSticky(rect.top < 0);

        // Calculate distance from viewport right to container right
        const rightEdge = window.innerWidth - rect.right;

        // Offset -96px to place it further right (adjusted 40px more than 56px per user request)
        setOffsetRight(rightEdge - 96);
      }
    };

    window.addEventListener('scroll', handleScrollAndResize, { passive: true });
    window.addEventListener('resize', handleScrollAndResize, { passive: true });

    // Initial check
    handleScrollAndResize();

    return () => {
      window.removeEventListener('scroll', handleScrollAndResize);
      window.removeEventListener('resize', handleScrollAndResize);
    };
  }, []);


  // Watch relationship status for conditional rendering
  const relationshipStatus = watch('relationship_status');

  // Drag-and-drop sensors for prompts
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drawer drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      if (delta > 0) setDragOffsetY(delta);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      setIsDragging(false);
      setDragOffsetY(0);
      if (delta > 100) {
        setInfoDrawerOpen(false);
        setGoalsInfoOpen(false);
        setPronounsInfoOpen(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) setDragOffsetY(delta);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startY;
      setIsDragging(false);
      setDragOffsetY(0);
      if (delta > 100) {
        setInfoDrawerOpen(false);
        setGoalsInfoOpen(false);
        setPronounsInfoOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartY(clientY);
    setIsDragging(true);
  };

  // Prompt handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPrompts((items) => {
        const oldIndex = items.findIndex((item) => item.question === active.id);
        const newIndex = items.findIndex((item) => item.question === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpdatePrompt = (index: number, value: string) => {
    setPrompts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answer: value };
      return updated;
    });
  };

  const handleAddPrompt = (promptText: string) => {
    setPrompts((prev) => [...prev, { question: promptText, answer: '' }]);
    setPromptSelectorOpen(false);
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  // Nickname change handler
  const handleNicknameChange = async () => {
    if (!newNickname) return;
    setCheckingNickname(true);
    setNicknameError('');
    setNicknameSuccess('');

    try {
      await apiClient.patch('/profiles/nickname', { nickname: newNickname });
      setNicknameSuccess('Nickname actualizado correctamente');
      setTimeout(() => {
        setNicknameDialogOpen(false);
        setNewNickname('');
        setNicknameSuccess('');
      }, 2000);
    } catch (err: any) {
      setNicknameError(err.response?.data?.detail || 'Error al cambiar nickname');
    } finally {
      setCheckingNickname(false);
    }
  };

  // Phone verification handlers
  const handleVerifyPhone = async () => {
    setIsVerifyingPhone(true);
    try {
      await apiClient.post('/profiles/verify-phone', {
        country_code: countryCode,
        phone: phone
      });
      setVerificationCodeDialogOpen(true);
    } catch (err) {
      console.error('Phone verification failed', err);
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const confirmPhoneVerification = async () => {
    try {
      await apiClient.post('/profiles/confirm-phone', { code: verificationCode });
      setPhoneVerified(true);
      setVerificationCodeDialogOpen(false);
      setVerificationCode('');
    } catch (err) {
      console.error('Code verification failed', err);
    }
  };

  const handleChangePhoneRequest = () => {
    setChangePhoneDialogOpen(true);
  };

  const confirmChangePhone = () => {
    setPhoneVerified(false);
    setChangePhoneDialogOpen(false);
  };

  // Form submission
  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      // Create a strict payload with ONLY the fields allowed by the backend UpdateProfileRequest
      // This prevents 422 errors when read-only fields (like email, identity_verification_*) are sent back

      const payload: any = {
        // Basic Info
        real_name: data.real_name,
        // display_name: data.display_name, // Managed via User model, included if present
        bio: data.bio,
        birth_date: data.birth_date === '' ? null : data.birth_date,
        age: data.age,
        gender: data.gender,
        sexual_orientation: data.sexual_orientation,
        pronouns: data.pronouns,
        nickname: data.nickname,
        email: data.email,

        // Details
        height_cm: data.height_cm ? parseInt(data.height_cm, 10) : null,
        height_relevant: data.height_relevant,
        height_preferences: data.height_preferences || [],
        occupation: data.occupation,
        education_level: data.education_level,
        work_company: data.work_company,
        school: data.school,
        education_center: data.education_center,
        zodiac: data.zodiac,
        zodiac_relevant: data.zodiac_relevant,

        // Interests & Hobbies
        intentions: data.intentions,
        interests: data.interests,
        lifestyle_interests: lifestyleInterests, // State managed
        favorite_interests: data.favorite_interests,
        hobbies: data.hobbies,
        languages: data.languages,
        auto_preferred_languages: data.auto_preferred_languages,
        preferred_languages: data.preferred_languages,



        // Media (State managed)
        photos: photos,
        // loops: data.loops,
        // instagram_photos: data.instagram_photos,

        // Music (State managed logic in component, but data comes from form 'mi_himno')
        mi_himno: data.mi_himno ? {
          service: data.mi_himno.service,
          connected: data.mi_himno.connected,
          favorite_artists: data.mi_himno.favorite_artists || [],
          representative_playlist: data.mi_himno.representative_playlist,
          featured_songs: data.mi_himno.featured_songs || []
        } : null,
        favorite_songs: data.favorite_songs || [],
        spotify_playlists: data.spotify_playlists || [],
        music_genres: data.music_genres || [],

        // Location
        location: data.location,
        city: citySearch || data.city,
        location_sharing_enabled: data.location_sharing_enabled,
        distance_preference_km: data.distance_preference_km || data.search_radius_km || 50,
        search_radius_km: data.distance_preference_km || data.search_radius_km || 50,

        // Preferences / Search Settings
        attraction_preferences: data.attraction_preferences,
        orientation_preferences: data.orientation_preferences || [],
        feeling_curious: data.feeling_curious,
        curiosity_genders: data.curiosity_genders || [],
        age_range_min: data.age_range_min,
        age_range_max: data.age_range_max,
        search_states: data.search_states,
        search_countries: data.search_countries,
        excluded_states: data.excluded_states || [],
        excluded_countries: data.excluded_countries || [],

        // Visibility
        show_age: data.show_age,
        show_location: data.show_location,
        show_pronouns: data.show_pronouns,
        show_gender: data.show_gender,
        profile_visible: data.profile_visible,
        show_me_in_discovery: data.show_me_in_discovery,
        show_neurodiversity: data.show_neurodiversity,
        show_professional_only_matches: data.show_professional_only_matches,

        // Contact
        phone: phone, // State managed
        country_code: countryCode, // State managed

        // Other
        prompts: prompts, // State managed
        relationship_status: data.relationship_status,
        relationship_type: data.relationship_type,
        relationship_goals: data.relationship_goals,

        // Additional Data (New)
        family_plans: data.family_plans,
        family_plans_relevant: data.family_plans_relevant,
        child_acceptance: data.child_acceptance,
        communication_style: data.communication_style,
        love_language: data.love_language,
        social_media_usage: data.social_media_usage,
        drinking: data.drinking,
        smoking: data.smoking,
        exercise: data.exercise,
        activity_pattern: data.activity_pattern,
        mbti: data.mbti,
        mood: data.mood,


        // Personality & Characteristics (New)
        social_style: data.social_style,
        processing_style: data.processing_style,
        risk_tolerance: data.risk_tolerance,
        decision_making: data.decision_making,
        neurodiversity: data.neurodiversity,
        neurodiversity_diagnoses: data.neurodiversity_diagnoses,
        learning_preferences: data.learning_preferences,
        energy_level: data.energy_level,
        disabilities: data.disabilities,
        show_disabilities: data.show_disabilities,
        health_conditions: data.health_conditions,
        health_status: data.health_status,
        show_health: data.show_health,

        // Smart Photos
        smart_photos_enabled: smartPhotos,

      };

      console.log('Final Payload sending to backend:', payload);

      // Add display_name explicitly if it exists in form data, as it maps to User model
      if (data.display_name) payload.display_name = data.display_name;

      console.log('Sending clean payload:', payload);

      await onSave(payload);
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Save failed details:', err);
      if (err.response) {
        console.error('Backend Status:', err.response.status);
        console.error('Backend Data:', err.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  // Get available prompts for selector
  const allPrompts = getPromptsForLanguage(i18n.language || 'es');
  const availablePrompts = allPrompts.filter(
    (p) => !prompts.some((selected) => selected.question === p)
  );

  // Suggestion navigation
  // sectionId is a logical section key (also used by DiscoveryRefinementCard);
  // DOM anchors may differ (fields grouped inside profile sections)
  const SECTION_ANCHOR_MAP: Record<string, string> = {
    'section-relationship-type': 'section-additional',
    'section-height': 'section-additional',
    'section-zodiac': 'section-additional',
    'section-education': 'section-professional',
    'section-music-genres': 'section-music',
  };
  const handleSuggestionClick = (sectionId: string) => {
    const targetId = SECTION_ANCHOR_MAP[sectionId] || sectionId;
    const element = document.getElementById(targetId);
    if (element) {
      // Offset for sticky header if needed
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} ref={formRef}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={onBack}
            sx={{ color: '#ff4d4f', cursor: 'pointer' }}
          >
            <ArrowBackIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            {t('profile.edit', 'Editar Perfil')}
          </Typography>
        </Box>
        <Box className="top-actions-container">
          <Button
            className="btn-cancel"
            onClick={onBack}
            startIcon={<CloseIcon />}
            variant="outlined"
            color="inherit"
            sx={{
              mr: 1,
              textTransform: 'none',
              borderColor: 'text.secondary',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
                bgcolor: 'error.lighter'
              }
            }}
          >
            {t('common.cancel', 'Cancelar')}
          </Button>

          <Button
            type="submit"
            className="btn-save"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={saving}
            variant="contained"
            color="success" // Using success for green
            sx={{
              mr: 1,
              textTransform: 'none',
              boxShadow: 'none',
              fontWeight: 600,
              bgcolor: '#4CAF50', // Explicit green
              '&:hover': { bgcolor: '#43A047' }
            }}
          >
            {t('common.save', 'Guardar')}
          </Button>

          <Button
            className="btn-preview"
            onClick={handlePreview}
            startIcon={<VisibilityIcon />}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              bgcolor: 'grey.600',
              color: 'white',
              '&:hover': { bgcolor: 'grey.700' }
            }}
          >
            {t('profile.preview', 'Vista Previa')}
          </Button>
        </Box>
      </Box>

      {/* Unsaved Changes Dialog for Preview */}
      <Dialog open={unsavedPreviewDialogOpen} onClose={() => setUnsavedPreviewDialogOpen(false)}>
        <DialogTitle>{t('actions.unsaved_changes_title', 'Cambios sin guardar')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('actions.unsaved_changes_preview_text', 'Estás a punto de ver la vista previa, pero tienes cambios sin guardar. Si continúas, verás la versión anterior.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUnsavedPreviewDialogOpen(false);
            router.push('/profile/preview');
          }} color="secondary">
            {t('actions.view_without_saving', 'Ver sin guardar')}
          </Button>
          <Button onClick={() => {
            setUnsavedPreviewDialogOpen(false);
            // Trigger form submit via ref or handle it manually? 
            // Since this is outside the form submit handler, we need to trigger it.
            // The submit button inside the form triggers handleSubmit(onSubmit).
            // We can use formRef.current?.requestSubmit() if available, or just focus on save.
            // For now, let's just close and let user click save manually or we can trigger it.
            // A better UX might be just letting them click Save.
            // But the dialog button says "Save changes".
            // Triggering form submit programmatically in RHF:
            handleSubmit(onSubmit)();
          }} variant="contained" color="success" autoFocus>
            {t('actions.save_and_preview', 'Guardar cambios')}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Profile Completion Widget */}
      <Box mb={2}>
        <ProfileCompletionWidget
          control={control}
          onSuggestionClick={handleSuggestionClick}
        />
      </Box>
      {/* Sections Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} id="section-photos" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <PhotosSection
            profile={profile}
            smartPhotos={smartPhotos}
            setSmartPhotos={setSmartPhotos}
          />
        </Grid>

        <Grid item xs={12} id="section-basic" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <BasicInfoSection
            control={control}
            setValue={setValue}
            watch={watch}
            profile={profile}
            verified={verified}
            setVerified={setVerified}
            phone={phone}
            setPhone={setPhone}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            phoneVerified={phoneVerified}
            isVerifyingPhone={isVerifyingPhone}
            setNicknameDialogOpen={setNicknameDialogOpen}
            handleVerifyPhone={handleVerifyPhone}
            handleChangePhoneRequest={handleChangePhoneRequest}
          />
        </Grid>

        <Grid item xs={12} id="section-location" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <LocationSection
            control={control}
            setValue={setValue}
            watch={watch}
            citySearch={citySearch}
            setCitySearch={setCitySearch}
            userPlan="vip" // TODO: Connect to real user plan
          />
        </Grid>

        <Grid item xs={12} id="section-aboutme" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <AboutMeSection
            control={control}
            setInfoDrawerOpen={setInfoDrawerOpen}
            prompts={prompts}
            setPrompts={setPrompts}
            setPromptSelectorOpen={setPromptSelectorOpen}
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            handleUpdatePrompt={handleUpdatePrompt}
            handleRemovePrompt={handleRemovePrompt}
          />
        </Grid>

        <Grid item xs={12} id="section-goals" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <RelationshipGoalsSection
            control={control}
            setValue={setValue}
            watch={watch}
            setGoalsInfoOpen={setGoalsInfoOpen}
          />
        </Grid>

        <Grid item xs={12} id="section-interests" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <InterestsSection
            lifestyleInterests={lifestyleInterests}
            setLifestyleInterests={setLifestyleInterests}
          />
        </Grid>

        <Grid item xs={12} id="section-pronouns" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <PronounsSection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
            setPronounsInfoOpen={setPronounsInfoOpen}
          />
        </Grid>

        <Grid item xs={12} id="section-additional" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <AdditionalDataSection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
          />
        </Grid>





        <Grid item xs={12} id="section-professional" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <ProfessionalAcademicSection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
          />
        </Grid>

        <Grid item xs={12} id="section-music" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <MusicSection control={control} watch={watch} setValue={setValue} />
        </Grid>

        <Grid item xs={12} id="section-identity" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <IdentitySection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
          />
        </Grid>

        <Grid item xs={12} id="section-personality" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <PersonalitySection control={control} setValue={setValue} />
        </Grid>

        <Grid item xs={12} id="section-cognitive" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <CognitiveSection control={control} setValue={setValue} />
        </Grid>

        <Grid item xs={12} id="section-wellness" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <WellnessSection control={control} setValue={setValue} />
        </Grid>







        <ProfileControlSection
          control={control}
          setValue={setValue}
          watch={watch}
        />

        {/*
        <Accordion
          expanded={expanded === 'social'}
          onChange={handleChange('social')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <GroupAddIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Círculo Social
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <SocialSection control={control} setValue={setValue} watch={watch} />
          </AccordionDetails>
        </Accordion>
        */}

        <Grid item xs={12} id="section-status" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <CivilStatusSection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
            relationshipStatus={relationshipStatus}
            profile={profile}
            onSave={onSave}
          />
        </Grid>

        <Grid item xs={12} id="section-languages" sx={{ '& > .MuiGrid-item': { p: 0 } }}>
          <LanguagesSection
            control={control}
            setValue={setValue}
            watch={watch}
            options={options}
            t={t as any}
          />
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
          variant="filled"
        >
          {t('common.success', 'Cambios guardados correctamente')}
        </Alert>
      </Snackbar>

      {/* Nickname Change Dialog */}
      <Dialog open={nicknameDialogOpen} onClose={() => setNicknameDialogOpen(false)}>
        <DialogTitle>Cambiar Nickname</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Tu nickname es único y se usa para tu URL de perfil. Solo puedes cambiarlo una vez cada 30 días.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nuevo Nickname"
            fullWidth
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            error={!!nicknameError}
            helperText={nicknameError || "Letras, números, . _ - @ (sin espacios)"}
          />
          {nicknameSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {nicknameSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNicknameDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleNicknameChange} disabled={checkingNickname || !newNickname}>
            {checkingNickname ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Phone Confirmation Dialog */}
      <Dialog open={changePhoneDialogOpen} onClose={() => setChangePhoneDialogOpen(false)}>
        <DialogTitle>¿Cambiar número de teléfono?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Si cambias tu número, tendrás que verificar el nuevo número nuevamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePhoneDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmChangePhone} color="primary">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Code Dialog */}
      <Dialog open={verificationCodeDialogOpen} onClose={() => setVerificationCodeDialogOpen(false)}>
        <DialogTitle>Verificar Teléfono</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingresa el código de 6 dígitos que enviamos a {countryCode} {phone}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Código de verificación"
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationCodeDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmPhoneVerification} disabled={verificationCode.length < 4}>
            Verificar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prompt Selector Dialog */}
      <Dialog open={promptSelectorOpen} onClose={() => setPromptSelectorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={() => setPromptSelectorOpen(false)}
            size="small"
            color="error"
            startIcon={<CloseIcon />}
          />
          Selecciona una frase divertida
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {availablePrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="contained"
                onClick={() => handleAddPrompt(prompt)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  boxShadow: 'none',
                  bgcolor: 'action.hover', // Solid light background
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.selected',
                    boxShadow: 'none'
                  }
                }}
              >
                {prompt}
              </Button>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      {showSticky && (
        <div
          className="floating-actions"
          style={{
            right: `${offsetRight}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'fixed',
            bottom: '24px',
            zIndex: 1000
          }}
        >
          <button
            className="btn-preview"
            onClick={handlePreview}
            aria-label={t('profile.preview', 'Vista Previa')}
            style={{
              backgroundColor: '#757575',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              border: 'none',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <VisibilityIcon />
          </button>
          <button
            className="btn-save"
            onClick={handleSubmit(onSubmit)}
            aria-label={t('common.save', 'Guardar')}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : '💾'}
          </button>
          <button
            className="btn-cancel"
            onClick={onBack}
            aria-label={t('common.cancel', 'Cancelar')}
          >
            ✖
          </button>
        </div>
      )}

      {/* Info Drawers */}
      <InfoDrawers
        infoDrawerOpen={infoDrawerOpen}
        setInfoDrawerOpen={setInfoDrawerOpen}
        goalsInfoOpen={goalsInfoOpen}
        setGoalsInfoOpen={setGoalsInfoOpen}
        pronounsInfoOpen={pronounsInfoOpen}
        setPronounsInfoOpen={setPronounsInfoOpen}
        isDragging={isDragging}
        dragOffsetY={dragOffsetY}
        handleDragStart={handleDragStart}
      />
    </form >
  );
}

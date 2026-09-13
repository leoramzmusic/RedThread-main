import { useState, ReactNode } from 'react';
import {
  Avatar,
  Box,
  Typography,
  Stack,
  Divider,
  Switch,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  Home as HomeIcon,
  Explore as ExploreIcon,
  Event as EventIcon,
  WorkspacePremium as PlansIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  HelpOutline as HelpIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Language as TranslateIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import QuickActionIcon from '../motion/QuickActionIcon';
import ThemeSwitch from '../motion/ThemeSwitch';
import BasicThemeSwitch from '../motion/BasicThemeSwitch';
import GlowThemeSwitch from '../motion/GlowThemeSwitch';
import SubtleThemeSwitch from '../motion/SubtleThemeSwitch';
import LiquidThemeSwitch from '../motion/LiquidThemeSwitch';
import { useAppTheme } from '../../context/ThemeContext';
import {
  ICON_STYLE_VARIANTS,
  ICON_STYLE_DEFAULTS,
  isIconStyleId,
  IconStyleId,
} from '../motion/iconStyles';

const RED_THREAD = '#D32F2F';
const RING_LEN = 2 * Math.PI * 24;

interface NavbarSectionProps {
  settings: any;
  onSettingsChange: (field: string, value: any) => void;
}

interface ShortcutRowProps {
  icon: ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
}

function ShortcutRow({ icon, label, description, enabled, onToggle }: ShortcutRowProps) {
  const [burstKey, setBurstKey] = useState(0);

  const handleToggle = (next: boolean) => {
    setBurstKey((k) => k + 1);
    onToggle(next);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: enabled ? 'rgba(211,47,47,0.28)' : 'rgba(211,47,47,0)',
        bgcolor: enabled ? 'rgba(211,47,47,0.05)' : 'transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {burstKey > 0 && (
        <Box
          key={`burst-${burstKey}`}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            pointerEvents: 'none',
            boxShadow: '0 0 0 0 rgba(211,47,47,0)',
            animation: 'rtRedBurst 0.6s ease-out',
          }}
        />
      )}

      {/* Icono con hilo rojo que se dibuja al activar */}
      <Box
        sx={{
          position: 'relative',
          width: 48,
          height: 48,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(211,47,47,0.12)',
          bgcolor: (theme) => (enabled ? 'rgba(211,47,47,0.1)' : theme.palette.action.hover),
          color: enabled ? RED_THREAD : 'text.secondary',
          transition: 'all 0.35s ease',
          '@media (prefers-reduced-motion: reduce)': {
            'svg *': { transition: 'none' },
          },
        }}
      >
        {icon}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 56 56"
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke={RED_THREAD}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_LEN}
            strokeDashoffset={enabled ? 0 : RING_LEN}
            opacity={enabled ? 1 : 0}
            style={{
              transition: 'stroke-dashoffset 0.55s cubic-bezier(0.65,0,0.35,1), opacity 0.4s ease',
            }}
          />
        </svg>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Switch
        checked={enabled}
        onChange={(e) => handleToggle(e.target.checked)}
        sx={{
          '&.Mui-checked': {
            color: RED_THREAD,
            '&:hover': { backgroundColor: 'rgba(211,47,47,0.08)' },
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: RED_THREAD,
            opacity: 1,
          },
        }}
      />
    </Box>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      textTransform="uppercase"
      letterSpacing="0.08em"
      color="text.secondary"
      sx={{ display: 'block', px: 1, mb: 1 }}
    >
      {children}
    </Typography>
  );
}

interface QuickIconRowProps {
  label: string;
  description: string;
  icon: ReactNode;
  styleId: IconStyleId;
  enabled: boolean;
  onStyleChange: (next: IconStyleId) => void;
  onToggle: (next: boolean) => void;
}

function QuickIconRow({
  label,
  description,
  icon,
  styleId,
  enabled,
  onStyleChange,
  onToggle,
}: QuickIconRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: enabled ? 'rgba(211,47,47,0.28)' : 'rgba(211,47,47,0.08)',
        bgcolor: enabled ? 'rgba(211,47,47,0.04)' : 'transparent',
        opacity: enabled ? 1 : 0.65,
        transition: 'all 0.3s ease',
      }}
    >
      {icon}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Checkbox
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
        inputProps={{ 'aria-label': `Mostrar ${label} en el navbar` }}
        sx={{
          '&.Mui-checked': { color: RED_THREAD },
          '&.Mui-checked:hover': { backgroundColor: 'rgba(211,47,47,0.08)' },
        }}
      />
      <Select
        size="small"
        value={styleId}
        onChange={(e) => onStyleChange(e.target.value as IconStyleId)}
        sx={{
          minWidth: 180,
          fontSize: '0.85rem',
          '& .MuiSelect-select': { py: 0.8 },
        }}
      >
        {ICON_STYLE_VARIANTS.map((v) => (
          <MenuItem key={v.value} value={v.value}>
            {v.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

interface SegmentGroupProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SegmentGroup({ label, value, options, onChange }: SegmentGroupProps) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, next: string | null) => {
          if (next) onChange(next);
        }}
      >
        {options.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

const SHORTCUT_DEFAULTS: Record<string, boolean> = {
  home: true,
  discover: true,
  events: true,
  plans: true,
  favorites: false,
  recent: false,
  help: false,
  notifications: true,
  settings: true,
};

const QUICK_ACTION_DEFAULTS: Record<string, boolean> = {
  theme: true,
  notifications: true,
  settings: true,
  language: true,
};

export default function NavbarSection({ settings, onSettingsChange }: NavbarSectionProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();

  const [basicDemo, setBasicDemo] = useState(false);
  const [glowDemo, setGlowDemo] = useState(false);
  const [subtleDemo, setSubtleDemo] = useState(false);
  const [liquidDemo, setLiquidDemo] = useState(false);
  const [premiumDemo, setPremiumDemo] = useState(false);

  const isDark = theme.palette.mode === 'dark';
  const glassBg = isDark ? 'rgba(16,18,32,0.55)' : 'rgba(255,255,255,0.72)';

  const { user } = useSelector((state: RootState) => state.auth);
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };
  const displayAvatar = getImageUrl(user?.avatar);

  const current = settings?.navbar_config ?? {};
  const shortcuts: Record<string, boolean> = {
    ...SHORTCUT_DEFAULTS,
    ...(current.shortcuts ?? {}),
  };
  const quickActions: Record<string, boolean> = {
    ...QUICK_ACTION_DEFAULTS,
    ...(current.quick_actions ?? {}),
  };
  const profile = {
    shape: 'circle' as const,
    border: 'accent' as const,
    glow: 'accent' as const,
    ...(current.profile ?? {}),
  };

  const updateShortcut = (id: string, checked: boolean) => {
    onSettingsChange('navbar_config', { ...current, shortcuts: { ...shortcuts, [id]: checked } });
  };

  const updateQuickAction = (id: string, checked: boolean) => {
    onSettingsChange('navbar_config', {
      ...current,
      quick_actions: { ...quickActions, [id]: checked },
    });
  };

  const updateProfile = (key: string, value: string) => {
    onSettingsChange('navbar_config', { ...current, profile: { ...profile, [key]: value } });
  };

  const mainNavRows = [
    {
      id: 'home',
      label: t('nav.home', 'Inicio'),
      description: t('nav_shortcut_home', 'Página de inicio del usuario'),
      icon: <HomeIcon fontSize="small" />,
    },
    {
      id: 'discover',
      label: t('nav.discover', 'Descubrir'),
      description: t('nav_shortcut_discover', 'Explorar perfiles'),
      icon: <ExploreIcon fontSize="small" />,
    },
    {
      id: 'events',
      label: t('nav.events', 'Eventos'),
      description: t('nav_shortcut_events', 'Próximos eventos'),
      icon: <EventIcon fontSize="small" />,
    },
    {
      id: 'plans',
      label: t('nav.plans', 'Planes'),
      description: t('nav_shortcut_plans', 'Planes y membresías'),
      icon: <PlansIcon fontSize="small" />,
    },
  ];

  const optionalNavRows = [
    {
      id: 'favorites',
      label: t('nav.favorites', 'Favoritos'),
      description: t('nav_shortcut_favorites', 'Acceso rápido a tus likes'),
      icon: <FavoriteIcon fontSize="small" />,
    },
    {
      id: 'recent',
      label: t('nav.recent', 'Recientes'),
      description: t('nav_shortcut_recent', 'Perfiles que visitaste'),
      icon: <HistoryIcon fontSize="small" />,
    },
    {
      id: 'help',
      label: t('nav.help', 'Ayuda'),
      description: t('nav_shortcut_help', 'Centro de ayuda y soporte'),
      icon: <HelpIcon fontSize="small" />,
    },
  ];

  const iconStyles: Record<string, IconStyleId> = {
    ...ICON_STYLE_DEFAULTS,
    ...(Object.fromEntries(
      Object.entries(current.icon_styles ?? {}).filter(([, v]) => isIconStyleId(v)),
    ) as Record<string, IconStyleId>),
  };

  const updateIconStyle = (id: string, value: IconStyleId) => {
    onSettingsChange('navbar_config', { ...current, icon_styles: { ...iconStyles, [id]: value } });
  };

  const quickIcons: {
    id: string;
    label: string;
    description: string;
    motion: 'bell' | 'gear' | 'globe' | 'switch';
    basicHover?: 'bell' | 'gear';
    asBox?: boolean;
    badgeContent?: ReactNode;
    icon: ReactNode;
  }[] = [
    {
      id: 'theme',
      label: t('nav.theme', 'Tema claro/oscuro'),
      description: t('navbar_icon_theme', 'Cambiar el modo del sitio'),
      motion: 'switch',
      asBox: true,
      icon:
        iconStyles.theme === 'basic' ? (
          <BasicThemeSwitch checked={basicDemo} onChange={() => setBasicDemo((d) => !d)} />
        ) : iconStyles.theme === 'glow' ? (
          <GlowThemeSwitch checked={glowDemo} onChange={() => setGlowDemo((d) => !d)} />
        ) : iconStyles.theme === 'subtle' ? (
          <SubtleThemeSwitch checked={subtleDemo} onChange={() => setSubtleDemo((d) => !d)} />
        ) : iconStyles.theme === 'liquid' ? (
          <LiquidThemeSwitch checked={liquidDemo} onChange={() => setLiquidDemo((d) => !d)} />
        ) : (
          <ThemeSwitch checked={premiumDemo} onChange={() => setPremiumDemo((d) => !d)} />
        ),
    },
    {
      id: 'notifications',
      label: t('nav.notifications', 'Notificaciones'),
      description: t('navbar_icon_notifications', 'Campana de notificaciones'),
      motion: 'bell',
      basicHover: 'bell',
      badgeContent: 3,
      icon: <NotificationsIcon className="rt-bell-icon" sx={{ fontSize: 22 }} />,
    },
    {
      id: 'settings',
      label: t('nav.settings', 'Configuración'),
      description: t('navbar_icon_settings', 'Acceso directo a ajustes'),
      motion: 'gear',
      basicHover: 'gear',
      icon: <SettingsIcon className="rt-settings-spin" sx={{ fontSize: 22 }} />,
    },
    {
      id: 'language',
      label: t('nav.language', 'Idioma'),
      description: t('navbar_icon_language', 'Selector de idioma del sitio'),
      motion: 'globe',
      icon: <TranslateIcon className="rt-globe" sx={{ fontSize: 22 }} />,
    },
  ];

  const enabledQuickIcons = quickIcons.filter((q) => quickActions[q.id] !== false);

  const glassCard = {
    p: 2.5,
    borderRadius: 3,
    border: '1px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    bgcolor: glassBg,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
  };

  const isDiamond = profile.shape === 'diamond';
  const previewRadius = profile.shape === 'circle' ? '50%' : profile.shape === 'square' ? '12px' : '6px';
  const previewBorderWidth = profile.border === 'none' ? 0 : profile.border === 'thin' ? 1.5 : 2;
  const previewBorderColor =
    profile.border === 'none'
      ? 'transparent'
      : profile.border === 'thin'
        ? isDark
          ? 'rgba(255,255,255,0.35)'
          : 'rgba(0,0,0,0.25)'
        : alpha(theme.palette.primary.main, 0.6);
  const previewGlow =
    profile.glow === 'none'
      ? 'none'
      : profile.glow === 'passion'
        ? '0 0 0 2px rgba(211,47,47,0.35), 0 0 14px rgba(211,47,47,0.35)'
        : `0 0 0 2px ${alpha(theme.palette.primary.main, 0.35)}, 0 0 14px ${alpha(theme.palette.primary.main, 0.35)}`;

  return (
    <Stack
      spacing={3}
      sx={{
        '@keyframes rtRedBurst': {
          from: { boxShadow: '0 0 0 0 rgba(211,47,47,0.5)' },
          to: { boxShadow: '0 0 0 16px rgba(211,47,47,0)' },
        },
      }}
    >
      <Divider />

      {/* Bloque 1: Atajos de navegación */}
      <Box sx={glassCard}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="h6" fontWeight={700}>
            {t('navbar_nav_title', 'Atajos de navegación')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('navbar_nav_desc', 'Los menús principales y enlaces opcionales que aparecen en el centro del navbar.')}
        </Typography>

        <Box mb={1}>
          <GroupLabel>{t('navbar_nav_main', 'Principales')}</GroupLabel>
          <Stack spacing={1.5}>
            {mainNavRows.map((row) => (
              <ShortcutRow
                key={row.id}
                icon={row.icon}
                label={row.label}
                description={row.description}
                enabled={shortcuts[row.id] ?? true}
                onToggle={(checked) => updateShortcut(row.id, checked)}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box>
          <GroupLabel>{t('navbar_nav_optional', 'Opcionales')}</GroupLabel>
          <Stack spacing={1.5}>
            {optionalNavRows.map((row) => (
              <ShortcutRow
                key={row.id}
                icon={row.icon}
                label={row.label}
                description={row.description}
                enabled={shortcuts[row.id] ?? false}
                onToggle={(checked) => updateShortcut(row.id, checked)}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Bloque 2: Iconos de acción rápida */}
      <Box sx={glassCard}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {t('navbar_actions_title', 'Iconos de acción rápida')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('navbar_actions_desc', 'Activa cada ícono para mostrarlo en el navbar y elige su estilo visual.')}
        </Typography>

        {/* Barra de vista previa en vivo */}
        <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.08em" color="text.secondary" sx={{ display: 'block', px: 1, mb: 1 }}>
          {t('navbar_actions_preview', 'Vista previa del navbar')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1.5,
            mb: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            bgcolor: glassBg,
            backdropFilter: 'blur(14px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ width: 90, mr: 'auto' }} />
          {enabledQuickIcons.map((q) => (
            <QuickActionIcon key={q.id} styleId={iconStyles[q.id]} motion={q.motion} basicHover={q.basicHover} asBox={q.asBox} badgeContent={q.badgeContent}>
              {q.icon}
            </QuickActionIcon>
          ))}
          <Avatar
            src={displayAvatar || undefined}
            alt={user?.email || 'Perfil'}
            sx={{
              width: 30,
              height: 30,
              bgcolor: 'primary.main',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.7rem',
              border: '1.5px solid',
              borderColor: alpha(theme.palette.primary.main, 0.45),
            }}
          >
            {!displayAvatar && user?.email?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        <Stack spacing={1.5}>
          {quickIcons.map((q) => (
            <QuickIconRow
              key={q.id}
              label={q.label}
              description={q.description}
              styleId={iconStyles[q.id]}
              enabled={quickActions[q.id] !== false}
              onStyleChange={(next) => updateIconStyle(q.id, next)}
              onToggle={(checked) => updateQuickAction(q.id, checked)}
              icon={
                <QuickActionIcon styleId={iconStyles[q.id]} motion={q.motion} basicHover={q.basicHover} asBox={q.asBox} badgeContent={q.badgeContent}>
                  {q.icon}
                </QuickActionIcon>
              }
            />
          ))}
        </Stack>
      </Box>

      {/* Estilo del perfil */}
      <Box sx={glassCard}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {t('navbar_profile_title', 'Estilo de tu perfil')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('navbar_profile_desc', 'Tu avatar es fijo en el navbar; aquí editas su forma, borde y resplandor.')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
          {/* Vista previa */}
          <Box
            sx={{
              width: 76,
              height: 76,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                borderRadius: previewRadius,
                border: `${previewBorderWidth}px solid ${previewBorderColor}`,
                boxShadow: previewGlow,
                bgcolor: 'primary.main',
                color: '#fff',
                transform: isDiamond ? 'rotate(45deg)' : 'none',
                transition: 'border-radius 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease',
              }}
            >
              <PersonIcon
                sx={{
                  transform: isDiamond ? 'rotate(-45deg)' : 'none',
                  fontSize: 24,
                  transition: 'transform 0.35s ease',
                }}
              />
            </Box>
          </Box>

          {/* Controles */}
          <Stack spacing={2} sx={{ flex: 1 }}>
            <SegmentGroup
              label={t('navbar_profile_shape', 'Forma')}
              value={profile.shape}
              onChange={(v) => updateProfile('shape', v)}
              options={[
                { value: 'circle', label: t('shape_circle', 'Circular') },
                { value: 'square', label: t('shape_square', 'Cuadrada') },
                { value: 'diamond', label: t('shape_diamond', 'Rombo') },
              ]}
            />
            <SegmentGroup
              label={t('navbar_profile_border', 'Borde')}
              value={profile.border}
              onChange={(v) => updateProfile('border', v)}
              options={[
                { value: 'none', label: t('border_none', 'Sin borde') },
                { value: 'thin', label: t('border_thin', 'Delgado') },
                { value: 'accent', label: t('border_accent', 'Anillo acento') },
              ]}
            />
            <SegmentGroup
              label={t('navbar_profile_glow', 'Resplandor')}
              value={profile.glow}
              onChange={(v) => updateProfile('glow', v)}
              options={[
                { value: 'none', label: t('glow_none', 'Sin glow') },
                { value: 'accent', label: t('glow_accent', 'Acento') },
                { value: 'passion', label: t('glow_passion', 'Rojo pasión') },
              ]}
            />
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
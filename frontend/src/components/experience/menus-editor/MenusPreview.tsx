import { Box, MenuItem, Paper, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { MENU_ROLES, type MenuRole, type UserMenusMetadata } from './types';
import { USER_MENU_ITEMS, USER_MENU_SECTIONS } from './userMenuItems';
import { visibleItemIds, type PreviewContext, type PreviewDevice } from './visibility';

interface MenusPreviewProps {
  metadata: UserMenusMetadata;
  ctx: PreviewContext;
  device: PreviewDevice;
  onCtxChange: (patch: Partial<PreviewContext>) => void;
  onDeviceChange: (device: PreviewDevice) => void;
}

const COUNTRIES = [
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'ES', label: 'España' },
  { value: 'CO', label: 'Colombia' },
  { value: 'US', label: 'United States' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

const DEVICES: ReadonlyArray<{ value: PreviewDevice; label: string }> = [
  { value: 'mobile', label: 'Móvil' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'desktop', label: 'Desktop' },
];

const TOTAL_ITEMS = USER_MENU_ITEMS.reduce((total, item) => total + 1 + (item.children?.length ?? 0), 0);

const DEVICE_SX: Record<PreviewDevice, { width: number | string; height: number; maxWidth?: number }> = {
  mobile: { width: 230, height: 430 },
  tablet: { width: '100%', maxWidth: 640, height: 260 },
  desktop: { width: 270, height: 540 },
};

export default function MenusPreview({ metadata, ctx, device, onCtxChange, onDeviceChange }: MenusPreviewProps) {
  const visible = visibleItemIds(USER_MENU_SECTIONS, metadata, ctx);

  return (
    <Box data-testid="menus-preview" data-device={device} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Vista previa del sidebar
        </Typography>
        <Tabs
          value={ctx.role}
          onChange={(_, value: MenuRole) => onCtxChange({ role: value })}
          aria-label="Rol de preview"
          variant="scrollable"
          scrollButtons={false}
        >
          {MENU_ROLES.map((role) => (
            <Tab key={role.value} value={role.value} label={role.label} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={device}
          onChange={(_, value: PreviewDevice | null) => {
            if (value) onDeviceChange(value);
          }}
          aria-label="Dispositivo"
        >
          {DEVICES.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          select
          size="small"
          label="País"
          value={ctx.country}
          onChange={(e) => onCtxChange({ country: e.target.value })}
          sx={{ minWidth: 140 }}
        >
          {COUNTRIES.map((country) => (
            <MenuItem key={country.value} value={country.value}>
              {country.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Idioma"
          value={ctx.language}
          onChange={(e) => onCtxChange({ language: e.target.value })}
          sx={{ minWidth: 140 }}
        >
          {LANGUAGES.map((language) => (
            <MenuItem key={language.value} value={language.value}>
              {language.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="number"
          label="Energía social"
          value={ctx.energy}
          onChange={(e) => onCtxChange({ energy: Number(e.target.value) })}
          inputProps={{ min: 1, max: 5 }}
          sx={{ width: 130 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        {visible.size} de {TOTAL_ITEMS} visibles
      </Typography>

      <Paper
        variant="outlined"
        data-testid="menus-preview-surface"
        sx={{
          p: 1.5,
          ...DEVICE_SX[device],
          overflow: 'auto',
          display: 'flex',
          flexDirection: device === 'tablet' ? 'row' : 'column',
          gap: device === 'tablet' ? 2 : 0,
          bgcolor: 'background.default',
          borderColor: 'divider',
        }}
      >
        {USER_MENU_SECTIONS.map((section) => (
          <Box key={section.id} sx={{ minWidth: device === 'tablet' ? 150 : undefined }}>
            <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.6, color: 'text.secondary' }}>
              {section.label}
            </Typography>
            {section.items
              .filter((item) => visible.has(item.id))
              .map((item) => (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4, px: 1, borderRadius: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="body2" noWrap>
                      {item.label}
                    </Typography>
                  </Box>
                  {item.children
                    ?.filter((child) => visible.has(child.id))
                    .map((child) => (
                      <Typography
                        key={child.id}
                        variant="caption"
                        sx={{ display: 'block', pl: 4, color: 'text.secondary' }}
                      >
                        {child.label}
                      </Typography>
                    ))}
                </Box>
              ))}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

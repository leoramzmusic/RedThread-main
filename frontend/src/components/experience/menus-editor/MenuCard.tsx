import { Paper, Box, Typography, Chip, Switch, Button } from '@mui/material';
import { MENU_STATUSES, describeRoleAccess, type MenuConfig } from './types';

interface MenuCardProps {
  id: string;
  label: string;
  config: MenuConfig;
  onToggleVisible: (visible: boolean) => void;
  onOpenRules: () => void;
}

export default function MenuCard({ id, label, config, onToggleVisible, onOpenRules }: MenuCardProps) {
  const statusMeta = MENU_STATUSES.find((s) => s.value === config.status) ?? MENU_STATUSES[0];

  return (
    <Paper
      data-testid={`menu-card-${id}`}
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        opacity: config.visible ? 1 : 0.72,
        boxShadow: config.visible
          ? '0 0 0 1px rgba(230,57,70,0.28), 0 0 16px rgba(230,57,70,0.18)'
          : 'none',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {label}
        </Typography>
        <Chip
          size="small"
          label={config.visible ? statusMeta.label : 'Desactivado'}
          color={config.visible ? statusMeta.color : 'error'}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v{config.version}
        </Typography>
        {config.roles.length > 0 && (
          <Chip size="small" variant="outlined" label={describeRoleAccess(config.roles)} />
        )}
        {config.rules.length > 0 && (
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={`${config.rules.length} regla${config.rules.length > 1 ? 's' : ''}`}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Switch
          checked={config.visible}
          onChange={(e) => onToggleVisible(e.target.checked)}
          inputProps={{ 'aria-label': `Visibilidad de ${label}` }}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: '#E63946' },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E63946' },
          }}
        />
        <Button size="small" onClick={onOpenRules} aria-label={`Configurar reglas de ${label}`}>
          Configurar reglas
        </Button>
      </Box>
    </Paper>
  );
}

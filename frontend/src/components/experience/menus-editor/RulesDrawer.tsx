import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  DEFAULT_MENU_CONFIG,
  MENU_ROLES,
  MENU_STATUSES,
  describeRoleAccess,
  type MenuConfig,
  type MenuRole,
  type MenuRule,
  type MenuStatus,
} from './types';

/** AdminNavbar: Toolbar minHeight 72px + borderBottom 1px (static at every breakpoint). */
const NAVBAR_HEIGHT = 73;

const PASSION_RED = '#D32F2F';
const DARK_GREY = '#424242';

export interface RulesDrawerProps {
  open: boolean;
  saving?: boolean;
  itemLabel: string;
  initial: MenuConfig | null;
  instanceKey?: number;
  onClose: () => void;
  onSave: (config: MenuConfig) => void;
}

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const numOr = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: PASSION_RED },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PASSION_RED },
  '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': { backgroundColor: DARK_GREY },
} as const;

const checkboxSx = {
  '&.Mui-checked': { color: PASSION_RED },
} as const;

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'action.hover',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
      }}
    >
      <Box>
        <Box sx={{ width: 24, height: 3, borderRadius: 2, bgcolor: PASSION_RED, mb: 0.75 }} />
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function RuleRow({
  label,
  ariaLabel,
  checked,
  onToggle,
  children,
}: {
  label: string;
  ariaLabel: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              onChange={(e) => onToggle(e.target.checked)}
              inputProps={{ 'aria-label': ariaLabel }}
              sx={switchSx}
            />
          }
          label={label}
        />
        {checked && (
          <Chip
            size="small"
            variant="outlined"
            label={`Regla aplicada: ${label}`}
            sx={{ color: PASSION_RED, borderColor: PASSION_RED }}
          />
        )}
      </Box>
      {checked && children}
    </>
  );
}

interface RulesPanelProps {
  initial: MenuConfig;
  saving: boolean;
  itemLabel: string;
  onClose: () => void;
  onSave: (config: MenuConfig) => void;
}

function RulesPanel({ initial, saving, itemLabel, onClose, onSave }: RulesPanelProps) {
  const geoRule = initial.rules.find((rule): rule is Extract<MenuRule, { kind: 'geo' }> => rule.kind === 'geo');
  const languageRule = initial.rules.find(
    (rule): rule is Extract<MenuRule, { kind: 'language' }> => rule.kind === 'language'
  );
  const energyRule = initial.rules.find((rule): rule is Extract<MenuRule, { kind: 'energy' }> => rule.kind === 'energy');

  const [roles, setRoles] = useState<MenuRole[]>(initial.roles);
  const [status, setStatus] = useState<MenuStatus>(initial.status);
  const [version, setVersion] = useState(initial.version);
  const [geoOn, setGeoOn] = useState(Boolean(geoRule));
  const [geoCountries, setGeoCountries] = useState(geoRule ? geoRule.countries.join(', ') : '');
  const [languageOn, setLanguageOn] = useState(Boolean(languageRule));
  const [languageCodes, setLanguageCodes] = useState(languageRule ? languageRule.languages.join(', ') : '');
  const [energyOn, setEnergyOn] = useState(Boolean(energyRule));
  const [energyMin, setEnergyMin] = useState(energyRule ? String(energyRule.min) : '1');
  const [energyMax, setEnergyMax] = useState(energyRule ? String(energyRule.max) : '5');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(initial.rules, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [rawRules, setRawRules] = useState<MenuRule[] | null>(null);

  const discardJson = () => setRawRules(null);

  const toggleRole = (role: MenuRole) => {
    discardJson();
    setRoles((prev) => {
      if (prev.includes(role)) return prev.filter((r) => r !== role);
      const next = [...prev, role];
      if (role === 'vip' && !next.includes('premium')) next.push('premium');
      return next;
    });
  };

  const buildRules = (): MenuRule[] => {
    const rules: MenuRule[] = [];
    if (geoOn) rules.push({ kind: 'geo', countries: splitList(geoCountries).map((c) => c.toUpperCase()) });
    if (languageOn) rules.push({ kind: 'language', languages: splitList(languageCodes).map((l) => l.toLowerCase()) });
    if (energyOn) rules.push({ kind: 'energy', min: numOr(energyMin, 1), max: numOr(energyMax, 5) });
    return rules;
  };

  const applyJson = () => {
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('rules must be an array');
      setRawRules(parsed as MenuRule[]);
      setJsonError(null);
    } catch {
      setJsonError('JSON inválido');
    }
  };

  const handleSave = () => {
    onSave({
      ...initial,
      roles,
      status,
      version,
      rules: rawRules ?? buildRules(),
    });
  };

  return (
    <>
      <Box
        sx={{
          flexShrink: 0,
          px: 3,
          pt: 2.5,
          pb: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Reglas — {itemLabel}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Cerrar">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        data-testid="rules-scroll"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          px: 3,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <SectionCard title="Visibilidad por suscripción">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {MENU_ROLES.map((role) => (
              <FormControlLabel
                key={role.value}
                control={
                  <Checkbox
                    checked={roles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    sx={checkboxSx}
                  />
                }
                label={role.label}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: PASSION_RED, fontWeight: 600 }} display="block">
            {describeRoleAccess(roles)}
          </Typography>
        </SectionCard>

        <SectionCard title="Estado y versión">
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Estado"
              size="small"
              value={status}
              onChange={(e) => {
                discardJson();
                setStatus(e.target.value as MenuStatus);
              }}
              sx={{ minWidth: 170, flexGrow: 1 }}
            >
              {MENU_STATUSES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Versión"
              size="small"
              value={version}
              onChange={(e) => {
                discardJson();
                setVersion(e.target.value);
              }}
              sx={{ minWidth: 140, flexGrow: 1 }}
            />
          </Box>
        </SectionCard>

        <SectionCard title="Reglas condicionales">
          <RuleRow
            label="Solo en países específicos"
            ariaLabel="Regla de geografía"
            checked={geoOn}
            onToggle={(next) => {
              discardJson();
              setGeoOn(next);
            }}
          >
            <TextField
              label="Países (ISO, separados por coma)"
              size="small"
              fullWidth
              value={geoCountries}
              onChange={(e) => {
                discardJson();
                setGeoCountries(e.target.value);
              }}
            />
          </RuleRow>

          <RuleRow
            label="Solo en ciertos idiomas"
            ariaLabel="Regla de idioma"
            checked={languageOn}
            onToggle={(next) => {
              discardJson();
              setLanguageOn(next);
            }}
          >
            <TextField
              label="Idiomas (códigos, separados por coma)"
              size="small"
              fullWidth
              value={languageCodes}
              onChange={(e) => {
                discardJson();
                setLanguageCodes(e.target.value);
              }}
            />
          </RuleRow>

          <RuleRow
            label="Según energía social"
            ariaLabel="Regla de energía"
            checked={energyOn}
            onToggle={(next) => {
              discardJson();
              setEnergyOn(next);
            }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Energía mínima"
                size="small"
                type="number"
                value={energyMin}
                onChange={(e) => {
                  discardJson();
                  setEnergyMin(e.target.value);
                }}
              />
              <TextField
                label="Energía máxima"
                size="small"
                type="number"
                value={energyMax}
                onChange={(e) => {
                  discardJson();
                  setEnergyMax(e.target.value);
                }}
              />
            </Box>
          </RuleRow>
        </SectionCard>

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Button
            size="small"
            onClick={() => setAdvancedOpen((open) => !open)}
            startIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ color: 'text.secondary' }}
          >
            {advancedOpen ? 'Cerrar editor avanzado' : 'Abrir editor avanzado'}
          </Button>
          {advancedOpen && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Reglas (JSON)"
                size="small"
                fullWidth
                multiline
                minRows={4}
                value={jsonText}
                error={Boolean(jsonError)}
                helperText={jsonError ?? 'Array de reglas en JSON.'}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                  discardJson();
                }}
              />
              <Button size="small" onClick={applyJson} sx={{ alignSelf: 'flex-start' }}>
                Aplicar JSON
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          px: 3,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          bgcolor: 'background.paper',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'grey.700',
            borderColor: 'grey.700',
            '&:hover': { borderColor: 'grey.700', backgroundColor: 'action.hover' },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: `linear-gradient(135deg, ${PASSION_RED} 0%, #7B1FA2 100%)`,
            boxShadow: '0 0 12px rgba(211,47,47,0.45)',
            '&:hover': {
              background: 'linear-gradient(135deg, #C62828 0%, #6A1B9A 100%)',
              boxShadow: '0 0 16px rgba(211,47,47,0.6)',
            },
          }}
        >
          {saving ? 'Guardando…' : 'Guardar reglas'}
        </Button>
      </Box>
    </>
  );
}

export default function RulesDrawer({
  open,
  saving = false,
  itemLabel,
  initial,
  instanceKey,
  onClose,
  onSave,
}: RulesDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          top: `${NAVBAR_HEIGHT}px`,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        },
        sx: {
          width: { xs: '100vw', sm: 440 },
          overflow: 'hidden',
        },
      }}
    >
      <RulesPanel
        key={instanceKey ?? 0}
        initial={initial ?? DEFAULT_MENU_CONFIG}
        saving={saving}
        itemLabel={itemLabel}
        onClose={onClose}
        onSave={onSave}
      />
    </Drawer>
  );
}

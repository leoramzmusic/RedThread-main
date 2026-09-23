import { Box, Button, Card, CardActionArea, CardContent, Collapse, Divider, Stack, TextField, Typography, IconButton, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { Check, ExpandMore, CompareArrows } from '@mui/icons-material';
import { useState } from 'react';
import {
  NAVBAR_STYLE_OPTIONS,
  NavbarStyleSpec,
  NavbarStyleId,
  FONT_WEIGHT_OPTIONS,
  HOVER_ANIMATION_OPTIONS,
} from './styles';

export interface NavbarStyleSelectorProps {
  draft: NavbarStyleSpec;
  saved: NavbarStyleSpec;
  onSelectStyle: (id: NavbarStyleId) => void;
  onChangeAdvanced: (patch: Partial<NavbarStyleSpec>) => void;
  onApply: () => void;
  onToggleCompare: () => void;
  showCompare: boolean;
}

const specEquals = (a: NavbarStyleSpec, b: NavbarStyleSpec) =>
  a.id === b.id && a.accent === b.accent && a.fontWeight === b.fontWeight && a.hoverAnimation === b.hoverAnimation;

export default function NavbarStyleSelector({
  draft, saved, onSelectStyle, onChangeAdvanced, onApply, onToggleCompare, showCompare,
}: NavbarStyleSelectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const applyDisabled = specEquals(draft, saved);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Estilo del navbar</Typography>
      <Stack spacing={1}>
        {NAVBAR_STYLE_OPTIONS.map((opt) => {
          const selected = draft.id === opt.id;
          return (
            <Card
              key={opt.id}
              variant={selected ? 'outlined' : 'elevation'}
              sx={{
                border: selected ? 2 : 1,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'transparent',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <CardActionArea onClick={() => onSelectStyle(opt.id)}>
                <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selected ? '✓ ' : ''}{opt.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{opt.description}</Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" disabled={applyDisabled} onClick={onApply}>
          Aplicar
        </Button>
        <Button
          variant="outlined"
          startIcon={<CompareArrows />}
          color={showCompare ? 'primary' : 'inherit'}
          onClick={onToggleCompare}
        >
          Comparar
        </Button>
      </Stack>

      {showCompare && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Comparando «{saved.label}» (actual) vs «{draft.label}» (seleccionado) en la vista previa.
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Box>
        <IconButton onClick={() => setAdvancedOpen((v) => !v)} aria-label="Configuración avanzada">
          <ExpandMore sx={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </IconButton>
        <Button onClick={() => setAdvancedOpen((v) => !v)} sx={{ textTransform: 'none' }}>Configuración avanzada</Button>
      </Box>

      <Collapse in={advancedOpen}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Color de acento</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={draft.accent}
              onChange={(_, v) => { if (v) onChangeAdvanced({ accent: v }); }}
              aria-label="Color de acento"
            >
              {['#E63946', '#3B82F6', '#16A34A', '#D97706', '#7F4CA5'].map((c) => (
                <ToggleButton key={c} value={c} aria-label={c} sx={{ p: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: c, border: '1px solid rgba(0,0,0,0.15)' }} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <TextField
            select
            label="Grosor tipográfico"
            size="small"
            value={draft.fontWeight}
            onChange={(e) => onChangeAdvanced({ fontWeight: e.target.value as NavbarStyleSpec['fontWeight'] })}
          >
            {FONT_WEIGHT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </TextField>
          <TextField
            select
            label="Animación de hover"
            size="small"
            value={draft.hoverAnimation}
            onChange={(e) => onChangeAdvanced({ hoverAnimation: e.target.value as NavbarStyleSpec['hoverAnimation'] })}
          >
            {HOVER_ANIMATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </TextField>
        </Stack>
      </Collapse>
    </Box>
  );
}
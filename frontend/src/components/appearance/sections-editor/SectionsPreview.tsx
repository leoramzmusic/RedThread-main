import { Box, Paper, Chip, Typography } from '@mui/material';
import { getSectionTitle, type LandingSection } from './types';
import type { Language } from '../navbar-editor/types';

interface SectionsPreviewProps {
  sections: LandingSection[];
  lang?: Language;
}

export default function SectionsPreview({ sections, lang = 'en' }: SectionsPreviewProps) {
  return (
    <Box data-testid="sections-preview">
      <Typography variant="subtitle2" gutterBottom>
        Vista previa en el landing
      </Typography>
      {sections.length === 0 ? (
        <Box
          sx={{
            border: '1.5px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            py: 6,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">No hay contenido aún</Typography>
        </Box>
      ) : (
        sections.map((section) => (
          <Paper
            key={section.id}
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 1,
              opacity: section.visible ? 1 : 0.55,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography fontWeight={600}>{getSectionTitle(section, lang)}</Typography>
            {!section.visible && <Chip size="small" label="Oculta" />}
          </Paper>
        ))
      )}
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Add, ViewWeek } from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType, Platform } from '../../../types/appearance';
import SectionsList from '../../../components/appearance/sections-editor/SectionsList';
import SectionDialog, { type SectionFormData } from '../../../components/appearance/sections-editor/SectionDialog';
import SectionsPreview from '../../../components/appearance/sections-editor/SectionsPreview';
import {
  mapResourceToSection,
  mapSectionToResource,
  type LandingSection,
} from '../../../components/appearance/sections-editor/types';
import { reorderSections, withOrder } from '../../../components/appearance/sections-editor/reorder';

interface Snack {
  msg: string;
  severity: 'success' | 'error';
}

const toMetadata = (section: LandingSection) =>
  mapSectionToResource({
    order: section.order,
    contentType: section.contentType,
    visible: section.visible,
    translations: section.translations,
  }).metadata;

export default function LandingSectionsPage() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LandingSection | null>(null);
  const [instanceKey, setInstanceKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<Snack | null>(null);

  const load = () => {
    appearanceService
      .getResources(AppearanceType.LANDING_SECTIONS)
      .then((resources) => {
        setSections(resources.map(mapResourceToSection).sort((a, b) => a.order - b.order));
      })
      .catch(() => setSnack({ msg: 'No se pudieron cargar las secciones', severity: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setInstanceKey((k) => k + 1);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    setEditing(sections.find((s) => s.id === id) ?? null);
    setInstanceKey((k) => k + 1);
    setDialogOpen(true);
  };

  const persistOrders = async (list: LandingSection[]) => {
    await Promise.all(
      list.map((s) => appearanceService.updateResource(s.id, { metadata: toMetadata(s) }))
    );
  };

  const handleSave = async (data: SectionFormData) => {
    setSaving(true);
    try {
      if (editing) {
        await appearanceService.updateResource(editing.id, {
          metadata: toMetadata({ ...editing, ...data }),
        });
        setSections((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
      } else {
        const order = sections.length;
        const resource = await appearanceService.createResource({
          ...mapSectionToResource({ order, visible: true, ...data }),
          platform: Platform.WEB,
        });
        setSections((prev) => [
          ...prev,
          { id: resource._id ?? '', order, visible: true, ...data },
        ]);
      }
      setDialogOpen(false);
      setSnack({ msg: 'Sección guardada', severity: 'success' });
    } catch {
      setSnack({ msg: 'Error al guardar la sección', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (from: number, to: number) => {
    const next = withOrder(reorderSections(sections, from, to));
    setSections(next);
    try {
      await persistOrders(next);
    } catch {
      setSnack({ msg: 'Error al guardar el orden', severity: 'error' });
      load();
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return;
    const next = { ...target, visible };
    setSections((prev) => prev.map((s) => (s.id === id ? next : s)));
    try {
      await appearanceService.updateResource(id, { metadata: toMetadata(next) });
    } catch {
      setSnack({ msg: 'Error al actualizar la visibilidad', severity: 'error' });
      load();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await appearanceService.deleteResource(id);
      const next = withOrder(sections.filter((s) => s.id !== id));
      setSections(next);
      if (next.length > 0) await persistOrders(next);
      setSnack({ msg: 'Sección eliminada', severity: 'success' });
    } catch {
      setSnack({ msg: 'Error al eliminar la sección', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Landing Page Sections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secciones modulares del landing: título, tipo de contenido, orden y visibilidad.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
            Agregar sección
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">
                Secciones ({sections.length})
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : sections.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <ViewWeek sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                    Aún no hay secciones
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Agrega la primera sección del landing para empezar.
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={openAdd}>
                    Agregar sección
                  </Button>
                </Box>
              ) : (
                <SectionsList
                  sections={sections}
                  onReorder={handleReorder}
                  onToggleVisible={handleToggleVisible}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2 }}>
              <SectionsPreview sections={sections} />
            </Paper>
          </Grid>
        </Grid>

        <SectionDialog
          open={dialogOpen}
          saving={saving}
          initial={editing}
          instanceKey={instanceKey}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />

        <Snackbar
          open={!!snack}
          autoHideDuration={4000}
          onClose={() => setSnack(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)}>
            {snack?.msg}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
}

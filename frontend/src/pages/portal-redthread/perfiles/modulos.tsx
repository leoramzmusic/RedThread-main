import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
    Tune as TuneIcon,
    Sync as SyncIcon,
    Settings as SettingsIcon,
    Save as SaveIcon,
    PlayArrow as PlayArrowIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Lock as LockIcon,
    PhotoCamera as PhotoIcon,
    Person as PersonIcon,
    MusicNote as MusicIcon,
    LocationOn as LocationIcon,
    Favorite as HeartIcon,
    Star as StarIcon,
    Palette as PaletteIcon,
    Translate as LanguageIcon,
    Work as WorkIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'next-i18next';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';
import { getModulePoints } from '../../../utils/profileScoring';

interface ProfileModule {
    key: string;
    nombre: string;
    descripcion: string;
    icono: string;
    orden: number;
    visible: boolean;
    origen: 'core' | 'integracion';
    requiere_premium: boolean;
}

interface Snack {
    msg: string;
    severity: 'success' | 'error';
}

interface ModuleForm {
    key: string;
    nombre: string;
    descripcion: string;
    icono: string;
}

const BASE = '/portal-redthread/profile-modules';
const EMPTY_FORM: ModuleForm = { key: '', nombre: '', descripcion: '', icono: '' };

// Sub-módulo → provider de integración (extensible: apple_music, youtube…)
const INTEGRATION_BY_MODULE: Record<string, string> = {
    'section-music-spotify': 'spotify',
};

// Hijos de un módulo contenedor (ej. section-music → spotify + genres)
const childModulesOf = (all: ProfileModule[], parentKey: string): ProfileModule[] =>
    all.filter((m) => m.key !== parentKey && m.key.startsWith(`${parentKey}-`));

const isChildModule = (all: ProfileModule[], key: string): boolean => {
    const parent = key.split('-').slice(0, -1).join('-');
    return all.some((m) => m.key === parent);
};
const INTEGRATIONS_BASE = '/portal-redthread/integraciones';

interface IntegrationStatus {
    provider: string;
    display_name: string;
    client_id?: string | null;
    has_client_id: boolean;
    has_secret: boolean;
    redirect_uri: string | null;
    scopes: string[];
    enabled: boolean;
    fallback_complete: boolean;
    status: 'pending' | 'ok' | 'blocked_premium_required' | 'error';
    status_detail: string | null;
}

interface IntegrationForm {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    scopes: string;
    enabled: boolean;
    fallback_complete: boolean;
}

// Valores por defecto (mismo seed del backend). Se usan para rellenar la BD
// desde el admin cuando la colección está vacía, sin depender del arranque.
const DEFAULT_MODULES: Array<{
    key: string;
    nombre: string;
    origen: 'core' | 'integracion';
    orden: number;
}> = [
        { orden: 0, key: 'section-photos', nombre: 'Fotos', origen: 'core' },
        { orden: 1, key: 'section-basic', nombre: 'Identidad', origen: 'core' },
        { orden: 2, key: 'section-location', nombre: 'Ubicación', origen: 'core' },
        { orden: 3, key: 'section-aboutme', nombre: 'Sobre mí', origen: 'core' },
        { orden: 4, key: 'section-goals', nombre: 'Objetivos', origen: 'core' },
        { orden: 5, key: 'section-interests', nombre: 'Intereses', origen: 'core' },
        { orden: 6, key: 'section-pronouns', nombre: 'Pronombres', origen: 'core' },
        { orden: 7, key: 'section-additional', nombre: 'Datos adicionales', origen: 'core' },
        { orden: 8, key: 'section-professional', nombre: 'Profesional', origen: 'core' },
        { orden: 9, key: 'section-music', nombre: 'Música', origen: 'integracion' },
        { orden: 10, key: 'section-identity', nombre: 'Identidad', origen: 'core' },
        { orden: 11, key: 'section-personality', nombre: 'Personalidad', origen: 'core' },
        { orden: 12, key: 'section-cognitive', nombre: 'Cognitivo', origen: 'core' },
        { orden: 13, key: 'section-wellness', nombre: 'Bienestar', origen: 'core' },
        { orden: 14, key: 'section-status', nombre: 'Estado civil', origen: 'core' },
        { orden: 15, key: 'section-languages', nombre: 'Idiomas', origen: 'core' },
    ];

function isForbidden(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response;
        return response?.status === 403;
    }
    return false;
}

export default function ModulosPerfilesPage() {
    const { t } = useTranslation('common');
    const [modules, setModules] = useState<ProfileModule[]>([]);
    // Snapshot persistido: los toggles/reorden solo tocan el borrador local
    // y se aplican al backend con el botón Guardar.
    const [savedModules, setSavedModules] = useState<ProfileModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [snack, setSnack] = useState<Snack | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [form, setForm] = useState<ModuleForm>(EMPTY_FORM);
    // Integraciones (origen === 'integracion'): estado + diálogo de config
    const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});
    const [configProvider, setConfigProvider] = useState<string | null>(null);
    // Si el admin escribe en el campo, se envía; si no, se muestra enmascarado
    const [secretTouched, setSecretTouched] = useState(false);
    const storedHasSecret = configProvider
        ? Boolean(integrations[configProvider]?.has_secret)
        : false;
    const [configForm, setConfigForm] = useState<IntegrationForm>({
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        scopes: '',
        enabled: true,
        fallback_complete: true,
    });
    const [testing, setTesting] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const loadIntegrations = async () => {
        try {
            const res = await adminApiClient.get(`${INTEGRATIONS_BASE}/`);
            const list = Array.isArray(res.data) ? (res.data as IntegrationStatus[]) : [];
            const map: Record<string, IntegrationStatus> = {};
            list.forEach((i) => {
                map[i.provider] = i;
            });
            setIntegrations(map);
        } catch {
            // Sin permiso o backend viejo: se oculta el UI de integración
            setIntegrations({});
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            // Slash final obligatorio: el backend tiene redirect_slashes=False
            const res = await adminApiClient.get(`${BASE}/`);
            const list = Array.isArray(res.data) ? (res.data as ProfileModule[]) : [];
            const sorted = [...list].sort((a, b) => a.orden - b.orden);
            setModules(sorted);
            setSavedModules(sorted.map((m) => ({ ...m })));
            await loadIntegrations();
        } catch (err) {
            if (isForbidden(err)) {
                setReadOnly(true);
                setSnack({ msg: t('profileModules.readOnly', 'Sin permiso de gestión — modo lectura'), severity: 'error' });
            } else {
                setSnack({ msg: t('profileModules.loadError', 'No se pudieron cargar los módulos'), severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTestIntegration = async (
        provider: string,
        dryRun?: { client_id?: string; client_secret?: string },
    ) => {
        if (readOnly) return;
        setTesting(provider);
        try {
            // Dry-run: prueba los valores del formulario SIN guardar.
            // Sin body: prueba lo guardado en BD (nunca la sesión del admin).
            const body: Record<string, string> = {};
            if (dryRun?.client_id?.trim()) body.client_id = dryRun.client_id.trim();
            if (dryRun?.client_secret) body.client_secret = dryRun.client_secret;
            const res = await adminApiClient.post(
                `${INTEGRATIONS_BASE}/${provider}/test`,
                body,
            );
            const ok = Boolean(res?.data?.ok);
            const detail = res?.data?.message ? `: ${res.data.message}` : '';
            const blocked = res?.data?.status === 'blocked_premium_required';
            setSnack({
                msg: ok
                    ? t('profileModules.testOk', 'Conexión válida: la integración responde.')
                    : blocked
                        ? t(
                            'profileModules.testBlocked',
                            'Bloqueada: Spotify requiere Premium para Web API.',
                        )
                        : `${t('profileModules.testFailBase', 'Falló la prueba')}${detail}`,
                severity: ok ? 'success' : 'error',
            });
            await loadIntegrations();
        } catch (err) {
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: t('profileModules.saveError', 'Error al guardar los cambios'), severity: 'error' });
        } finally {
            setTesting(null);
        }
    };

    const openIntegrationConfig = async (provider: string) => {
        setSecretTouched(false);
        // Pre-rellena SIEMPRE desde BD (GET admin); el secret nunca viaja,
        // se deja vacío (vacío = conservar). Nada sale de la sesión local.
        const fallback = integrations[provider];
        setConfigForm({
            client_id: '',
            client_secret: '',
            redirect_uri: fallback?.redirect_uri ?? '',
            scopes: (fallback?.scopes ?? []).join(', '),
            enabled: fallback?.enabled ?? true,
            fallback_complete: fallback?.fallback_complete ?? true,
        });
        setConfigProvider(provider);
        try {
            const res = await adminApiClient.get(`${INTEGRATIONS_BASE}/${provider}`);
            const cfg = res?.data as IntegrationStatus | undefined;
            if (cfg) {
                if (cfg.provider) {
                    setIntegrations((cur) => ({ ...cur, [cfg.provider]: cfg }));
                }
                setConfigForm({
                    client_id: (cfg as any).client_id ?? '',
                    client_secret: '',
                    redirect_uri: (cfg as any).redirect_uri ?? '',
                    scopes: ((cfg as any).scopes ?? []).join(', '),
                    enabled: (cfg as any).enabled ?? true,
                    fallback_complete: (cfg as any).fallback_complete ?? true,
                });
            }
        } catch {
            // Si falla el GET, se conserva lo conocido; el PUT hará upsert
        }
    };

    const handleSaveIntegrationConfig = async () => {
        if (!configProvider || readOnly) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                redirect_uri: configForm.redirect_uri.trim() || null,
                scopes: configForm.scopes
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                enabled: configForm.enabled,
                fallback_complete: configForm.fallback_complete,
            };
            if (configForm.client_id.trim()) payload.client_id = configForm.client_id.trim();
            if (configForm.client_secret) payload.client_secret = configForm.client_secret;
            await adminApiClient.put(`${INTEGRATIONS_BASE}/${configProvider}`, payload);
            setSnack({ msg: t('profileModules.integrationSaved', 'Configuración guardada correctamente'), severity: 'success' });
            setSecretTouched(false);
            setConfigProvider(null);
            await loadIntegrations();
        } catch (err) {
            if (isForbidden(err)) {
                setConfigProvider(null);
                handleForbidden();
            } else {
                setSnack({ msg: t('profileModules.saveError', 'Error al guardar los cambios'), severity: 'error' });
            }
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleForbidden = () => {
        setReadOnly(true);
        setSnack({ msg: t('profileModules.readOnly', 'Sin permiso de gestión — modo lectura'), severity: 'error' });
    };

    // Borrador local: el toggle solo marca, Guardar lo aplica en el backend.
    const handleToggle = (mod: ProfileModule, visible: boolean) => {
        if (readOnly) return;
        setModules((cur) => cur.map((m) => (m.key === mod.key ? { ...m, visible } : m)));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (readOnly) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = modules.findIndex((m) => m.key === active.id);
        const newIndex = modules.findIndex((m) => m.key === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setModules(arrayMove(modules, oldIndex, newIndex));
    };

    // ¿Hay cambios sin guardar? (visibilidad u orden)
    const dirty =
        modules.length !== savedModules.length ||
        modules.some((m, i) => {
            const s = savedModules[i];
            return !s || s.key !== m.key || s.visible !== m.visible;
        });

    const resetDraft = () => {
        setModules(savedModules.map((m) => ({ ...m })));
    };

    const handleSaveAll = async () => {
        if (readOnly || !dirty || saving) return;
        setSaving(true);
        try {
            // 1. Visibilidades cambiadas
            const prevVisible = new Map(savedModules.map((m) => [m.key, m.visible]));
            for (const m of modules) {
                if (prevVisible.has(m.key) && prevVisible.get(m.key) !== m.visible) {
                    await adminApiClient.patch(`${BASE}/${m.key}/visibilidad`, {
                        visible: m.visible,
                    });
                }
            }
            // 2. Orden si cambió la secuencia de keys
            const prevOrder = savedModules.map((m) => m.key).join(',');
            const nextOrder = modules.map((m) => m.key).join(',');
            if (prevOrder !== nextOrder) {
                await adminApiClient.put(`${BASE}/reorden`, {
                    keys: modules.map((m) => m.key),
                });
            }
            setSavedModules(modules.map((m) => ({ ...m })));
            setSnack({
                msg: t('profileModules.allSaved', 'Cambios guardados y aplicados'),
                severity: 'success',
            });
        } catch (err) {
            if (isForbidden(err)) handleForbidden();
            else
                setSnack({
                    msg: t(
                        'profileModules.saveErrorDetail',
                        'No se pudieron aplicar los cambios (revisa permisos o que quede un core visible).',
                    ),
                    severity: 'error',
                });
            await load();
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setEditingKey(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (mod: ProfileModule) => {
        setEditingKey(mod.key);
        setForm({ key: mod.key, nombre: mod.nombre, descripcion: mod.descripcion ?? '', icono: mod.icono ?? '' });
        setDialogOpen(true);
    };

    const handleSaveDialog = async () => {
        if (readOnly) return;
        if (!form.nombre.trim() || (!editingKey && !form.key.trim())) {
            setSnack({ msg: t('profileModules.requiredFields', 'Nombre y clave son obligatorios'), severity: 'error' });
            return;
        }
        setSaving(true);
        try {
            if (editingKey) {
                await adminApiClient.patch(`${BASE}/${editingKey}`, {
                    nombre: form.nombre.trim(),
                    descripcion: form.descripcion.trim(),
                    icono: form.icono.trim(),
                });
                setSnack({ msg: t('profileModules.updated', 'Módulo actualizado'), severity: 'success' });
            } else {
                await adminApiClient.post(BASE, {
                    key: form.key.trim(),
                    nombre: form.nombre.trim(),
                    descripcion: form.descripcion.trim(),
                    icono: form.icono.trim(),
                });
                setSnack({ msg: t('profileModules.created', 'Módulo creado'), severity: 'success' });
            }
            setDialogOpen(false);
            await load();
        } catch (err) {
            if (isForbidden(err)) {
                setDialogOpen(false);
                handleForbidden();
            } else {
                setSnack({ msg: t('profileModules.saveError', 'Error al guardar los cambios'), severity: 'error' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (readOnly) return;
        setSaving(true);
        let created = 0;
        try {
            for (const m of DEFAULT_MODULES) {
                try {
                    await adminApiClient.post(`${BASE}/`, {
                        key: m.key,
                        nombre: m.nombre,
                        descripcion: '',
                        icono: 'tune',
                        orden: m.orden,
                    });
                    created += 1;
                } catch (err) {
                    if (isForbidden(err)) {
                        handleForbidden();
                        return;
                    }
                    // 400 = ya existe (seed parcial previo): se sigue con el resto
                }
            }
            setSnack({
                msg: `${t('profileModules.seededBase', 'Se cargaron')} ${created} ${t(
                    'profileModules.seededBase2',
                    'módulos por defecto',
                )}`,
                severity: 'success',
            });
            await load();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Container maxWidth="xl">
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={32} />
                    </Box>
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="xl">
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TuneIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                {t('profileModules.title', 'Módulos de perfiles')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('profileModules.subtitle', 'Gestiona los módulos visibles en los perfiles: visibilidad, orden y contenido.')}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {dirty && !readOnly && (
                            <Chip
                                size="small"
                                label={t('profileModules.unsaved', 'Cambios sin guardar')}
                                color="warning"
                                variant="outlined"
                            />
                        )}
                        {saving && (
                            <Chip
                                size="small"
                                icon={<CircularProgress size={14} color="inherit" />}
                                label={t('profileModules.saving', 'Guardando…')}
                                variant="outlined"
                            />
                        )}
                        {dirty && !readOnly && (
                            <Button onClick={resetDraft} disabled={saving}>
                                {t('profileModules.discard', 'Descartar')}
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={() => void handleSaveAll()}
                            disabled={!dirty || saving || readOnly}
                        >
                            {t('profileModules.saveAll', 'Guardar')}
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={readOnly}>
                            {t('profileModules.new', 'Nuevo módulo')}
                        </Button>
                    </Box>
                </Box>

                {readOnly && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {t('profileModules.readOnly', 'Sin permiso de gestión — modo lectura')}
                    </Alert>
                )}

                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">
                            {t('profileModules.countLabel', 'Módulos')} ({modules.length})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('profileModules.dragHint', 'Arrastra para reordenar')}
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {modules.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                            <TuneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary" gutterBottom>
                                {t('profileModules.empty', 'No hay módulos configurados')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {t(
                                    'profileModules.emptyHint',
                                    'Carga las 16 secciones base del perfil con un clic.',
                                )}
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => void handleSeedDefaults()}
                                disabled={saving || readOnly}
                            >
                                {t('profileModules.seedDefaults', 'Cargar valores por defecto')}
                            </Button>
                        </Box>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
                            <SortableContext items={modules.map((m) => m.key)} strategy={verticalListSortingStrategy}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {modules.map((mod) => {
                                        const provider = INTEGRATION_BY_MODULE[mod.key];
                                        const children = childModulesOf(modules, mod.key);
                                        const totalPts =
                                            getModulePoints(mod.key) +
                                            children.reduce((s, c) => s + getModulePoints(c.key), 0);
                                        const integration = provider
                                            ? (integrations[provider] ?? {
                                                provider,
                                                display_name: provider,
                                                has_client_id: false,
                                                has_secret: false,
                                                redirect_uri: null,
                                                scopes: [],
                                                enabled: true,
                                                fallback_complete: true,
                                                status: 'pending' as const,
                                                status_detail: null,
                                            })
                                            : undefined;
                                        return (
                                            <SortableModuleRow
                                                key={mod.key}
                                                mod={mod}
                                                disabled={readOnly}
                                                points={totalPts}
                                                indented={isChildModule(modules, mod.key)}
                                                onToggle={(visible) => void handleToggle(mod, visible)}
                                                onEdit={() => openEdit(mod)}
                                                integration={integration}
                                                testing={provider ? testing === provider : false}
                                                onTest={provider ? () => void handleTestIntegration(provider) : undefined}
                                                onConfig={provider ? () => void openIntegrationConfig(provider) : undefined}
                                            />
                                        );
                                    })}
                                </Box>
                            </SortableContext>
                        </DndContext>
                    )}
                </Paper>

                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingKey
                            ? t('profileModules.editTitle', 'Editar módulo')
                            : t('profileModules.createTitle', 'Nuevo módulo')}
                    </DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label={t('profileModules.fieldKey', 'Clave')}
                            value={form.key}
                            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                            disabled={!!editingKey || readOnly}
                            helperText={editingKey ? undefined : t('profileModules.keyHint', 'Identificador único, solo se define al crear.')}
                            fullWidth
                            sx={{ mt: 1 }}
                        />
                        <TextField
                            label={t('profileModules.fieldName', 'Nombre')}
                            value={form.nombre}
                            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                            disabled={readOnly}
                            fullWidth
                        />
                        <TextField
                            label={t('profileModules.fieldDescription', 'Descripción')}
                            value={form.descripcion}
                            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                            disabled={readOnly}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        <TextField
                            label={t('profileModules.fieldIcon', 'Icono')}
                            value={form.icono}
                            onChange={(e) => setForm((f) => ({ ...f, icono: e.target.value }))}
                            disabled={readOnly}
                            fullWidth
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)} disabled={saving}>
                            {t('profileModules.cancel', 'Cancelar')}
                        </Button>
                        <Button variant="contained" onClick={() => void handleSaveDialog()} disabled={saving || readOnly}>
                            {t('profileModules.save', 'Guardar')}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={!!configProvider} onClose={() => setConfigProvider(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {t('profileModules.integrationTitle', 'Integración')}:{' '}
                        {configProvider
                            ? (integrations[configProvider]?.display_name ?? configProvider)
                            : ''}
                    </DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {t('profileModules.cardCredentials', 'Credenciales')}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label={t('profileModules.fieldClientId', 'Client ID (Spotify Developer)')}
                                    value={configForm.client_id}
                                    onChange={(e) => setConfigForm((f) => ({ ...f, client_id: e.target.value }))}
                                    disabled={readOnly}
                                    autoComplete="off"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'grey.900',
                                            color: 'grey.100',
                                        },
                                        '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.85rem' },
                                    }}
                                />
                                <TextField
                                    label={t('profileModules.fieldClientSecret', 'Client Secret (vacío = conservar)')}
                                    value={
                                        secretTouched || !storedHasSecret
                                            ? configForm.client_secret
                                            : '••••••••••••'
                                    }
                                    onChange={(e) => {
                                        setSecretTouched(true);
                                        setConfigForm((f) => ({ ...f, client_secret: e.target.value }));
                                    }}
                                    onFocus={(e) => {
                                        // Al enfocar un valor enmascarado se limpia para escribir el nuevo
                                        if (!secretTouched && storedHasSecret) {
                                            setSecretTouched(true);
                                            setConfigForm((f) => ({ ...f, client_secret: '' }));
                                            requestAnimationFrame(() => e.target.select());
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // Si sale vacío, vuelve a la vista enmascarada
                                        if (!e.target.value && storedHasSecret) {
                                            setSecretTouched(false);
                                        }
                                    }}
                                    disabled={readOnly}
                                    type="password"
                                    autoComplete="new-password"
                                    helperText={
                                        storedHasSecret && !secretTouched
                                            ? t(
                                                'profileModules.secretStored',
                                                'Hay un secret guardado (oculto por seguridad).',
                                            )
                                            : undefined
                                    }
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'grey.900',
                                            color: 'grey.100',
                                        },
                                        '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.85rem' },
                                    }}
                                />
                                <TextField
                                    label={t('profileModules.fieldRedirectUri', 'Redirect URI')}
                                    value={configForm.redirect_uri}
                                    onChange={(e) => setConfigForm((f) => ({ ...f, redirect_uri: e.target.value }))}
                                    disabled={readOnly}
                                    autoComplete="off"
                                    placeholder="http://127.0.0.1:8000/callback"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'grey.900',
                                            color: 'grey.100',
                                        },
                                        '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.85rem' },
                                    }}
                                />
                            </Box>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {t('profileModules.cardScopes', 'Scopes')}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TextField
                                label={t('profileModules.fieldScopes', 'Scopes (separados por coma)')}
                                value={configForm.scopes}
                                onChange={(e) => setConfigForm((f) => ({ ...f, scopes: e.target.value }))}
                                disabled={readOnly}
                                autoComplete="off"
                                placeholder="user-read-private, user-read-email"
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'grey.900',
                                        color: 'grey.100',
                                    },
                                    '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.85rem' },
                                }}
                            />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {t('profileModules.cardOptions', 'Opciones')}
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Tooltip
                                title={t(
                                    'profileModules.enabledHint',
                                    'Si está activo, la integración se usará en perfiles.',
                                )}
                                arrow
                                placement="right"
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            color="success"
                                            checked={configForm.enabled}
                                            onChange={(e) => setConfigForm((f) => ({ ...f, enabled: e.target.checked }))}
                                            disabled={readOnly}
                                        />
                                    }
                                    label={t('profileModules.fieldEnabled', 'Integración activa')}
                                    sx={{ '& .MuiFormControlLabel-label': { fontWeight: 600, fontSize: '0.85rem' } }}
                                />
                            </Tooltip>
                            <Tooltip
                                title={t(
                                    'profileModules.fallbackHint',
                                    'Si está activo, la sección cuenta como completa aunque el usuario no conecte.',
                                )}
                                arrow
                                placement="right"
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            color="success"
                                            checked={configForm.fallback_complete}
                                            onChange={(e) => setConfigForm((f) => ({ ...f, fallback_complete: e.target.checked }))}
                                            disabled={readOnly}
                                        />
                                    }
                                    label={t(
                                        'profileModules.fieldFallback',
                                        'Contar como completo aunque no conecte (evita perfiles bloqueados)',
                                    )}
                                    sx={{ '& .MuiFormControlLabel-label': { fontWeight: 600, fontSize: '0.85rem' } }}
                                />
                            </Tooltip>
                        </Paper>
                        {configProvider && (
                            <Alert severity="info">
                                {t(
                                    'profileModules.configHint',
                                    'Guarda y luego usa Probar conexión para validar contra Spotify.',
                                )}
                            </Alert>
                        )}
                        <Alert severity="info" icon={false}>
                            <Typography variant="body2">
                                {t(
                                    'profileModules.freeNote',
                                    'Usuarios con cuenta Free podrán conectar para coincidencias musicales, pero no usar funciones de reproducción.',
                                )}
                            </Typography>
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => setConfigProvider(null)}
                            disabled={saving}
                            sx={{ flex: 1, fontWeight: 600, borderRadius: 2, textTransform: 'none' }}
                        >
                            {t('profileModules.cancel', 'Cancelar')}
                        </Button>
                        {configProvider && (
                            <Button
                                variant="contained"
                                startIcon={
                                    testing === configProvider ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <PlayArrowIcon />
                                    )
                                }
                                onClick={() =>
                                    void handleTestIntegration(configProvider, {
                                        client_id: configForm.client_id,
                                        client_secret: configForm.client_secret,
                                    })
                                }
                                disabled={saving || testing !== null || readOnly}
                                sx={{
                                    flex: 1,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    bgcolor: '#65D46E',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#4FB957' },
                                }}
                            >
                                {t('profileModules.testConn', 'Probar conexión')}
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => void handleSaveIntegrationConfig()}
                            disabled={saving || readOnly}
                            sx={{
                                flex: 1,
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: 'none',
                                bgcolor: '#4090F7',
                                color: '#fff',
                                '&:hover': { bgcolor: '#2F7DE0' },
                            }}
                        >
                            {t('profileModules.save', 'Guardar')}
                        </Button>
                    </DialogActions>
                </Dialog>

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

interface SortableModuleRowProps {
    mod: ProfileModule;
    disabled: boolean;
    onToggle: (visible: boolean) => void;
    onEdit: () => void;
    integration?: IntegrationStatus | null;
    testing?: boolean;
    onTest?: () => void;
    onConfig?: () => void;
}

function integrationChip(integration: IntegrationStatus | null | undefined, t: (k: string, f: string) => string) {
    if (!integration) return null;
    if (!integration.enabled) {
        return <Chip size="small" label={t('profileModules.intDisabled', 'Integración apagada')} sx={{ fontSize: '0.7rem', height: 22 }} />;
    }
    if (integration.status === 'ok') {
        return <Chip size="small" label={t('profileModules.intOk', 'Integración activa')} color="success" sx={{ fontSize: '0.7rem', height: 22, fontWeight: 700 }} />;
    }
    if (integration.status === 'blocked_premium_required') {
        return (
            <Tooltip
                title={t(
                    'profileModules.intBlockedTip',
                    'Tu aplicación está bloqueada por Spotify. Requiere cuenta Premium para acceder al Web API.',
                )}
                arrow
            >
                <Chip
                    size="small"
                    icon={<LockIcon sx={{ fontSize: 14 }} />}
                    label={t('profileModules.intBlocked', 'Bloqueada (requiere Premium)')}
                    color="error"
                    sx={{ fontSize: '0.7rem', height: 22, fontWeight: 700 }}
                />
            </Tooltip>
        );
    }
    if (integration.status === 'error') {
        return <Chip size="small" label={t('profileModules.intError', 'Error de credenciales o redirect URI')} color="default" sx={{ fontSize: '0.7rem', height: 22, fontWeight: 700 }} />;
    }
    return <Chip size="small" label={t('profileModules.intPending', 'Integración pendiente')} color="warning" sx={{ fontSize: '0.7rem', height: 22 }} />;
}

function SortableModuleRow({ mod, disabled, onToggle, onEdit, integration, testing, onTest, onConfig, points: pointsProp, indented }: SortableModuleRowProps & { points?: number; indented?: boolean }) {
    const { t } = useTranslation('common');
    const pts = pointsProp ?? getModulePoints(mod.key);
    const points = pts;
    const ptsSuffix = pts > 0 ? (mod.visible ? ` (−${pts} pts)` : ` (+${pts} pts)`) : '';
    const impactTip =
        (mod.visible
            ? `${t('profileModules.hideAction', 'Ocultar')} ${mod.nombre}: ${t(
                'profileModules.noCountProgress',
                'ya no contará para el progreso',
            )}`
            : `${t('profileModules.showAction', 'Mostrar')} ${mod.nombre}: ${t(
                'profileModules.countsProgress',
                'volverá a contar para el progreso',
            )}`) + ptsSuffix;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.key, disabled });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <Box ref={setNodeRef} style={style} sx={indented ? { ml: { xs: 2, sm: 4 } } : undefined}>
            <Paper
                elevation={isDragging ? 4 : 1}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: mod.visible ? '4px solid #4CAF50' : '4px solid #9E9E9E',
                    transition: 'background-color 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-1px)',
                    },
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
            >
                {!disabled && (
                    <Box {...attributes} {...listeners} sx={{ display: 'flex', cursor: 'grab' }}>
                        <DragIndicatorIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
                    </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {mod.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {mod.key}
                        </Typography>
                        {mod.icono && (
                            <Chip size="small" label={mod.icono} variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                        )}
                    </Box>
                    {mod.descripcion && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {mod.descripcion}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                            size="small"
                            label={mod.origen === 'core' ? 'Core' : 'Integración'}
                            color={mod.origen === 'core' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                        {mod.requiere_premium && (
                            <Chip size="small" label="Premium" color="warning" sx={{ fontSize: '0.7rem', height: 22 }} />
                        )}
                        {integrationChip(integration, t as (k: string, f: string) => string)}
                        <Chip
                            size="small"
                            label={
                                mod.visible
                                    ? t('profileModules.statusOn', 'Activo')
                                    : t('profileModules.statusOff', 'Oculto')
                            }
                            color={mod.visible ? 'success' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 22, fontWeight: 700 }}
                        />
                        {points > 0 && (
                            <Tooltip
                                title={t(
                                    'profileModules.pointsHint',
                                    'Puntos que aporta esta sección al progreso del perfil',
                                )}
                                arrow
                            >
                                <Chip
                                    size="small"
                                    label={`${points} pts`}
                                    sx={{
                                        fontSize: '0.7rem',
                                        height: 22,
                                        fontWeight: 800,
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title={impactTip} arrow>
                        <Switch
                            size="small"
                            checked={mod.visible}
                            onChange={(e) => onToggle(e.target.checked)}
                            disabled={disabled}
                            sx={{
                                '& .MuiSwitch-switchBase, & .MuiSwitch-thumb, & .MuiSwitch-track': {
                                    transition: 'all 0.2s ease-out',
                                },
                            }}
                        />
                    </Tooltip>
                    <Tooltip title={t('profileModules.edit', 'Editar')}>
                        <IconButton size="small" onClick={onEdit} disabled={disabled}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    {integration && onTest && (
                        <Tooltip
                            title={t(
                                'profileModules.testConnTip',
                                'Valida las credenciales contra Spotify (depende del tipo de cuenta).',
                            )}
                            arrow
                        >
                            <IconButton size="small" onClick={onTest} disabled={disabled || testing}>
                                <PlayArrowIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {integration && onConfig && (
                        <Tooltip title={t('profileModules.configure', 'Configurar integración')}>
                            <IconButton size="small" onClick={onConfig} disabled={disabled}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

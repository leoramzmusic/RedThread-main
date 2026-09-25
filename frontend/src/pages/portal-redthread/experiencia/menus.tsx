import { useEffect, useState } from 'react';
import {
    Box,
    Chip,
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    MenuItem,
    Button,
    Divider,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType, type AppearanceResource } from '../../../types/appearance';
import MenuCard from '../../../components/experience/menus-editor/MenuCard';
import RulesDrawer from '../../../components/experience/menus-editor/RulesDrawer';
import MenusPreview from '../../../components/experience/menus-editor/MenusPreview';
import {
    DEFAULT_MENU_CONFIG,
    MENU_STATUSES,
    mergeWithDefaults,
    mapResourceToUserMenus,
    mapUserMenusToResource,
    withSnapshot,
    type MenuConfig,
    type MenuSnapshot,
    type MenuStatus,
    type UserMenusMetadata,
} from '../../../components/experience/menus-editor/types';
import { USER_MENU_ITEMS, defaultUserMenus, type UserMenuItemDef } from '../../../components/experience/menus-editor/userMenuItems';
import {
    filterMenuItemDefs,
    type PreviewContext,
    type PreviewDevice,
} from '../../../components/experience/menus-editor/visibility';

interface Snack {
    msg: string;
    severity: 'success' | 'error';
}

export default function MenusExperienciaPage() {
    const [metadata, setMetadata] = useState<UserMenusMetadata | null>(null);
    const [resourceId, setResourceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState<Snack | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerItem, setDrawerItem] = useState<UserMenuItemDef | null>(null);
    const [drawerKey, setDrawerKey] = useState(0);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<MenuStatus | 'all'>('all');
    const [ctx, setCtx] = useState<PreviewContext>({ role: 'free', country: 'MX', language: 'es', energy: 3 });
    const [device, setDevice] = useState<PreviewDevice>('desktop');

    const load = () => {
        appearanceService
            .getResources(AppearanceType.USER_MENUS)
            .then((resources) => {
                const resource = resources[0];
                if (resource) {
                    setResourceId(resource._id ?? null);
                    setMetadata(mergeWithDefaults(mapResourceToUserMenus(resource), defaultUserMenus()));
                } else {
                    setMetadata(defaultUserMenus());
                }
            })
            .catch(() => {
                setMetadata(defaultUserMenus());
                setSnack({ msg: 'No se pudieron cargar los menús', severity: 'error' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading || !metadata) {
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

    const configFor = (id: string): MenuConfig => metadata.menus[id] ?? { ...DEFAULT_MENU_CONFIG };

    const itemLabel = (id: string): string => USER_MENU_ITEMS.find((item) => item.id === id)?.label ?? id;

    const persist = async (next: UserMenusMetadata, label: string) => {
        const snapshotted = withSnapshot(metadata, label);
        const toSave: UserMenusMetadata = { menus: next.menus, snapshots: snapshotted.snapshots };
        setMetadata(toSave);
        setSaving(true);
        try {
            const resource = mapUserMenusToResource(toSave);
            if (resourceId) {
                await appearanceService.updateResource(resourceId, { metadata: resource.metadata });
            } else {
                const created = await appearanceService.createResource(resource as AppearanceResource);
                setResourceId(created._id ?? null);
            }
            setSnack({ msg: 'Cambios guardados', severity: 'success' });
        } catch {
            setSnack({ msg: 'Error al guardar los menús', severity: 'error' });
            load();
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (id: string, visible: boolean) => {
        void persist(
            { ...metadata, menus: { ...metadata.menus, [id]: { ...configFor(id), visible } } },
            `Visibilidad: ${itemLabel(id)} ${visible ? 'activada' : 'desactivada'}`
        );
    };

    const handleSaveRules = (id: string, config: MenuConfig) => {
        setDrawerOpen(false);
        void persist({ ...metadata, menus: { ...metadata.menus, [id]: config } }, `Reglas: ${itemLabel(id)}`);
    };

    const handleRestore = (snapshot: MenuSnapshot) => {
        const restored: UserMenusMetadata = {
            menus: JSON.parse(JSON.stringify(snapshot.menus)) as Record<string, MenuConfig>,
            snapshots: metadata.snapshots,
        };
        void persist(restored, `Restaurado: ${snapshot.label}`);
    };

    const filtered = filterMenuItemDefs(USER_MENU_ITEMS, metadata, query, statusFilter);

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
                        <MenuIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                Gestión de Menús del Portal
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Visibilidad, estados, roles y reglas condicionales del sidebar del usuario.
                            </Typography>
                        </Box>
                    </Box>
                    {saving && (
                        <Chip
                            size="small"
                            icon={<CircularProgress size={14} color="inherit" />}
                            label="Guardando…"
                            variant="outlined"
                        />
                    )}
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle2">Módulos ({filtered.length})</Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField
                                        size="small"
                                        label="Buscar módulo"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        sx={{ minWidth: 220 }}
                                    />
                                    <TextField
                                        select
                                        size="small"
                                        label="Estado"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as MenuStatus | 'all')}
                                        sx={{ minWidth: 170 }}
                                    >
                                        <MenuItem value="all">Todos</MenuItem>
                                        {MENU_STATUSES.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {filtered.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                                    <Typography color="text.secondary" gutterBottom>
                                        No hay módulos que coincidan
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ajusta la búsqueda o el filtro de estado.
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {filtered.map((item) => (
                                        <Grid item xs={12} sm={6} key={item.id}>
                                            <MenuCard
                                                id={item.id}
                                                label={item.label}
                                                config={configFor(item.id)}
                                                onToggleVisible={(visible) => handleToggle(item.id, visible)}
                                                onOpenRules={() => {
                                                    setDrawerItem(item);
                                                    setDrawerKey((k) => k + 1);
                                                    setDrawerOpen(true);
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 2 }}>
                            <MenusPreview
                                metadata={metadata}
                                ctx={ctx}
                                device={device}
                                onCtxChange={(patch) => setCtx((prev) => ({ ...prev, ...patch }))}
                                onDeviceChange={setDevice}
                            />
                        </Paper>

                        <Paper sx={{ p: 2, mt: 3 }}>
                            <Typography variant="subtitle2">Versiones guardadas ({metadata.snapshots.length})</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            {metadata.snapshots.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                    Sin versiones. Cada cambio guarda una copia anterior para poder restaurarla (máx. 10).
                                </Typography>
                            ) : (
                                metadata.snapshots.map((snapshot, index) => (
                                    <Box
                                        key={`${snapshot.at}-${index}`}
                                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, py: 0.75 }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" noWrap>
                                                {snapshot.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(snapshot.at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Button size="small" onClick={() => handleRestore(snapshot)} disabled={saving}>
                                            Restaurar
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <RulesDrawer
                    open={drawerOpen}
                    saving={saving}
                    itemLabel={drawerItem?.label ?? ''}
                    initial={drawerItem ? configFor(drawerItem.id) : null}
                    instanceKey={drawerKey}
                    onClose={() => setDrawerOpen(false)}
                    onSave={(config) => drawerItem && handleSaveRules(drawerItem.id, config)}
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

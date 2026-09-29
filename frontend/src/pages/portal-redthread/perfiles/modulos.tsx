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
    IconButton,
    Paper,
    Snackbar,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
    Tune as TuneIcon,
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'next-i18next';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [snack, setSnack] = useState<Snack | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [form, setForm] = useState<ModuleForm>(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<ProfileModule | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminApiClient.get(BASE);
            const list = Array.isArray(res.data) ? (res.data as ProfileModule[]) : [];
            setModules([...list].sort((a, b) => a.orden - b.orden));
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

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleForbidden = () => {
        setReadOnly(true);
        setSnack({ msg: t('profileModules.readOnly', 'Sin permiso de gestión — modo lectura'), severity: 'error' });
    };

    const handleToggle = async (mod: ProfileModule, visible: boolean) => {
        if (readOnly) return;
        const prev = modules;
        setModules((cur) => cur.map((m) => (m.key === mod.key ? { ...m, visible } : m)));
        try {
            await adminApiClient.patch(`${BASE}/${mod.key}/visibilidad`, { visible });
            setSnack({
                msg: visible
                    ? t('profileModules.visibleOn', 'Módulo visible')
                    : t('profileModules.visibleOff', 'Módulo oculto'),
                severity: 'success',
            });
        } catch (err) {
            setModules(prev);
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: t('profileModules.saveError', 'Error al guardar los cambios'), severity: 'error' });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        if (readOnly) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = modules.findIndex((m) => m.key === active.id);
        const newIndex = modules.findIndex((m) => m.key === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const next = arrayMove(modules, oldIndex, newIndex);
        const prev = modules;
        setModules(next);
        setSaving(true);
        try {
            await adminApiClient.put(`${BASE}/reorden`, { keys: next.map((m) => m.key) });
            setSnack({ msg: t('profileModules.orderSaved', 'Orden guardado'), severity: 'success' });
        } catch (err) {
            setModules(prev);
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: t('profileModules.saveError', 'Error al guardar los cambios'), severity: 'error' });
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

    const handleDelete = async () => {
        if (!deleteTarget || readOnly) return;
        setSaving(true);
        try {
            await adminApiClient.delete(`${BASE}/${deleteTarget.key}`);
            setSnack({ msg: t('profileModules.deleted', 'Módulo eliminado'), severity: 'success' });
            setDeleteTarget(null);
            await load();
        } catch (err) {
            if (isForbidden(err)) {
                setDeleteTarget(null);
                handleForbidden();
            } else {
                setSnack({ msg: t('profileModules.deleteError', 'Error al eliminar el módulo'), severity: 'error' });
            }
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {saving && (
                            <Chip
                                size="small"
                                icon={<CircularProgress size={14} color="inherit" />}
                                label={t('profileModules.saving', 'Guardando…')}
                                variant="outlined"
                            />
                        )}
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
                            {t('profileModules.count', 'Módulos ({{n}})', { n: modules.length })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('profileModules.dragHint', 'Arrastra para reordenar')}
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {modules.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                            <Typography color="text.secondary" gutterBottom>
                                {t('profileModules.empty', 'No hay módulos configurados')}
                            </Typography>
                        </Box>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
                            <SortableContext items={modules.map((m) => m.key)} strategy={verticalListSortingStrategy}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {modules.map((mod) => (
                                        <SortableModuleRow
                                            key={mod.key}
                                            mod={mod}
                                            disabled={readOnly}
                                            onToggle={(visible) => void handleToggle(mod, visible)}
                                            onEdit={() => openEdit(mod)}
                                            onDelete={() => setDeleteTarget(mod)}
                                        />
                                    ))}
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

                <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                    <DialogTitle>{t('profileModules.deleteTitle', 'Eliminar módulo')}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            {t('profileModules.deleteConfirm', '¿Seguro que deseas eliminar este módulo? Esta acción no se puede deshacer.')}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
                            {t('profileModules.cancel', 'Cancelar')}
                        </Button>
                        <Button variant="contained" color="error" onClick={() => void handleDelete()} disabled={saving}>
                            {t('profileModules.delete', 'Eliminar')}
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
    onDelete: () => void;
}

function SortableModuleRow({ mod, disabled, onToggle, onEdit, onDelete }: SortableModuleRowProps) {
    const { t } = useTranslation('common');
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.key, disabled });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <Box ref={setNodeRef} style={style}>
            <Paper
                elevation={isDragging ? 3 : 1}
                sx={{
                    p: 1,
                    px: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderLeft: mod.visible ? '4px solid #4CAF50' : '4px solid #9E9E9E',
                    transition: 'background-color 0.2s ease',
                    '&:hover': { bgcolor: 'action.hover' },
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
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title={mod.visible ? t('profileModules.visible', 'Visible') : t('profileModules.hidden', 'Oculto')}>
                        <Switch size="small" checked={mod.visible} onChange={(e) => onToggle(e.target.checked)} disabled={disabled} />
                    </Tooltip>
                    <Tooltip title={t('profileModules.edit', 'Editar')}>
                        <IconButton size="small" onClick={onEdit} disabled={disabled}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    {mod.origen === 'integracion' && (
                        <Tooltip title={t('profileModules.delete', 'Eliminar')}>
                            <IconButton size="small" onClick={onDelete} color="error" disabled={disabled}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

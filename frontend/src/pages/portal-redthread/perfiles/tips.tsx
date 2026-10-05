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
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '../../../components/layout/AdminLayout';
import TipForm from '../../../components/admin/TipForm';
import TipPreview from '../../../components/admin/TipPreview';
import { tipsApi, type AdminTip } from '../../../services/adminApi';

interface Snack {
    msg: string;
    severity: 'success' | 'error';
}

const EMPTY_TIP: Partial<AdminTip> = {
    tip_key: '',
    type: 'drawer',
    section_key: '',
    translations: { es: { title: '', description: '', trigger_button_text: '' } },
    slides: [],
    is_active: true,
    order: 0,
};

function isForbidden(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response;
        return response?.status === 403;
    }
    return false;
}

export default function TipsPage() {
    const [tips, setTips] = useState<AdminTip[]>([]);
    const [savedTips, setSavedTips] = useState<AdminTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [snack, setSnack] = useState<Snack | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<AdminTip>>(EMPTY_TIP);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleForbidden = () => {
        setReadOnly(true);
        setSnack({ msg: 'Sin permiso de gestión — modo lectura', severity: 'error' });
    };

    const load = async () => {
        setLoading(true);
        try {
            const list = await tipsApi.list();
            const sorted = [...list].sort((a, b) => a.order - b.order);
            setTips(sorted);
            setSavedTips(sorted.map((t) => ({ ...t })));
        } catch (err) {
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: 'No se pudieron cargar los tips', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggle = (tip: AdminTip, is_active: boolean) => {
        if (readOnly) return;
        setTips((cur) => cur.map((t) => (t.tip_key === tip.tip_key ? { ...t, is_active } : t)));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (readOnly) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = tips.findIndex((t) => t.tip_key === active.id);
        const newIndex = tips.findIndex((t) => t.tip_key === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setTips(arrayMove(tips, oldIndex, newIndex));
    };

    const dirty =
        tips.length !== savedTips.length ||
        tips.some((t, i) => {
            const s = savedTips[i];
            return !s || s.tip_key !== t.tip_key || s.is_active !== t.is_active;
        });

    const handleSaveAll = async () => {
        if (readOnly || !dirty || saving) return;
        setSaving(true);
        try {
            const prevActive = new Map(savedTips.map((t) => [t.tip_key, t.is_active]));
            for (const t of tips) {
                if (prevActive.has(t.tip_key) && prevActive.get(t.tip_key) !== t.is_active) {
                    await tipsApi.update(t.tip_key, { is_active: t.is_active });
                }
            }
            const prevOrder = savedTips.map((t) => t.tip_key).join(',');
            const nextOrder = tips.map((t) => t.tip_key).join(',');
            if (prevOrder !== nextOrder) {
                await tipsApi.reorder(tips.map((t) => t.tip_key));
            }
            setSavedTips(tips.map((t) => ({ ...t })));
            setSnack({ msg: 'Cambios guardados y aplicados', severity: 'success' });
        } catch (err) {
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: 'No se pudieron aplicar los cambios', severity: 'error' });
            await load();
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setEditingKey(null);
        setForm(EMPTY_TIP);
        setDialogOpen(true);
    };

    const openEdit = (tip: AdminTip) => {
        setEditingKey(tip.tip_key);
        setForm({ ...tip, translations: { ...(tip.translations ?? {}) }, slides: [...(tip.slides ?? [])] });
        setDialogOpen(true);
    };

    const handleDelete = async (tipKey: string) => {
        if (readOnly) return;
        if (!window.confirm(`¿Eliminar el tip "${tipKey}"?`)) return;
        try {
            await tipsApi.remove(tipKey);
            setSnack({ msg: 'Tip eliminado', severity: 'success' });
            await load();
        } catch (err) {
            if (isForbidden(err)) handleForbidden();
            else setSnack({ msg: 'Error al eliminar el tip', severity: 'error' });
        }
    };

    const handleSaveDialog = async () => {
        if (readOnly) return;
        if (!editingKey && !form.tip_key?.trim()) {
            setSnack({ msg: 'La clave del tip es obligatoria', severity: 'error' });
            return;
        }
        setSaving(true);
        try {
            if (editingKey) {
                const { tip_key: _omit, ...body } = form;
                await tipsApi.update(editingKey, body);
                setSnack({ msg: 'Tip actualizado', severity: 'success' });
            } else {
                await tipsApi.create(form);
                setSnack({ msg: 'Tip creado', severity: 'success' });
            }
            setDialogOpen(false);
            await load();
        } catch (err) {
            if (isForbidden(err)) {
                setDialogOpen(false);
                handleForbidden();
            } else {
                setSnack({ msg: 'Error al guardar el tip', severity: 'error' });
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
                        <HelpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                Tips de perfiles
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Gestiona los modales de ayuda del editor de perfil: estado, orden, contenido e imágenes.
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {dirty && !readOnly && (
                            <Chip size="small" label="Cambios sin guardar" color="warning" variant="outlined" />
                        )}
                        {dirty && !readOnly && (
                            <Button onClick={() => setTips(savedTips.map((t) => ({ ...t })))} disabled={saving}>
                                Descartar
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={() => void handleSaveAll()}
                            disabled={!dirty || saving || readOnly}
                        >
                            Guardar
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={readOnly}>
                            Nuevo tip
                        </Button>
                    </Box>
                </Box>

                {readOnly && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Sin permiso de gestión — modo lectura
                    </Alert>
                )}

                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">Tips ({tips.length})</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Arrastra para reordenar
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {tips.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                            <HelpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary" gutterBottom>
                                No hay tips configurados
                            </Typography>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={saving || readOnly}>
                                Crear el primer tip
                            </Button>
                        </Box>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
                            <SortableContext items={tips.map((t) => t.tip_key)} strategy={verticalListSortingStrategy}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {tips.map((tip) => (
                                        <SortableTipRow
                                            key={tip.tip_key}
                                            tip={tip}
                                            disabled={readOnly}
                                            onToggle={(v) => void handleToggle(tip, v)}
                                            onEdit={() => openEdit(tip)}
                                            onDelete={() => void handleDelete(tip.tip_key)}
                                        />
                                    ))}
                                </Box>
                            </SortableContext>
                        </DndContext>
                    )}
                </Paper>

                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
                    <DialogTitle>{editingKey ? `Editar tip: ${editingKey}` : 'Nuevo tip'}</DialogTitle>
                    <DialogContent sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, pt: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <TipForm
                                value={form}
                                onChange={setForm}
                                persistedTipKey={editingKey}
                                readOnly={readOnly}
                                onSnack={(msg, severity) => setSnack({ msg, severity })}
                            />
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 380 }, flexShrink: 0 }}>
                            <TipPreview tip={form} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button variant="contained" onClick={() => void handleSaveDialog()} disabled={saving || readOnly}>
                            Guardar
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

function SortableTipRow({
    tip,
    disabled,
    onToggle,
    onEdit,
    onDelete,
}: {
    tip: AdminTip;
    disabled: boolean;
    onToggle: (v: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tip.tip_key, disabled });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    const title = tip.translations?.es?.title ?? tip.translations?.en?.title ?? tip.tip_key;

    return (
        <Box ref={setNodeRef} style={style}>
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
                    borderLeft: tip.is_active ? '4px solid #4CAF50' : '4px solid #9E9E9E',
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
                            {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {tip.tip_key}
                        </Typography>
                        <Chip size="small" label={tip.type} variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                        {tip.section_key && (
                            <Chip size="small" label={tip.section_key} variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                        )}
                    </Box>
                </Box>
                <Switch
                    checked={tip.is_active}
                    onChange={(e) => onToggle(e.target.checked)}
                    disabled={disabled}
                    color="success"
                />
                <IconButton size="small" onClick={onEdit} disabled={disabled} aria-label="editar tip">
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={onDelete} disabled={disabled} aria-label="eliminar tip">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Paper>
        </Box>
    );
}

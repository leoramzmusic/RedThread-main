import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceResource, AppearanceType, Platform, AppearanceHistory } from '../../../types/appearance';
import IconGallery from '../../../components/appearance/IconGallery';
import IconHistoryComponent from '../../../components/appearance/IconHistory';
import IconScheduler from '../../../components/appearance/IconScheduler';
import ContextPreview from '../../../components/appearance/ContextPreview';
import ConfirmationDrawer from '../../../components/common/modals/ConfirmationDrawer';
import IconUploadDialog from '../../../components/appearance/IconUploadDialog';

const RESOLUTIONS = [
    // Standard & Google Recommended (Multiples of 48)
    "48x48", "96x96", "144x144", "192x192",
    // Classic Web
    "16x16", "32x32",
    // iOS
    "180x180",
    // Other Common
    "512x512"
];

export default function IconosPage() {
    // Scope State: 'admin' | 'user'
    const [scope, setScope] = useState<'admin' | 'user'>('admin');

    // Main View Tabs: 0: Gallery, 1: History, 2: Schedule
    const [viewTab, setViewTab] = useState(0);

    // Platform Tabs (within Gallery): 0: Web, 1: Android, 2: iOS
    const [platformTab, setPlatformTab] = useState(0);

    const [resources, setResources] = useState<AppearanceResource[]>([]);
    const [history, setHistory] = useState<AppearanceHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);

    // Selected Resource for Preview
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

    // Fetch on mount and when scope changes
    useEffect(() => {
        // Define internal async function or move fetchResources up?
        // Since fetchResources uses 'scope' which is state, and 'setResources', it's fine to be defined below 
        // IF we use function hoisting (function fetchResources() {}) but here they are consts.
        // So we should move the useEffect AFTER the const definitions OR define the logic inside.
        // But to minimize diff churn, let's just use the existing function calls assuming they are available?
        // NO, const functions are NOT hoisted. They will be undefined here.
        // We must rely on the fact that I am not moving the functions, I am just restoring the state.
        // Wait, the functions `fetchResources` are defined on line 53+.
        // If I put useEffect on line 48, it will fail accessing `fetchResources`.

        // I will just put the state definitions here. The useEffect needs to be moved AFTER the functions are defined 
        // OR the functions need to be moved UP.
        // OR I can just use a forward declaration or use `useCallback`? No.
        // The previous code had `useEffect` at the top, which called `fetchResources`. 
        // THIS ONLY WORKS if `fetchResources` is a `function` declaration (hoisted) OR if it was defined before `useEffect`.
        // In the original file (Step 514), `fetchResources` (line 68) was defined AFTER `useEffect` (line 63). 
        // This implies `fetchResources` was NOT a const?
        // Line 68: `const fetchResources = async () => {`
        // THIS MEANS THE ORIGINAL CODE WAS CRASHING OR I MISREAD IT?
        // Const functions are not hoisted.
        // Ah, `useEffect` callback runs AFTER render, so `fetchResources` const WILL be defined by the time the effect runs!
        // So it is fine to have useEffect before const functions, as long as useEffect doesn't run synchronously during render (it doesn't).

        // So I can restore it as is.
        fetchResources();
        fetchHistory();
    }, [scope]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const type = scope === 'admin' ? AppearanceType.FAVICON : AppearanceType.FAVICON_USER;
            const data = await appearanceService.getResources(type);
            setResources(data);
        } catch (error) {
            console.error("Error fetching resources:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            // History is global currently, filtering by type might be needed if we want to separate history too
            // Backend getHistory returns all. We can filter client side if we want, or just show all.
            // Let's show all for now, or filter by the current scope type context if easy.
            const data = await appearanceService.getHistory();
            setHistory(data);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const getPlatformFromTab = (tab: number) => {
        if (tab === 0) return Platform.WEB;
        if (tab === 1) return Platform.ANDROID;
        if (tab === 2) return Platform.IOS;
        return Platform.WEB;
    };

    const handleUpload = async (file: File, resolution: string, description: string, date?: string) => {
        try {
            const type = scope === 'admin' ? AppearanceType.FAVICON : AppearanceType.FAVICON_USER;
            const url = await appearanceService.uploadFile(file, type);

            const isScheduled = !!date;

            // Convert local time string (YYYY-MM-DDTHH:mm) to UTC ISO string
            let startDateUTC = undefined;
            if (date) {
                const localDate = new Date(date);
                startDateUTC = localDate.toISOString();
            }

            await appearanceService.createResource({
                type: type,
                platform: getPlatformFromTab(platformTab),
                url: url,
                resolution: resolution,
                description: description,
                start_date: startDateUTC,
                is_active: !isScheduled // If scheduled, not active immediately
            });

            // setOpenUpload(false); // Handled by dialog
            fetchResources();
            fetchHistory(); // Refresh history
            window.dispatchEvent(new Event('appearance:update'));
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error al subir el archivo");
            throw error; // Let dialog handle loading state or error feedback
        }
    };



    const handleDeleteClick = (id: string) => {
        setResourceToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!resourceToDelete) return;
        try {
            await appearanceService.deleteResource(resourceToDelete);
            fetchResources();
            fetchHistory(); // Log the deletion in history implicitly if backend supports it, or just refresh
            window.dispatchEvent(new Event('appearance:update'));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleSelectResource = async (id: string) => {
        setSelectedResourceId(id);
        // Optional: Trigger activation/deactivation logic here if selection implies activation
        // For now, just selecting for preview. 
        // If we want "Select to Activate", we would call updateResource(id, { is_active: true })
        // Let's implement that logic:
        try {
            await appearanceService.updateResource(id, { is_active: true });
            fetchResources();
            fetchHistory();
            window.dispatchEvent(new Event('appearance:update'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm("¿Estás seguro de que deseas limpiar todo el historial? Esta acción no se puede deshacer.")) return;
        try {
            await appearanceService.clearHistory();
            fetchHistory();
            window.dispatchEvent(new Event('appearance:update'));
        } catch (e) {
            console.error(e);
        }
    };

    const currentPlatform = getPlatformFromTab(platformTab);
    const filteredResources = resources.filter(r => r.platform === currentPlatform);

    // Find active resource for preview
    const activeResource = filteredResources.find(r => r.is_active);
    const previewUrl = selectedResourceId
        ? resources.find(r => r._id === selectedResourceId)?.url
        : activeResource?.url;

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight={700}>
                            Favicon & Iconos
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => setOpenUpload(true)}
                        >
                            Subir Nuevo
                        </Button>
                    </Box>

                    {/* Scope Selector */}
                    <Paper sx={{ mb: 3, p: 1, display: 'inline-flex', bgcolor: 'background.paper' }}>
                        <Tabs
                            value={scope}
                            onChange={(e, v) => setScope(v)}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 2, minWidth: 'auto', borderRadius: 1 } }}
                        >
                            <Tab label="Portal Admin" value="admin" />
                            <Tab label="Portal Usuario" value="user" />
                        </Tabs>
                    </Paper>

                    {/* Main View Tabs */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)} centered textColor="primary" indicatorColor="primary">
                            <Tab label="Galería" />
                            <Tab label="Historial" />
                            <Tab label="Programación" />
                        </Tabs>
                    </Paper>

                    {viewTab === 0 && (
                        <>
                            {/* Platform Sub-Tabs */}
                            <Paper sx={{ width: '100%', mb: 2, bgcolor: 'transparent', boxShadow: 'none' }}>
                                <Tabs
                                    value={platformTab}
                                    onChange={(e, v) => setPlatformTab(v)}
                                    indicatorColor="secondary"
                                    textColor="secondary"

                                >
                                    <Tab label="Web" />
                                    <Tab label="Android" />
                                    <Tab label="iOS" />
                                </Tabs>
                            </Paper>

                            {/* Contextual Preview */}
                            <ContextPreview platform={currentPlatform as any} iconUrl={previewUrl} />

                            {loading ? <CircularProgress /> : (
                                <IconGallery
                                    resources={filteredResources}
                                    selectedId={activeResource?._id || null}
                                    onSelect={handleSelectResource}
                                    onDelete={handleDeleteClick}
                                />
                            )}
                        </>
                    )}

                    {viewTab === 1 && <IconHistoryComponent history={history} onClear={handleClearHistory} />}

                    {viewTab === 2 && <IconScheduler resources={resources} />}

                    {/* Confirmation Drawer */}
                    <ConfirmationDrawer
                        open={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        title="Eliminar Icono"
                        message="¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer."
                        onConfirm={handleConfirmDelete}
                        confirmText="Eliminar"
                    />

                    {/* Upload Dialog */}
                    {/* Upload Dialog */}
                    <IconUploadDialog
                        open={openUpload}
                        onClose={() => setOpenUpload(false)}
                        onUpload={handleUpload}
                        platform={currentPlatform}
                    />

                </Box>
            </Container>
        </AdminLayout>
    );
}

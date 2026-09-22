import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Avatar,
    Divider,
    Alert,
    CircularProgress,
    OutlinedInput,
    Chip,
    Checkbox,
    ListItemText,
    FormControlLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tab,
    Tabs,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Security as SecurityIcon,
    Public as PublicIcon,
    History as HistoryIcon,
    LockReset as PasswordIcon,
    ArrowBack as BackIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Cake as BirthIcon,
    Event as HireIcon,
    Badge as BadgeIcon,
    Place as PlaceIcon,
    ToggleOn as ToggleIcon,
    Info as InfoIcon,
    Edit as EditIcon,
    AddCircle as AddIcon,
    Delete as DeleteIcon,
    ArrowForward as ArrowRightIcon,
    PhotoCamera as PhotoCameraIcon,
    Videocam as VideocamIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import adminApiClient from '../../services/adminApi';
import { Stack, InputAdornment, useTheme, Autocomplete } from '@mui/material';
import PasswordResetModal from './PasswordResetModal';
import CredentialCard from './CredentialCard';
import CredentialBack from './CredentialBack';
import { getMediaUrl } from '../../utils/media';
import { loadCredentialDesign, cardPropsFromDesign, backPropsFromDesign, type CredentialDesignConfig } from '../../utils/credentialDesign';
import {
    mapApiToProfile,
    profileToUpdatePayload,
    validateProfile,
    EMPTY_PROFILE,
    type EmployeeProfile,
} from '../../utils/employeeProfile';

const COUNTRIES: Array<{ code: string; name: string; states: string[] }> = [
    { code: 'MX', name: 'México', states: ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'] },
    { code: 'ES', name: 'España', states: ['Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 'Extremadura', 'Galicia', 'Madrid', 'Murcia', 'Navarra', 'País Vasco', 'La Rioja', 'Valencia', 'Ceuta', 'Melilla'] },
    { code: 'AR', name: 'Argentina', states: ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'] },
    { code: 'CO', name: 'Colombia', states: ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'] },
    { code: 'CL', name: 'Chile', states: ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana', 'O’Higgins', 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'] },
    { code: 'PE', name: 'Perú', states: ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'] },
    { code: 'BR', name: 'Brasil', states: ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Río de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'] },
    { code: 'US', name: 'Estados Unidos', states: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'] },
    { code: 'CA', name: 'Canadá', states: ['Alberta', 'Columbia Británica', 'Manitoba', 'Nuevo Brunswick', 'Terranova y Labrador', 'Nueva Escocia', 'Ontario', 'Isla del Príncipe Eduardo', 'Quebec', 'Saskatchewan', 'Territorios del Noroeste', 'Nunavut', 'Yukón'] },
    { code: 'FR', name: 'Francia', states: ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d’Azur'] },
    { code: 'DE', name: 'Alemania', states: ['Baden-Württemberg', 'Baviera', 'Berlín', 'Brandeburgo', 'Bremen', 'Hamburgo', 'Hesse', 'Mecklemburgo-Pomerania', 'Baja Sajonia', 'Renania del Norte-Westfalia', 'Renania-Palatinado', 'Sarre', 'Sajonia', 'Sajonia-Anhalt', 'Schleswig-Holstein', 'Turingia'] },
    { code: 'IT', name: 'Italia', states: ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romaña', 'Friuli-Venecia Julia', 'Lazio', 'Liguria', 'Lombardía', 'Marche', 'Molise', 'Piamonte', 'Apulia', 'Cerdeña', 'Sicilia', 'Toscana', 'Trentino-Alto Adigio', 'Umbría', 'Valle de Aosta', 'Véneto'] },
    { code: 'GB', name: 'Reino Unido', states: ['Inglaterra', 'Escocia', 'Gales', 'Irlanda del Norte'] },
    { code: 'PT', name: 'Portugal', states: ['Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Azores', 'Madeira'] },
    { code: 'IN', name: 'India', states: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'] },
    { code: 'JP', name: 'Japón', states: ['Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'] },
];

interface Role {
    name: string;
    slug: string;
}

interface Department {
    _id: string;
    name: string;
}

interface AuditLog {
    id: string;
    admin_name: string;
    action: string;
    field: string;
    old: string;
    new: string;
    summary: string;
    date: string;
}

interface EmployeeEditFormProps {
    employeeId: string;
}

const EmployeeEditForm: React.FC<EmployeeEditFormProps> = ({ employeeId }) => {
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [showAllLogs, setShowAllLogs] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarZoom, setAvatarZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [credentialOpen, setCredentialOpen] = useState(false);
    const [credDesign, setCredDesign] = useState<CredentialDesignConfig>({});
    const credDesignCard = React.useMemo(() => cardPropsFromDesign(credDesign), [credDesign]);
    const credDesignBack = React.useMemo(() => backPropsFromDesign(credDesign), [credDesign]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form State — campos personales normalizados con mapApiToProfile (mismo shape que Mi perfil)
    const [formData, setFormData] = useState<any>({
        ...EMPTY_PROFILE,
        department_id: '',
        roles: [],
        status: '',
        hire_date: '',
        is_2fa_enabled: false,
        last_login_at: '',
        created_at: '',
        updated_at: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, deptsRes, empRes, auditRes] = await Promise.all([
                    adminApiClient.get('/portal-redthread/roles/'),
                    adminApiClient.get('/portal-redthread/departments/'),
                    adminApiClient.get(`/portal-redthread/empleados/${employeeId}`),
                    adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`),
                ]);
                setRoles(rolesRes.data);
                setDepartments(deptsRes.data);
                // Normaliza campos personales con el mismo mapper que Mi perfil
                setFormData((prev: any) => ({
                    ...prev,
                    ...empRes.data,
                    ...mapApiToProfile(empRes.data),
                }));
                setAuditLogs(auditRes.data);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError('No se pudo cargar la información del empleado.');
            } finally {
                setLoading(false);
            }
        };
        if (employeeId) fetchData();
    }, [employeeId]);

    useEffect(() => {
        let alive = true;
        loadCredentialDesign().then((cfg) => {
            if (alive) setCredDesign(cfg);
        }).catch(() => {});
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'reth-credential-config' && e.newValue) {
                try { setCredDesign(JSON.parse(e.newValue)); } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => { alive = false; window.removeEventListener('storage', onStorage); };
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleAvatarFile = (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            setError('Formato no permitido. Usa JPG o PNG');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setError('Imagen supera 3MB (máx. 3MB)');
            return;
        }
        setAvatarFile(file);
        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
        setAvatarZoom(1);
        setError(null);
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setAvatarUploading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('file', avatarFile);
            const res = await adminApiClient.post(`/portal-redthread/empleados/${employeeId}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.url as string;
            setFormData((prev: any) => ({ ...prev, avatar: url }));
            setSuccess('Foto actualizada. Se usará en credencial y documentos oficiales (bucket seguro).');
            setAvatarFile(null);
            setAvatarPreview(null);
            setAvatarZoom(1);
            // refresca auditoría
            const auditRes = await adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`);
            setAuditLogs(auditRes.data);
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            const raw = err.response?.data?.detail;
            const msg = Array.isArray(raw) ? raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ') : (raw && typeof raw === 'object' ? (raw.msg || JSON.stringify(raw)) : raw) || 'Error al subir la foto';
            setError(String(msg));
        } finally { setAvatarUploading(false); }
    };

    const handleOpenCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
            }, 50);
        } catch (e: any) {
            const msg = e?.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Actívalo en el navegador.' : e?.name === 'NotFoundError' ? 'No se encontró cámara.' : 'No se pudo acceder a la cámara.';
            setCameraError(msg);
        }
    };
    const handleCloseCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsCameraOpen(false);
        setCameraError(null);
        if (videoRef.current) videoRef.current.srcObject = null;
    };
    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const min = Math.min(vw, vh);
        const sx = (vw - min) / 2;
        const sy = (vh - min) / 2;
        ctx.drawImage(video, sx, sy, min, min, 0, 0, size, size);
        // mejora brillo/contraste suave
        ctx.filter = 'contrast(1.05) brightness(1.03)';
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleAvatarFile(file);
            handleCloseCamera();
        }, 'image/jpeg', 0.92);
    };
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const profile = mapApiToProfile(formData);
            const validationError = validateProfile(profile, {
              hasAvatar: !!formData.avatar || !!avatarPreview,
            });
            if (validationError) {
                setError(validationError);
                setSubmitting(false);
                return;
            }
            // Si hay foto pendiente sin subir, súbela primero
            if (avatarFile) {
                const fd = new FormData();
                fd.append('file', avatarFile);
                const r = await adminApiClient.post(`/portal-redthread/empleados/${employeeId}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                formData.avatar = r.data.url;
                setAvatarFile(null);
                setAvatarPreview(null);
            }
            // Payload personal unificado + campos admin; excluye internals e _countryId
            const { id, employee_id, hire_date, last_login_at, created_at, updated_at, _countryId, ...rest } = formData as any;
            const updateData = {
                ...rest,
                ...profileToUpdatePayload(mapApiToProfile({ ...rest, avatar: formData.avatar, id, employee_id })),
            };
            await adminApiClient.put(`/portal-redthread/empleados/${employeeId}`, updateData);
            setSuccess('Empleado actualizado correctamente.');

            // Refresh audit logs
            const auditRes = await adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`);
            setAuditLogs(auditRes.data);

            // Scroll to top to show success
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error('Error updating employee:', err);
            setError(err.response?.data?.detail || 'Error al actualizar el empleado.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = () => {
        setResetModalOpen(true);
    };

    const handleConfirmPasswordReset = async (newPassword: string) => {
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await adminApiClient.put(`/portal-redthread/empleados/${employeeId}`, { password: newPassword });
            setSuccess('Contraseña reseteada correctamente.');
            setResetModalOpen(false);

            const auditRes = await adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`);
            setAuditLogs(auditRes.data);
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.response?.data?.detail || 'Error al resetear la contraseña.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => router.push('/portal-redthread/empleados/listado')}
                >
                    Volver al Listado
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                    <Tab icon={<PersonIcon />} label="Información General" />
                    <Tab icon={<HistoryIcon />} label="Historial de Cambios" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        {/* LEFT COLUMN: Personal & Location */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={3}>
                                {/* Foto de Perfil — 1:1 crop, preview, bucket seguro y trazabilidad */}
                                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                        <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 2, display: 'flex', color: 'success.main' }}>
                                            <PersonIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Foto de Perfil</Typography>
                                        <Chip label="1:1" size="small" sx={{ ml: 1 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Para credencial digital y documentos oficiales. Se guarda en bucket seguro (S3/Azure) y queda auditado quién la cambió. Solo RRHH/Admin pueden reemplazarla.
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={4} display="flex" justifyContent="center">
                                            <Box sx={{ width: 140, height: 140, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? '#232428' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                <Box
                                                    key={formData.avatar || 'no-avatar'}
                                                    component="img"
                                                    src={avatarPreview || (formData.avatar ? `${getMediaUrl(formData.avatar)}?t=${formData.updated_at ? new Date(formData.updated_at).getTime() : Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent((formData.first_name || 'E') + ' ' + (formData.last_name || ''))}&background=E63946&color=fff&size=256`)}
                                                    alt="preview"
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transform: `scale(${avatarZoom})`,
                                                        filter: avatarPreview ? 'contrast(1.05) brightness(1.03)' : 'none',
                                                        transition: 'transform 0.2s ease, filter 0.2s ease',
                                                    }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.first_name || 'E')}&background=ddd&color=555&size=256`; }}
                                                />
                                                <Box sx={{ position: 'absolute', inset: 0, border: '2px dashed', borderColor: 'rgba(0,0,0,0.12)', borderRadius: 2, pointerEvents: 'none' }} />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <Box
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleAvatarFile(f); }}
                                                onClick={() => fileInputRef.current?.click()}
                                                sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: isDragging ? 'primary.main' : 'divider', bgcolor: isDragging ? 'action.hover' : 'rgba(0,0,0,0.02)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                            >
                                                <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.currentTarget.value = ''; }} />
                                                <Typography variant="body2" fontWeight={600}>Arrastrar y soltar o <Box component="span" sx={{ color: 'primary.main' }}>Subir foto</Box></Typography>
                                                <Typography variant="caption" color="text.secondary">JPG, PNG — máx. 3MB — recorte 1:1 cuadrado</Typography>
                                            </Box>
                                            <Box display="flex" gap={1} mt={1.5} flexWrap="wrap" alignItems="center">
                                                <Button size="small" variant="outlined" startIcon={<PhotoCameraIcon />} onClick={handleOpenCamera}>Tomar foto</Button>
                                                <Typography variant="caption" color="text.secondary">o usa tu cámara integrada</Typography>
                                            </Box>
                                            {cameraError && <Alert severity="error" sx={{ mt: 1 }}>{cameraError}</Alert>}
                                            {isCameraOpen && (
                                                <Box sx={{ mt: 1.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2, bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                                                    </Box>
                                                    <Box display="flex" gap={1} mt={1}>
                                                        <Button size="small" variant="contained" startIcon={<PhotoCameraIcon />} onClick={handleCapture}>Capturar</Button>
                                                        <Button size="small" onClick={handleCloseCamera}>Cancelar</Button>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">Se recortará 1:1 y se aplicará mejora de brillo/contraste. Pedirá permisos si es necesario.</Typography>
                                                </Box>
                                            )}
                                            {avatarPreview && (
                                                <Box mt={1.5}>
                                                    <Typography variant="caption" fontWeight="bold">Zoom y posición</Typography>
                                                    <Slider value={avatarZoom} min={1} max={2.2} step={0.05} onChange={(_, v) => setAvatarZoom(v as number)} size="small" />
                                                    <Box display="flex" gap={1} mt={1}>
                                                        <Button size="small" variant="contained" onClick={handleAvatarUpload} disabled={avatarUploading} sx={{ borderRadius: 2 }}>
                                                            {avatarUploading ? <CircularProgress size={18} color="inherit" /> : 'Guardar foto'}
                                                        </Button>
                                                        <Button size="small" onClick={() => { setAvatarFile(null); setAvatarPreview(null); setAvatarZoom(1); }}>Cancelar</Button>
                                                    </Box>
                                                </Box>
                                            )}
                                            {!avatarPreview && formData.avatar && (
                                                <Typography variant="caption" color="text.secondary" display="block" mt={1}>Foto actual guardada en bucket seguro. Cada cambio queda en auditoría.</Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>Extras: credencial digital con QR y foto en listados/dashboard se generan automáticamente.</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                                {/* Personal Data Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', color: 'primary.main' }}>
                                            <PersonIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Datos Personales</Typography>
                                    </Box>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Nombre(s)"
                                                required
                                                value={formData.first_name}
                                                onChange={(e) => handleChange('first_name', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Apellidos"
                                                required
                                                value={formData.last_name}
                                                onChange={(e) => handleChange('last_name', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Email Corporativo"
                                                required
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <EmailIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Teléfono"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PhoneIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha de Nacimiento"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
                                                onChange={(e) => handleChange('birth_date', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <BirthIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Location Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'secondary.light', borderRadius: 2, display: 'flex', color: 'secondary.main' }}>
                                            <PublicIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Ubicación</Typography>
                                    </Box>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={6}>
                                            <Autocomplete
                                                freeSolo
                                                options={COUNTRIES}
                                                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                                value={COUNTRIES.find((c) => c.name === formData.country || c.code === formData.country) || (formData.country || null)}
                                                onChange={(_, newValue) => {
                                                    const val = typeof newValue === 'string' ? newValue : newValue ? (newValue as typeof COUNTRIES[number]).name : '';
                                                    handleChange('country', val);
                                                    handleChange('city', '');
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="País"
                                                        placeholder="Selecciona país"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            startAdornment: (
                                                                <>
                                                                    <InputAdornment position="start">
                                                                        <PlaceIcon fontSize="small" color="action" />
                                                                    </InputAdornment>
                                                                    {params.InputProps.startAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            {(() => {
                                                const selected = COUNTRIES.find((c) => c.name === formData.country || c.code === formData.country);
                                                const states = selected ? selected.states : [];
                                                return (
                                                    <Autocomplete
                                                        freeSolo
                                                        options={states}
                                                        value={formData.city || null}
                                                        onChange={(_, newValue) => handleChange('city', typeof newValue === 'string' ? newValue : (newValue as string) || '')}
                                                        onInputChange={(_, newInputValue) => {
                                                            if (newInputValue && !states.includes(newInputValue)) handleChange('city', newInputValue);
                                                        }}
                                                        disabled={!formData.country}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Estado / Ciudad"
                                                                placeholder={formData.country ? 'Selecciona estado' : 'Selecciona un país primero'}
                                                                InputProps={{
                                                                    ...params.InputProps,
                                                                    startAdornment: (
                                                                        <>
                                                                            <InputAdornment position="start">
                                                                                <PlaceIcon fontSize="small" color="action" />
                                                                            </InputAdornment>
                                                                            {params.InputProps.startAdornment}
                                                                        </>
                                                                    ),
                                                                }}
                                                            />
                                                        )}
                                                        noOptionsText={formData.country ? 'No hay estados' : 'Selecciona un país primero'}
                                                    />
                                                );
                                            })()}
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Dirección"
                                                value={formData.address || ''}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PlaceIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Credencial Vertical CR80 */}
                                {(() => {
                                    const deptName = departments.find((d) => d._id === formData.department_id)?.name;
                                    const ready = !!formData.avatar && !!formData.first_name && !!formData.last_name && !!formData.department_id && !!formData.employee_id;
                                    // CR80 ≈ 204×323px; con recorte de clip+padding del componente
                                    const credScale = 0.72;
                                    const credVisualW = 230 * credScale;
                                    const credVisualH = 390 * credScale;
                                    return (
                                        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', width: '100%' }}>
                                            <Box display="flex" alignItems="center" gap={1.5} mb={1} flexWrap="wrap">
                                                <Box sx={{ p: 1, bgcolor: 'error.light', borderRadius: 2, display: 'flex', color: 'error.main' }}>
                                                    <BadgeIcon />
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold">Credencial de empleado</Typography>
                                                <Chip label="CR80 85.6×53.98mm" size="small" sx={{ ml: 1 }} />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" mb={2}>Vista previa con el diseño de EmployeeIdDesign aplicado a foto, nombre, departamento, código y QR. Se genera en vertical para impresión.</Typography>
                                            {credDesign.designName ? (
                                                <Chip label={`Diseño: ${String(credDesign.designName)}`} size="small" color="primary" variant="outlined" sx={{ mb: 1.5 }} />
                                            ) : null}
                                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', width: '100%', minHeight: credVisualH + 16 }}>
                                                <Box
                                                    sx={{
                                                        width: credVisualW,
                                                        height: credVisualH,
                                                        flexShrink: 0,
                                                        position: 'relative',
                                                        overflow: 'visible',
                                                        p: 1.5,
                                                        bgcolor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: 2,
                                                        border: '1px dashed',
                                                        borderColor: 'divider',
                                                    }}
                                                >
                                                    <Box sx={{ pointerEvents: 'none', position: 'absolute', top: 6, left: 6, transform: `scale(${credScale})`, transformOrigin: 'top left' }}>
                                                        <CredentialCard
                                                            photoUrl={formData.avatar || avatarPreview}
                                                            firstName={formData.first_name || 'Nombre'}
                                                            lastName={formData.last_name || 'Apellido'}
                                                            departmentName={deptName}
                                                            roleName={roles.find((r) => r.slug === formData.roles?.[0])?.name || formData.roles?.[0]}
                                                            employeeCode={formData.employee_id || 'EMP-0000'}
                                                            email={formData.email}
                                                            phone={formData.phone}
                                                            birthDate={formData.birth_date}
                                                            {...credDesignCard}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                                    <Typography variant="body2" fontWeight={600}>{formData.first_name || '-'} {formData.last_name || ''}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{deptName || 'Sin departamento'} · {formData.employee_id || 'Sin código'}</Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Plantilla: {String(credDesign.template || 'geométrico')} · {String(credDesign.font || 'Inter')} · {String(credDesign.nameCase || 'UPPERCASE')}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <Button size="small" variant="contained" onClick={() => setCredentialOpen(true)} disabled={!ready} sx={{ borderRadius: 2 }}>
                                                            Ver credencial
                                                        </Button>
                                                        {!ready && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                                                                <InfoIcon sx={{ fontSize: 16 }} />
                                                                <Typography variant="caption">Faltan datos para generar credencial</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>Requiere: foto, nombre, departamento y código. Usa la foto 1:1 de arriba.</Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })()}
                            </Stack>
                        </Grid>

                        {/* RIGHT COLUMN: Laboral & Security */}
                        <Grid item xs={12} md={5}>
                            <Stack spacing={3}>
                                {/* Organizational Data Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 2, display: 'flex', color: 'info.main' }}>
                                            <BusinessIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Información Laboral</Typography>
                                    </Box>
                                    <Stack spacing={2.5}>
                                        <TextField
                                            fullWidth
                                            label="ID Interno"
                                            value={formData.employee_id}
                                            disabled
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon fontSize="small" color="disabled" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="El ID interno es generado por el sistema"
                                        />

                                        <FormControl fullWidth>
                                            <InputLabel>Estado de Cuenta</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Estado de Cuenta"
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Box sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            bgcolor: selected === 'active' ? '#4caf50' : selected === 'suspended' ? '#ff9800' : '#f44336',
                                                            flexShrink: 0,
                                                        }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {selected === 'active' ? 'Activo' : selected === 'suspended' ? 'Suspendido' : 'Inactivo'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            >
                                                <MenuItem value="active">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} /> Activo
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="suspended">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff9800' }} /> Suspendido
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="inactive">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} /> Inactivo
                                                    </Box>
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel>Departamento</InputLabel>
                                            <Select
                                                value={formData.department_id || ''}
                                                label="Departamento"
                                                onChange={(e) => handleChange('department_id', e.target.value)}
                                                sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', pl: 0 } }}
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ ml: 1, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                        <BusinessIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                                {departments.map((dept) => (
                                                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel id="roles-label">Roles Asignados</InputLabel>
                                            <Select
                                                labelId="roles-label"
                                                multiple
                                                value={formData.roles || []}
                                                onChange={(e) => handleChange('roles', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput label="Roles Asignados" />}
                                                sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 } }}
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ ml: 1, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                        <SecurityIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                }
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {(selected as string[]).map((value) => (
                                                            <Chip
                                                                key={value}
                                                                label={value}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                                sx={{ fontWeight: 'medium' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            >
                                                {roles.map((role) => (
                                                    <MenuItem key={role.slug} value={role.slug}>
                                                        <Checkbox checked={(formData.roles || []).indexOf(role.slug) > -1} />
                                                        <ListItemText primary={role.name} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="Fecha de Ingreso"
                                            value={formData.hire_date ? new Date(formData.hire_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                                            disabled
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <HireIcon fontSize="small" color="disabled" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Security & Meta Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 2, display: 'flex', color: 'warning.main' }}>
                                            <SecurityIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Seguridad y Acceso</Typography>
                                    </Box>
                                    <Stack spacing={2}>
                                        <Box p={2} border="1px solid rgba(0,0,0,0.08)" borderRadius={2} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">Autenticación 2FA</Typography>
                                                <Typography variant="caption" color="text.secondary">Protección adicional de cuenta</Typography>
                                            </Box>
                                            <Switch
                                                checked={formData.is_2fa_enabled}
                                                onChange={(e) => handleChange('is_2fa_enabled', e.target.checked)}
                                                color="primary"
                                            />
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="inherit"
                                            startIcon={<PasswordIcon />}
                                            onClick={handlePasswordReset}
                                            sx={{ py: 1.2, bgcolor: 'action.hover', color: 'text.primary', '&:hover': { bgcolor: 'action.selected' } }}
                                        >
                                            Resetear Contraseña 🔁
                                        </Button>

                                        <Divider sx={{ my: 1 }} />

                                        <Box p={2} bgcolor="rgba(0,0,0,0.02)" borderRadius={2}>
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Último acceso:</Typography>
                                                    <Typography variant="caption" fontWeight="medium">{formData.last_login_at ? new Date(formData.last_login_at).toLocaleString('es-ES') : 'Nunca'}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Registro sistema:</Typography>
                                                    <Typography variant="caption" fontWeight="medium">{new Date(formData.created_at).toLocaleString('es-ES')}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* FLOATING ACTION BAR FOR SAVE/CANCEL */}
                        <Box sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 48,
                            left: { xs: 48, md: 300 }, // Adjust for sidebar
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <Paper sx={{
                                p: 1.5,
                                px: 3,
                                borderRadius: 50,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                bgcolor: 'background.paper',
                                border: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center'
                            }}>
                                <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                    ¿Has terminado de editar?
                                </Typography>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    onClick={() => router.push('/portal-redthread/empleados/listado')}
                                    disabled={submitting}
                                    sx={{ borderRadius: 50, px: 3 }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    disabled={submitting}
                                    sx={{
                                        borderRadius: 50,
                                        px: 4,
                                        py: 1.2,
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }
                                    }}
                                >
                                    Guardar Cambios
                                </Button>
                            </Paper>
                        </Box>
                    </Grid>
                </Box>
            )}

            {activeTab === 1 && (
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', color: 'primary.main' }}>
                                <HistoryIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Historial de Auditoría</Typography>
                                <Typography variant="caption" color="text.secondary">Registro completo de modificaciones realizadas a este perfil</Typography>
                            </Box>
                        </Box>

                        <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#1a1a1a' }}> {/* Dark background for contrast */}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Fecha y Hora</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Administrador</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Acción</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Campo</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cambio (Previo → Nuevo)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                <InfoIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">No hay registros de auditoría para este empleado.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (showAllLogs ? auditLogs : auditLogs.slice(0, 5)).map((log) => (
                                            <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                                    {new Date(log.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>{log.admin_name[0]}</Avatar>
                                                        <Typography variant="body2" fontWeight="medium">{log.admin_name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255, 152, 0, 0.05)' }}> {/* Pale Orange Tint */}
                                                    <Chip
                                                        icon={log.action === 'create' ? <AddIcon sx={{ fontSize: '1rem !important' }} /> : log.action === 'delete' ? <DeleteIcon sx={{ fontSize: '1rem !important' }} /> : <EditIcon sx={{ fontSize: '1rem !important' }} />}
                                                        label={log.action.toUpperCase()}
                                                        size="small"
                                                        color={log.action === 'update' ? 'info' : log.action === 'create' ? 'success' : 'error'}
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem', fontWeight: 'bold', height: 24 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}> {/* Pale Blue Tint */}
                                                    <Box sx={{
                                                        display: 'inline-block',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        bgcolor: 'primary.light',
                                                        color: 'primary.dark',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'primary.main',
                                                        opacity: 0.8
                                                    }}>
                                                        {log.field || '-'}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}> {/* Pale Green Tint */}
                                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                        <Typography variant="caption" sx={{
                                                            color: 'error.main',
                                                            bgcolor: 'error.light',
                                                            px: 0.5,
                                                            borderRadius: 0.5,
                                                            textDecoration: 'line-through',
                                                            opacity: 0.8
                                                        }}>
                                                            {log.old !== null && log.old !== undefined ? String(log.old) : 'null'}
                                                        </Typography>

                                                        <ArrowRightIcon fontSize="small" color="action" sx={{ opacity: 0.5, fontSize: '1rem' }} />

                                                        <Typography variant="caption" sx={{
                                                            color: 'success.dark',
                                                            bgcolor: '#e8f5e9',
                                                            px: 0.8,
                                                            py: 0.2,
                                                            borderRadius: 1,
                                                            fontWeight: 'bold',
                                                            border: '1px solid',
                                                            borderColor: 'success.light'
                                                        }}>
                                                            {log.new !== null && log.new !== undefined ? String(log.new) : 'null'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {auditLogs.length > 5 && (
                                <Box p={2} display="flex" justifyContent="center" bgcolor="rgba(0,0,0,0.01)" borderTop="1px solid rgba(0,0,0,0.05)">
                                    <Button
                                        size="small"
                                        onClick={() => setShowAllLogs(!showAllLogs)}
                                        endIcon={showAllLogs ? null : <HistoryIcon fontSize="small" />}
                                    >
                                        {showAllLogs ? 'Ver menos' : `Ver todo el historial (${auditLogs.length})`}
                                    </Button>
                                </Box>
                            )}
                        </TableContainer>
                    </Paper>
                    <Box py={10} /> {/* Spacer for floating bar */}
                </Stack>
            )}

            <PasswordResetModal
                open={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleConfirmPasswordReset}
                submitting={submitting}
            />

            {/* Modal Credencial Vertical — bordes 8px, header fijo, backdrop blur 12px */}
            <Dialog
                open={credentialOpen}
                onClose={() => setCredentialOpen(false)}
                maxWidth="md"
                fullWidth
                slotProps={{
                    backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } },
                    paper: { sx: { borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' } },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <BadgeIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={800}>Vista previa de credencial</Typography>
                    <Box sx={{ ml: 'auto', fontSize: '0.7rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.3 }}>85.6×53.98mm</Box>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', bgcolor: isDark ? '#121212' : '#f5f5f5', py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">FRENTE</Typography>
                    <CredentialCard
                        photoUrl={formData.avatar || avatarPreview}
                        firstName={formData.first_name}
                        lastName={formData.last_name}
                        departmentName={departments.find((d) => d._id === formData.department_id)?.name}
                        roleName={roles.find((r) => r.slug === formData.roles?.[0])?.name || formData.roles?.[0]}
                        employeeCode={formData.employee_id}
                        email={formData.email}
                        phone={formData.phone}
                        birthDate={formData.birth_date}
                        {...credDesignCard}
                    />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">REVERSO</Typography>
                        <CredentialBack
                            employeeCode={formData.employee_id}
                            email={formData.email}
                            issueDate={new Date().toLocaleDateString('en-GB')}
                            expiryDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-GB')}
                            serial={`SN-${formData.employee_id}-${String(formData.first_name).slice(0, 2).toUpperCase()}${String(formData.last_name).slice(0, 2).toUpperCase()}`}
                            {...credDesignBack}
                        />
                    </Box>
                </DialogContent>
                <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="outlined" onClick={() => setCredentialOpen(false)} sx={{ borderRadius: '8px' }}>
                        Cerrar
                    </Button>
                    <Button variant="contained" onClick={() => window.print()} sx={{ borderRadius: '8px', bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>
                        Imprimir / Descargar PDF
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
};

export default EmployeeEditForm;

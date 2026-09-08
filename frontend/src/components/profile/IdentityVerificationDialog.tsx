import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Paper,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface IdentityVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (documentType: string, file: File) => Promise<void>;
}

const DOCUMENT_TYPES = [
  { value: 'ine', label: 'INE (México)', country: 'MX' },
  { value: 'dni_es', label: 'DNI (España)', country: 'ES' },
  { value: 'dni_ar', label: 'DNI (Argentina)', country: 'AR' },
  { value: 'dni_pe', label: 'DNI (Perú)', country: 'PE' },
  { value: 'cedula_cl', label: 'Cédula de Identidad (Chile)', country: 'CL' },
  { value: 'cedula_co', label: 'Cédula de Ciudadanía (Colombia)', country: 'CO' },
  { value: 'passport', label: 'Pasaporte / Passport', country: 'INT' },
  { value: 'drivers_license', label: 'Licencia de Conducir / Driver\'s License', country: 'INT' },
  { value: 'state_id', label: 'State ID (USA)', country: 'US' },
  { value: 'rg_cpf', label: 'RG / CPF (Brasil)', country: 'BR' },
  { value: 'carte_identite', label: 'Carte d\'Identité (Francia)', country: 'FR' },
  { value: 'personalausweis', label: 'Personalausweis (Alemania)', country: 'DE' },
  { value: 'carta_identita', label: 'Carta d\'Identità (Italia)', country: 'IT' },
  { value: 'aadhaar', label: 'Aadhaar Card (India)', country: 'IN' },
  { value: 'other', label: 'Otro documento oficial / Other', country: 'INT' },
];

const IdentityVerificationDialog: React.FC<IdentityVerificationDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation('common');

  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor sube una imagen (JPG, PNG, WEBP) o PDF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!documentType || !selectedFile) {
      alert('Por favor selecciona el tipo de documento y sube un archivo');
      return;
    }

    setUploading(true);
    try {
      await onSubmit(documentType, selectedFile);
      handleClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setDocumentType('');
    setSelectedFile(null);
    setPreview(null);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {t('identityVerification.title', '🔐 Verificación de Identidad')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('identityVerification.privacyNotice', 'Tu documento se usa únicamente para verificar tu identidad y edad. No se mostrará públicamente ni se compartirá con terceros.')}
          </Alert>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>{t('identityVerification.selectDocument', 'Tipo de Documento')}</InputLabel>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              label={t('identityVerification.selectDocument', 'Tipo de Documento')}
            >
              {DOCUMENT_TYPES.map((doc) => (
                <MenuItem key={doc.value} value={doc.value}>
                  {doc.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper
            sx={{
              p: 3,
              border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
              backgroundColor: dragActive ? theme.palette.action.hover : 'transparent',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('identity-file-input')?.click()}
          >
            <input
              id="identity-file-input"
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                {preview && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  {t('identityVerification.uploadFile', 'Arrastra tu documento aquí o haz clic para seleccionar')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Formatos: JPG, PNG, WEBP, PDF (máx. 10MB)
                </Typography>
              </Box>
            )}
          </Paper>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Subiendo documento...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {t('common.cancel', 'Cancelar')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!documentType || !selectedFile || uploading}
        >
          {t('identityVerification.submit', 'Enviar para Verificación')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdentityVerificationDialog;

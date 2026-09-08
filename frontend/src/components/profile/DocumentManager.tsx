import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface DocumentManagerProps {
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  documentUrl?: string;
  documentType?: string;
  rejectionReason?: string;
  verified: boolean;
  onUpload: () => void;
  onDelete: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  verificationStatus,
  documentUrl,
  documentType,
  rejectionReason,
  verified,
  onUpload,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const getStatusChip = () => {
    switch (verificationStatus) {
      case 'pending':
        return <Chip label="Verificación Pendiente" color="warning" size="small" />;
      case 'verified':
        return <Chip label="Verificado" color="success" size="small" icon={<VerifiedUserIcon />} />;
      case 'rejected':
        return <Chip label="Rechazado" color="error" size="small" />;
      case 'none':
      default:
        return <Chip label="Sin Documento" color="default" size="small" />;
    }
  };

  const documentInfoText = `Para verificar tu identidad, necesitas subir una foto clara de tu documento oficial (INE, pasaporte, licencia de conducir). 
  
Asegúrate de que:
• La foto sea nítida y legible
• Se vea tu nombre completo
• Se vea tu fecha de nacimiento
• El documento esté vigente

Tu información será revisada por nuestro equipo y se mantendrá segura.`;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">Documento de Identidad</Typography>
          <Tooltip title={<Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{documentInfoText}</Typography>} arrow>
            <IconButton size="small">
              <InfoIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>
        </Box>
        {getStatusChip()}
      </Box>

      {/* Rejection message */}
      {verificationStatus === 'rejected' && rejectionReason && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
          <Typography variant="subtitle2" fontWeight={600}>
            Documento Rechazado
          </Typography>
          <Typography variant="body2">
            Razón: {rejectionReason}
          </Typography>
          <Typography variant="caption" display="block" mt={1}>
            Puedes subir un nuevo documento para solicitar verificación nuevamente.
          </Typography>
        </Alert>
      )}

      {/* Pending message */}
      {verificationStatus === 'pending' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu documento está siendo revisado. Recibirás una notificación cuando se complete la verificación.
        </Alert>
      )}

      {/* Verified message */}
      {verificationStatus === 'verified' && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<VerifiedUserIcon />}>
          Tu identidad ha sido verificada. Tus datos están protegidos y bloqueados.
        </Alert>
      )}

      {/* Document info */}
      {documentUrl && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Tipo de documento: <strong>{documentType || 'No especificado'}</strong>
          </Typography>
        </Box>
      )}

      {/* Upload button - Dashed rectangle style */}
      {verificationStatus === 'none' && (
        <Box
          onClick={onUpload}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
              borderColor: 'primary.dark',
            },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="primary.main" gutterBottom>
            Subir Documento de Identidad
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Haz clic aquí para seleccionar tu documento oficial
          </Typography>
        </Box>
      )}

      {/* Action buttons for pending and rejected */}
      {verificationStatus === 'pending' && documentUrl && (
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UploadFileIcon />}
            onClick={onUpload}
            fullWidth
          >
            Reemplazar Documento
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            fullWidth
          >
            Eliminar Documento
          </Button>
        </Box>
      )}

      {/* Rejected with document - show both options */}
      {verificationStatus === 'rejected' && documentUrl && (
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UploadFileIcon />}
            onClick={onUpload}
            fullWidth
          >
            Reemplazar Documento
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            fullWidth
          >
            Eliminar Documento
          </Button>
        </Box>
      )}

      {/* Rejected without document - show only upload */}
      {verificationStatus === 'rejected' && !documentUrl && (
        <Box
          onClick={onUpload}
          sx={{
            border: '2px dashed',
            borderColor: 'error.main',
            borderRadius: 2,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
              borderColor: 'error.dark',
            },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Subir Nuevo Documento
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Tu documento anterior fue rechazado. Sube un nuevo documento para verificar tu identidad.
          </Typography>
        </Box>
      )}

      {verificationStatus === 'verified' && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<UploadFileIcon />}
          onClick={onUpload}
          fullWidth
        >
          Reemplazar Documento
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar tu documento oficial?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Al eliminar el documento:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                Los campos de nombre real y fecha de nacimiento se desbloquearán
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Podrás editar tu información nuevamente
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Deberás subir un nuevo documento para verificar tu identidad
              </Typography>
            </li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DocumentManager;

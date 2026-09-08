import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Grid, TextField, InputAdornment, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Control, UseFormSetValue, UseFormWatch, Controller } from 'react-hook-form';
import DocumentManager from './DocumentManager';
import IdentityVerificationDialog from './IdentityVerificationDialog';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';

interface IdentityVerificationContainerProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  verified: boolean;
  setVerified: (verified: boolean) => void;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  documentUrl?: string;
  documentType?: string;
  rejectionReason?: string;
}

const IdentityVerificationContainer: React.FC<IdentityVerificationContainerProps> = ({
  control,
  setValue,
  watch,
  verified,
  setVerified,
  verificationStatus = 'none',
  documentUrl,
  documentType,
  rejectionReason,
}) => {
  const {
    isUploading,
    isDialogOpen,
    message,
    showMessage,
    handleSubmit,
    handleDelete,
    openDialog,
    closeDialog,
    closeMessage,
  } = useIdentityVerification({
    onSuccess: (extractedData) => {
      // Update form fields with extracted data
      if (extractedData?.name) {
        setValue('real_name', extractedData.name);
      }

      if (extractedData?.birth_date) {
        setValue('birth_date', extractedData.birth_date);
      }

      // Reload page to refresh verification status
      window.location.reload();
    },
    onDelete: () => {
      // Reload page to refresh verification status
      window.location.reload();
    },
  });

  // Unlock State
  const [unlockDialogOpen, setUnlockDialogOpen] = React.useState(false);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  // Reset unlocked state if verification status changes
  useEffect(() => {
    setIsUnlocked(false);
  }, [verified, verificationStatus]);

  // Determine if fields should be locked
  // Only lock if pending OR verified AND not unlocked
  const fieldsLocked = (verificationStatus === 'pending' || verified) && !isUnlocked;

  const handleUnlockClick = () => {
    // If already unlocked (shouldn't be clickable if disabled is false, making this redundant but safe)
    if (!fieldsLocked) return;
    setUnlockDialogOpen(true);
  };

  const confirmUnlock = () => {
    setIsUnlocked(true);
    setUnlockDialogOpen(false);
  };

  return (
    <>
      {/* Document Manager */}
      <DocumentManager
        verificationStatus={verificationStatus}
        documentUrl={documentUrl}
        documentType={documentType}
        rejectionReason={rejectionReason}
        verified={verified}
        onUpload={openDialog}
        onDelete={handleDelete}
      />

      {/* Real Name and Birth Date Fields */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="real_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value || ''}
                fullWidth
                label="Nombre Real"
                disabled={fieldsLocked}
                onClick={fieldsLocked ? handleUnlockClick : undefined}
                InputProps={{
                  readOnly: fieldsLocked,
                  endAdornment: (
                    <InputAdornment position="end">
                      {verified ? (
                        <VerifiedUserIcon sx={{ color: 'success.main' }} />
                      ) : fieldsLocked ? (
                        <Box
                          component="span"
                          onClick={handleUnlockClick}
                          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <EditIcon color="action" />
                        </Box>
                      ) : null}
                    </InputAdornment>
                  ),
                }}
                helperText={
                  verified
                    ? "Identidad verificada. Toca para editar (perderás la verificación)."
                    : fieldsLocked
                      ? "Campo bloqueado - Documento en revisión"
                      : "Ingresa tu nombre completo como aparece en tu documento"
                }
                sx={{
                  '& .MuiInputBase-input': { cursor: fieldsLocked ? 'pointer' : 'text' }
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="birth_date"
            control={control}
            render={({ field }) => {
              // Ensure the value is in YYYY-MM-DD format for the date input
              const formatDateForInput = (dateValue: any) => {
                if (!dateValue) return '';

                // If it's already a string in YYYY-MM-DD format, return it
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                  return dateValue;
                }

                // Try to parse and format the date
                try {
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                } catch (e) {
                  console.error('Error formatting date:', e);
                }

                return '';
              };

              return (
                <TextField
                  {...field}
                  value={formatDateForInput(field.value)}
                  fullWidth
                  label="Fecha de Nacimiento"
                  type="date"
                  disabled={fieldsLocked}
                  onClick={fieldsLocked ? handleUnlockClick : undefined}
                  InputProps={{
                    readOnly: fieldsLocked,
                    endAdornment: fieldsLocked ? (
                      <InputAdornment position="end">
                        <Box
                          component="span"
                          onClick={handleUnlockClick}
                          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <EditIcon color="action" />
                        </Box>
                      </InputAdornment>
                    ) : null
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText={
                    verified
                      ? "Identidad verificada. Toca para editar (perderás la verificación)."
                      : fieldsLocked
                        ? "Campo bloqueado - Documento en revisión"
                        : "Selecciona tu fecha de nacimiento"
                  }
                  sx={{
                    '& .MuiInputBase-input': { cursor: fieldsLocked ? 'pointer' : 'text' }
                  }}
                />
              );
            }}
          />
        </Grid>
      </Grid>

      {/* Unlock Warning Dialog */}
      <Dialog
        open={unlockDialogOpen}
        onClose={() => setUnlockDialogOpen(false)}
      >
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon />
          ¿Editar información sensible?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tu perfil está verificado o en revisión. Si editas tu <strong>Nombre Real</strong> o <strong>Fecha de Nacimiento</strong>,
            perderás tu estado de verificación y tendrás que solicitarlo nuevamente.
            <br /><br />
            ¿Estás seguro de que quieres continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmUnlock} color="warning" variant="contained" autoFocus>
            Sí, editar y perder verificación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Identity Verification Dialog */}
      <IdentityVerificationDialog
        open={isDialogOpen}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={closeMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeMessage}
          severity={message.includes('✓') ? 'success' : message.includes('Error') ? 'error' : 'info'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default IdentityVerificationContainer;

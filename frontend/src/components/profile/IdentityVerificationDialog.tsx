import React, { useState } from "react";
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
} from "@mui/material";
import { useTranslation } from "next-i18next";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

interface IdentityVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (documentType: string, file: File) => Promise<void>;
}

const DOCUMENT_TYPES = [
  { value: "ine", label: "INE (México)", country: "MX" },
  { value: "dni_es", label: "DNI (España)", country: "ES" },
  { value: "dni_ar", label: "DNI (Argentina)", country: "AR" },
  { value: "dni_pe", label: "DNI (Perú)", country: "PE" },
  { value: "cedula_cl", label: "Cédula de Identidad (Chile)", country: "CL" },
  {
    value: "cedula_co",
    label: "Cédula de Ciudadanía (Colombia)",
    country: "CO",
  },
  { value: "passport", label: "Pasaporte / Passport", country: "INT" },
  {
    value: "drivers_license",
    label: "Licencia de Conducir / Driver's License",
    country: "INT",
  },
  { value: "state_id", label: "State ID (USA)", country: "US" },
  { value: "rg_cpf", label: "RG / CPF (Brasil)", country: "BR" },
  {
    value: "carte_identite",
    label: "Carte d'Identité (Francia)",
    country: "FR",
  },
  {
    value: "personalausweis",
    label: "Personalausweis (Alemania)",
    country: "DE",
  },
  {
    value: "carta_identita",
    label: "Carta d'Identità (Italia)",
    country: "IT",
  },
  { value: "aadhaar", label: "Aadhaar Card (India)", country: "IN" },
  { value: "other", label: "Otro documento oficial / Other", country: "INT" },
];

const IdentityVerificationDialog: React.FC<IdentityVerificationDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation("common");
  const isDark = theme.palette.mode === "dark";

  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setFormError(
        t(
          "identityVerification.alertFileType",
          "Por favor sube una imagen (JPG, PNG, WEBP) o PDF",
        ),
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError(
        t(
          "identityVerification.alertFileSize",
          "El archivo es demasiado grande. Máximo 10MB",
        ),
      );
      return;
    }

    setFormError(null);
    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
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
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
      setFormError(
        t(
          "identityVerification.alertMissing",
          "Por favor selecciona el tipo de documento y sube un archivo",
        ),
      );
      return;
    }

    setFormError(null);
    setUploading(true);
    try {
      await onSubmit(documentType, selectedFile);
      handleClose();
    } catch (error) {
      console.error("Error uploading document:", error);
      setFormError(
        t(
          "identityVerification.alertUploadError",
          "Error al subir el documento. Por favor intenta de nuevo.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setDocumentType("");
    setSelectedFile(null);
    setPreview(null);
    setUploading(false);
    setFormError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      aria-labelledby="identity-verification-title"
      PaperProps={{
        sx: {
          borderRadius: "12px",
          bgcolor: isDark ? "#232428" : "background.paper",
          color: isDark ? "#E0E0E0" : "text.primary",
          backgroundImage: "none",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          m: { xs: 2 },
          width: { xs: "calc(100% - 32px)" },
        },
      }}
    >
      <DialogTitle
        id="identity-verification-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 700,
        }}
      >
        <VerifiedUserIcon color="primary" />
        {t("identityVerification.title", "Verificación de Identidad")}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2, fontSize: "0.85rem" }}>
            {t(
              "identityVerification.privacyNotice",
              "Tu documento se usa únicamente para verificar tu identidad y edad. No se mostrará públicamente ni se compartirá con terceros.",
            )}
          </Alert>

          {formError && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="identity-doc-type-label">
              {t("identityVerification.selectDocument", "Tipo de Documento")}
            </InputLabel>
            <Select
              labelId="identity-doc-type-label"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              label={t(
                "identityVerification.selectDocument",
                "Tipo de Documento",
              )}
              MenuProps={{
                disablePortal: true,
                PaperProps: {
                  sx: {
                    maxHeight: "40vh",
                    bgcolor: isDark ? "#232428" : "background.paper",
                    color: isDark ? "#E0E0E0" : "text.primary",
                    backgroundImage: "none",
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  },
                },
              }}
            >
              {DOCUMENT_TYPES.map((doc) => (
                <MenuItem key={doc.value} value={doc.value}>
                  {doc.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper
            role="button"
            tabIndex={0}
            aria-label={t(
              "identityVerification.dropzoneLabel",
              "Subir documento oficial. Arrastra un archivo o pulsa Enter para seleccionar.",
            )}
            sx={{
              p: 3,
              border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
              backgroundColor: dragActive
                ? theme.palette.action.hover
                : "transparent",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() =>
              document.getElementById("identity-file-input")?.click()
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                document.getElementById("identity-file-input")?.click();
              }
            }}
          >
            <input
              id="identity-file-input"
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
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
                {preview ? (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={preview}
                      alt={t(
                        "identityVerification.previewAlt",
                        "Vista previa del documento seleccionado",
                      )}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ display: "block", mt: 1, fontWeight: 600 }}
                    >
                      {t(
                        "identityVerification.validFile",
                        "✓ Archivo válido, listo para enviar",
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: "block", mt: 1, fontWeight: 600 }}
                  >
                    {t(
                      "identityVerification.validFile",
                      "✓ Archivo válido, listo para enviar",
                    )}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body1" gutterBottom>
                  {t(
                    "identityVerification.uploadFile",
                    "Arrastra tu documento aquí o haz clic para seleccionar",
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    "identityVerification.formatsHint",
                    "Formatos: JPG, PNG, WEBP, PDF (máx. 10MB)",
                  )}
                </Typography>
              </Box>
            )}
          </Paper>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                {t(
                  "identityVerification.uploadingMsg",
                  "Subiendo documento...",
                )}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1,
          px: { xs: 2.5, sm: 3 },
          pb: 3,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={uploading}
          color="inherit"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {t("common.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!documentType || !selectedFile || uploading}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {t("identityVerification.submit", "Enviar para Verificación")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdentityVerificationDialog;

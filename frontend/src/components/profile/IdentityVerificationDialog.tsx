import React, { useCallback, useEffect, useRef, useState } from "react";
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
  CircularProgress,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Paper,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ReplayIcon from "@mui/icons-material/Replay";
import { useUI } from "../../context/UIContext";

interface IdentityVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    documentType: string,
    file: File,
    selfie?: File | null,
  ) => Promise<void>;
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

const SELFIE_MAX_SIZE = 5 * 1024 * 1024;

const IdentityVerificationDialog: React.FC<IdentityVerificationDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation("common");
  const { drawerWidth } = useUI();
  const isDark = theme.palette.mode === "dark";

  const [step, setStep] = useState<1 | 2>(1);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Selfie state
  const [selectedSelfie, setSelectedSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    stopCamera();
    setStep(1);
    setDocumentType("");
    setSelectedFile(null);
    setPreview(null);
    setUploading(false);
    setFormError(null);
    setDragActive(false);
    setSelectedSelfie(null);
    setSelfiePreview(null);
    setCameraError(null);
  }, [stopCamera]);

  // Reset whenever the dialog opens (also covers parent-driven close paths)
  useEffect(() => {
    if (open) {
      resetAll();
    }
    return () => stopCamera();
  }, [open, resetAll, stopCamera]);

  // Attach the live stream to the video element once the camera is on
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        t(
          "identityVerification.cameraError",
          "No se pudo acceder a la cámara. Revisa los permisos o sube una foto.",
        ),
      );
    } finally {
      setCameraStarting(false);
    }
  }, [t]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSelectedSelfie(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
        setSelfiePreview(URL.createObjectURL(blob));
        // Turn the camera off once captured (privacy: no LED while previewing)
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }, [stopCamera]);

  const handleSelfieFileSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError(
        t(
          "identityVerification.selfieFileType",
          "Por favor sube una imagen (JPG, PNG, WEBP)",
        ),
      );
      return;
    }
    if (file.size > SELFIE_MAX_SIZE) {
      setCameraError(
        t(
          "identityVerification.selfieFileSize",
          "La foto es demasiado grande. Máximo 5MB",
        ),
      );
      return;
    }

    setCameraError(null);
    stopCamera();
    setSelectedSelfie(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const retakeSelfie = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelectedSelfie(null);
    setSelfiePreview(null);
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  };

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

  const handleSelfieChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleSelfieFileSelect(file);
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

  const goToStep2 = () => {
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
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!documentType || !selectedFile || !selectedSelfie) {
      setFormError(
        t(
          "identityVerification.alertMissingSelfie",
          "Por favor toma o sube una selfie",
        ),
      );
      return;
    }

    setFormError(null);
    setUploading(true);
    try {
      await onSubmit(documentType, selectedFile, selectedSelfie);
      resetAll();
      onClose();
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
    if (uploading) return;
    resetAll();
    onClose();
  };

  const hasDocument = !!documentType && !!selectedFile;
  const hasSelfie = !!selectedSelfie;

  const renderStep = (number: 1 | 2, label: string, done: boolean) => (
    <Box display="flex" alignItems="center">
      {done ? (
        <CheckCircleIcon color="success" sx={{ fontSize: 24 }} />
      ) : (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor:
              step === number ? theme.palette.primary.main : "action.disabled",
            color: step === number ? "#fff" : "text.primary",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {number}
        </Box>
      )}
      <Typography
        variant="body2"
        sx={{
          ml: 1,
          fontWeight: step === number ? 600 : 400,
          color: done ? "text.primary" : "text.secondary",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      aria-labelledby="identity-verification-title"
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            bgcolor: "rgba(0,0,0,0.55)",
          },
        },
      }}
      sx={{
        // Center on the content area (which sits right of the sidebar on md+),
        // not on the raw viewport.
        "& .MuiDialog-container": {
          pl: { xs: 0, md: `${drawerWidth}px` },
        },
      }}
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
              "Tu documento y tu selfie se usan únicamente para verificar tu identidad y edad. No se mostrarán públicamente ni se compartirán con terceros.",
            )}
          </Alert>

          {/* Stepper */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            {renderStep(1, t("identityVerification.stepDocument", "Documento"), hasDocument)}
            <Box
              sx={{
                flex: 1,
                height: 2,
                mx: 2,
                bgcolor: hasDocument ? "success.main" : "action.disabled",
                borderRadius: 1,
              }}
            />
            {renderStep(2, t("identityVerification.stepSelfie", "Selfie"), hasSelfie)}
          </Box>

          {formError && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {step === 1 && (
            <>
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
                        // Never wider than the dialog content: long labels wrap
                        // instead of pushing the menu outside the modal.
                        maxWidth: "calc(100% - 32px)",
                        bgcolor: isDark ? "#232428" : "background.paper",
                        color: isDark ? "#E0E0E0" : "text.primary",
                        backgroundImage: "none",
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                        "& .MuiMenuItem-root": {
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        },
                        "&::-webkit-scrollbar": { width: 8 },
                        "&::-webkit-scrollbar-thumb": {
                          bgcolor: "action.disabled",
                          borderRadius: 4,
                        },
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
            </>
          )}

          {step === 2 && (
            <Box>
              {cameraError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cameraError}
                </Alert>
              )}

              <Paper
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                {selectedSelfie && selfiePreview ? (
                  <Box>
                    <Box
                      sx={{
                        width: "100%",
                        maxHeight: 280,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        borderRadius: "8px",
                        bgcolor: "#000",
                      }}
                    >
                      <img
                        src={selfiePreview}
                        alt={t(
                          "identityVerification.selfiePreviewAlt",
                          "Vista previa de tu selfie",
                        )}
                        style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ display: "block", mt: 1.5, fontWeight: 600 }}
                    >
                      {t(
                        "identityVerification.selfieOk",
                        "✓ Selfie capturada",
                      )}
                    </Typography>
                    <Button
                      startIcon={<ReplayIcon />}
                      size="small"
                      onClick={retakeSelfie}
                      sx={{ mt: 1, textTransform: "none" }}
                    >
                      {t("identityVerification.retakeSelfie", "Retomar selfie")}
                    </Button>
                  </Box>
                ) : cameraActive ? (
                  <Box>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        maxHeight: 280,
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PhotoCameraIcon />}
                      onClick={takePhoto}
                      sx={{ mt: 1.5, textTransform: "none" }}
                    >
                      {t("identityVerification.takePhoto", "Tomar foto")}
                    </Button>
                    <Button
                      size="small"
                      onClick={stopCamera}
                      sx={{ mt: 1.5, ml: 1, textTransform: "none" }}
                    >
                      {t("identityVerification.cancelCamera", "Cancelar cámara")}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ py: 3 }}>
                    <CameraAltIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                    />
                    <Typography variant="body1" gutterBottom>
                      {t(
                        "identityVerification.selfiePrompt",
                        "Toma una selfie con tu cámara o sube una foto",
                      )}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", gap: 1.5, justifyContent: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={cameraStarting ? <CircularProgress size={18} color="inherit" /> : <CameraAltIcon />}
                        onClick={startCamera}
                        disabled={cameraStarting}
                        sx={{ textTransform: "none" }}
                      >
                        {t("identityVerification.startCamera", "Iniciar cámara")}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => selfieInputRef.current?.click()}
                        sx={{ textTransform: "none" }}
                      >
                        {t("identityVerification.uploadSelfie", "Subir foto")}
                      </Button>
                    </Box>
                    <input
                      ref={selfieInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={handleSelfieChange}
                    />
                  </Box>
                )}
              </Paper>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                {t(
                  "identityVerification.selfieHint",
                  "La selfie debe mostrar tu rostro de frente. Máx. 5MB (JPG, PNG, WEBP).",
                )}
              </Typography>
            </Box>
          )}

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
        {step === 1 ? (
          <Button
            onClick={goToStep2}
            variant="contained"
            color="primary"
            disabled={!documentType || !selectedFile || uploading}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("identityVerification.continue", "Continuar")}
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setStep(1)}
              disabled={uploading}
              color="inherit"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("common.back", "Atrás")}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!documentType || !selectedFile || !selectedSelfie || uploading}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("identityVerification.submit", "Enviar para Verificación")}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IdentityVerificationDialog;
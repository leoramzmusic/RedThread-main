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
  Chip,
} from "@mui/material";
import { useTranslation } from "next-i18next/pages";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ReplayIcon from "@mui/icons-material/Replay";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
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

  const [page, setPage] = useState<1 | 2>(1);
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
    setPage(1);
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
          "No se pudo acceder a la cámara. Revisa los permisos e inténtalo de nuevo.",
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

  const retakeSelfie = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelectedSelfie(null);
    setSelfiePreview(null);
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

  const renderPageButton = (
    number: 1 | 2,
    label: string,
    done: boolean,
    error: boolean,
  ) => {
    const active = page === number;
    const state = error
      ? "error"
      : done
        ? "done"
        : active
          ? "active"
          : "pending";
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-current={active ? "step" : undefined}
        aria-label={`${number} ${label}`}
        data-state={state}
        onClick={() => setPage(number)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPage(number);
          }
        }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
          borderRadius: 2,
          px: 0.5,
          py: 0.25,
          "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}` },
        }}
      >
        {done && !error ? (
          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
        ) : (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: error
                ? theme.palette.error.main
                : active
                  ? theme.palette.primary.main
                  : "action.disabled",
              color: error || active ? "#fff" : "text.primary",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {number}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: "14px",
            textAlign: "center",
            fontWeight: error || done || active ? 700 : 400,
            color: error
              ? "error.main"
              : done || active
                ? "text.primary"
                : "text.secondary",
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  };

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

        paper: {
          sx: {
            borderRadius: "12px",
            bgcolor: isDark ? "#232428" : "background.paper",
            color: isDark ? "#E0E0E0" : "text.primary",
            backgroundImage: "none",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            m: { xs: 2 },
            width: { xs: "calc(100% - 32px)" },
          },
        }
      }}
      sx={{
        // Center on the content area (which sits right of the sidebar on md+),
        // not on the raw viewport.
        "& .MuiDialog-container": {
          pl: { xs: 0, md: `${drawerWidth}px` },
        },
      }}>
      <DialogTitle
        id="identity-verification-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 800,
          fontSize: "1.25rem",
        }}
      >
        <VerifiedUserIcon color="primary" />
        {t("identityVerification.title", "Verificación de Identidad")}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <LockIcon sx={{ fontSize: 18, color: "text.secondary", mt: "2px" }} />
            <Typography
              variant="body2"
              sx={{ fontSize: "14px", color: "text.secondary" }}
            >
              {t(
                "identityVerification.privacyNotice",
                "Tu documento y tu selfie se usan únicamente para verificar tu identidad y edad. No se mostrarán públicamente ni se compartirán con terceros.",
              )}
            </Typography>
          </Box>

          {formError && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Paginador */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 4,
              mb: 2,
            }}
          >
            {renderPageButton(1, t("identityVerification.stepDocument", "Documento"), hasDocument, !!formError)}
            <Box
              sx={{
                flex: "0 0 40px",
                height: 2,
                mt: "23px",
                bgcolor: hasDocument ? "success.main" : "action.disabled",
                borderRadius: 1,
              }}
            />
            {renderPageButton(2, t("identityVerification.stepSelfie", "Selfie"), hasSelfie, !!cameraError)}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "stretch",
            }}
          >
            {page === 1 && (
            <Paper
              sx={{
                flex: 1,
                minWidth: 0,
                p: 2,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: hasDocument ? "success.main" : "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <DescriptionIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t("identityVerification.stepDocument", "Documento")}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {hasDocument && <CheckCircleIcon color="success" />}
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
                    slotProps: { paper: {
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
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
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
                          sx={{
                            color: "success.main",
                            display: "block",
                            mt: 1,
                            fontWeight: 600
                          }}>
                          {t(
                            "identityVerification.validFile",
                            "✓ Archivo válido, listo para enviar",
                          )}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "success.main",
                          display: "block",
                          mt: 1,
                          fontWeight: 600
                        }}>
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
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {t(
                        "identityVerification.formatsHint",
                        "Formatos: JPG, PNG, WEBP, PDF (máx. 10MB)",
                      )}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Paper>
            )}

            {page === 2 && (
            <Paper
              sx={{
                flex: 1,
                minWidth: 0,
                p: 2,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: hasSelfie ? "success.main" : "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <CameraAltIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t("identityVerification.stepSelfie", "Selfie")}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {hasSelfie && <CheckCircleIcon color="success" />}
              </Box>
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
                      sx={{
                        color: "success.main",
                        display: "block",
                        mt: 1.5,
                        fontWeight: 600
                      }}>
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
                        "Tómate una selfie con tu cámara para validar tu identidad",
                      )}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={cameraStarting ? <CircularProgress size={18} color="inherit" /> : <CameraAltIcon />}
                        onClick={startCamera}
                        disabled={cameraStarting}
                        sx={{ textTransform: "none" }}
                      >
                        {t("identityVerification.takePhoto", "Tomar foto")}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  mt: 1.5
                }}>
                {t(
                  "identityVerification.selfieHint",
                  "La selfie debe mostrar tu rostro de frente para validar tu identidad.",
                )}
              </Typography>
              </Box>
            </Paper>
            )}
          </Box>

          {hasDocument && hasSelfie && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={t(
                  "identityVerification.readyToSubmit",
                  "Listo para enviar",
                )}
                color="success"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          )}

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                  display: "block"
                }}>
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
        {page === 1 ? (
          <>
            <Button
              disabled
              color="inherit"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("identityVerification.previous", "Anterior")}
            </Button>
            <Button
              onClick={() => setPage(2)}
              variant="contained"
              color="primary"
              disabled={uploading}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("identityVerification.continue", "Siguiente")}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setPage(1)}
              disabled={uploading}
              color="inherit"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {t("identityVerification.previous", "Anterior")}
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
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IdentityVerificationDialog;
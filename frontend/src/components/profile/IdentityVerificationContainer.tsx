import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Snackbar,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Control,
  UseFormSetValue,
  UseFormWatch,
  Controller,
} from "react-hook-form";
import DocumentManager from "./DocumentManager";
import IdentityVerificationDialog from "./IdentityVerificationDialog";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import EditIcon from "@mui/icons-material/Edit";
import WarningIcon from "@mui/icons-material/Warning";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import IconButton from "@mui/material/IconButton";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/de";
import "dayjs/locale/it";
import "dayjs/locale/pt";
import "dayjs/locale/nl";
import "dayjs/locale/sv";
import "dayjs/locale/ru";
import "dayjs/locale/zh-cn";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/hi";
import "dayjs/locale/bn";
import "dayjs/locale/ar";
import "dayjs/locale/sw";
import "dayjs/locale/tl-ph";
import "dayjs/locale/ms";
import "dayjs/locale/mi";
import "dayjs/locale/am";

interface IdentityVerificationContainerProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  verified: boolean;
  setVerified: (verified: boolean) => void;
  verificationStatus?: "none" | "pending" | "verified" | "rejected";
  documentUrl?: string;
  documentType?: string;
  rejectionReason?: string;
}

interface BirthDatePickerInputProps {
  field: any;
  error?: { message?: string };
  verified: boolean;
  fieldsLocked: boolean;
  dateLocale: string;
  t: (...args: any[]) => any;
  calendarPaperSx: any;
  onUnlock: () => void;
}

// App language -> dayjs locale (ha has no dayjs locale, falls back to en)
const DAYJS_LOCALE_MAP: Record<string, string> = {
  es: "es",
  en: "en",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt",
  nl: "nl",
  sv: "sv",
  ru: "ru",
  zh: "zh-cn",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  bn: "bn",
  ar: "ar",
  sw: "sw",
  tl: "tl-ph",
  ms: "ms",
  mi: "mi",
  am: "am",
};

/**
 * Birth-date picker with explicitly controlled open state plus a visible
 * calendar toggle, so the popup always opens on tap/click/keyboard.
 */
function BirthDatePickerInput({
  field,
  error,
  verified,
  fieldsLocked,
  dateLocale,
  t,
  calendarPaperSx,
  onUnlock,
}: BirthDatePickerInputProps) {
  const [calOpen, setCalOpen] = React.useState(false);
  const dayjsLocale = DAYJS_LOCALE_MAP[dateLocale] ?? "en";
  const current = field.value ? dayjs(field.value).locale(dayjsLocale) : null;
  const valid = !error && current !== null && current.isValid();

  const openCalendar = () => {
    if (!fieldsLocked) setCalOpen(true);
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={dayjsLocale}
    >      <DatePicker
        value={current}
        open={calOpen}
        onClose={() => setCalOpen(false)}
        disabled={fieldsLocked}
        onChange={(d) =>
          field.onChange(
            d && (d as any).isValid?.()
              ? (d as any).format("YYYY-MM-DD")
              : null,
          )
        }
        format="DD/MM/YYYY"
        disableFuture
        minDate={dayjs("1900-01-01") as any}
        slotProps={{
          textField: {
            fullWidth: true,
            label: t(
              "profile.identityDoc.birthDateLabel",
              "Fecha de Nacimiento",
            ),
            placeholder: "DD/MM/AAAA",
            error: !!error,
            helperText:
              error?.message ||
              (verified
                ? t(
                    "profile.identityDoc.verifiedHint",
                    "Identidad verificada. Toca para editar (perderás la verificación).",
                  )
                : fieldsLocked
                  ? t(
                      "profile.identityDoc.lockedHint",
                      "Campo bloqueado - Documento en revisión",
                    )
                  : valid
                    ? t("profile.birthdate.preview", "{{date}} · {{age}} años", {
                        date: (current as any)
                          .locale(dayjsLocale)
                          .format(
                            t(
                              "profile.birthdate.dateFormat",
                              "D [de] MMMM [de] YYYY",
                            ),
                          ),
                        age: dayjs().diff(current, "year"),
                      })
                    : t(
                        "profile.identityDoc.birthDateHelper",
                        "Selecciona tu fecha de nacimiento",
                      )),
            onClick: fieldsLocked ? onUnlock : openCalendar,
            InputProps: {
              readOnly: fieldsLocked,
              endAdornment: fieldsLocked ? (
                <InputAdornment position="end">
                  <Box
                    component="span"
                    onClick={onUnlock}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <EditIcon color="action" />
                  </Box>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label={t(
                      "profile.birthdate.openCalendar",
                      "Abrir calendario",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCalendar();
                    }}
                  >
                    <CalendarMonthIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
            sx: {
              "& .MuiInputBase-input": {
                cursor: fieldsLocked ? "pointer" : "text",
              },
            },
          } as any,
          desktopPaper: { sx: calendarPaperSx },
          mobilePaper: { sx: calendarPaperSx },
          popper: {
            sx: {
              "& .MuiPaper-root": calendarPaperSx,
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}

const IdentityVerificationContainer: React.FC<
  IdentityVerificationContainerProps
> = ({
  control,
  setValue,
  watch,
  verified,
  setVerified,
  verificationStatus = "none",
  documentUrl,
  documentType,
  rejectionReason,
}) => {
  const { t, i18n } = useTranslation("common");
  const dateLocale = (i18n.language || "es").split("-")[0];
  const dayjsLocale = DAYJS_LOCALE_MAP[dateLocale] ?? "en";
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
        setValue("real_name", extractedData.name);
      }

      if (extractedData?.birth_date) {
        setValue("birth_date", extractedData.birth_date);
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
  const fieldsLocked =
    (verificationStatus === "pending" || verified) && !isUnlocked;

  const handleUnlockClick = () => {
    // If already unlocked (shouldn't be clickable if disabled is false, making this redundant but safe)
    if (!fieldsLocked) return;
    setUnlockDialogOpen(true);
  };

  const confirmUnlock = () => {
    setIsUnlocked(true);
    setUnlockDialogOpen(false);
  };

  const calendarPaperSx = {
    backgroundColor: (theme: any) =>
      theme.palette.mode === "dark" ? "#232428" : theme.palette.background.paper,
    backgroundImage: "none",
    borderRadius: 3,
    color: (theme: any) =>
      theme.palette.mode === "dark" ? "#E0E0E0" : theme.palette.text.primary,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  };

  const validateBirthDate = (value: string | null | undefined) => {
    if (!value) return true;
    const d = dayjs(value);
    if (!d.isValid())
      return t("profile.birthdate.invalid", "Fecha inválida.");
    if (d.isAfter(dayjs(), "day"))
      return t("profile.birthdate.future", "La fecha no puede ser futura.");
    if (d.isBefore(dayjs("1900-01-01"), "day"))
      return t("profile.birthdate.tooOld", "Fecha fuera de rango.");
    if (dayjs().diff(d, "year") < 18)
      return t("profile.birthdate.underage", "Debes tener al menos 18 años.");
    return true;
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
                value={field.value || ""}
                fullWidth
                label={t("profile.identityDoc.realNameLabel", "Nombre Real")}
                disabled={fieldsLocked}
                onClick={fieldsLocked ? handleUnlockClick : undefined}
                InputProps={{
                  readOnly: fieldsLocked,
                  endAdornment: (
                    <InputAdornment position="end">
                      {verified ? (
                        <VerifiedUserIcon sx={{ color: "success.main" }} />
                      ) : fieldsLocked ? (
                        <Box
                          component="span"
                          onClick={handleUnlockClick}
                          sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <EditIcon color="action" />
                        </Box>
                      ) : null}
                    </InputAdornment>
                  ),
                }}
                helperText={
                  verified
                    ? t(
                        "profile.identityDoc.verifiedHint",
                        "Identidad verificada. Toca para editar (perderás la verificación).",
                      )
                    : fieldsLocked
                      ? t(
                          "profile.identityDoc.lockedHint",
                          "Campo bloqueado - Documento en revisión",
                        )
                      : t(
                          "profile.identityDoc.realNameHelper",
                          "Ingresa tu nombre completo como aparece en tu documento",
                        )
                }
                sx={{
                  "& .MuiInputBase-input": {
                    cursor: fieldsLocked ? "pointer" : "text",
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="birth_date"
            control={control}
            rules={{ validate: validateBirthDate }}
            render={({ field, fieldState: { error } }) => (
              <BirthDatePickerInput
                field={field}
                error={error}
                verified={verified}
                fieldsLocked={fieldsLocked}
                dateLocale={dateLocale}
                t={t}
                calendarPaperSx={calendarPaperSx}
                onUnlock={handleUnlockClick}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Unlock Warning Dialog */}
      <Dialog
        open={unlockDialogOpen}
        onClose={() => setUnlockDialogOpen(false)}
      >
        <DialogTitle
          sx={{
            color: "warning.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningIcon />
          {t(
            "profile.identityDoc.unlockTitle",
            "¿Editar información sensible?",
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              "profile.identityDoc.unlockBody1",
              "Tu perfil está verificado o en revisión. Si editas tu nombre real o fecha de nacimiento, perderás tu estado de verificación y tendrás que solicitarlo nuevamente.",
            )}
            <br />
            <br />
            {t(
              "profile.identityDoc.unlockBody2",
              "¿Estás seguro de que quieres continuar?",
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)} color="inherit">
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            onClick={confirmUnlock}
            color="warning"
            variant="contained"
            autoFocus
          >
            {t(
              "profile.identityDoc.confirmUnlock",
              "Sí, editar y perder verificación",
            )}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeMessage}
          severity={
            message.includes("✓")
              ? "success"
              : message.includes("Error")
                ? "error"
                : "info"
          }
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default IdentityVerificationContainer;

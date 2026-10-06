import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { useTranslation } from "next-i18next";
import {
  Edit as EditIcon,
  VerifiedUser as VerifiedUserIcon,
  Info,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import IdentityVerificationContainer from "../../IdentityVerificationContainer";
import { COUNTRY_CODES } from "../../../../constants/countryCodes";
import { UsernameEditor } from "../../UsernameEditor";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";

interface EditBasicInfoProps {
  control: any;
  setValue: any;
  watch: any;
  profile: any;
  verified: boolean;
  setVerified: (verified: boolean) => void;
  phone: string;
  setPhone: (phone: string) => void;
  countryCode: string;
  setCountryCode: (code: string) => void;
  phoneVerified: boolean;
  isVerifyingPhone: boolean;
  setNicknameDialogOpen: (open: boolean) => void;
  handleVerifyPhone: () => void;
  handleChangePhoneRequest: () => void;
  setIdentityInfoOpen?: (open: boolean) => void;
}

export default function EditBasicInfo({
  control,
  setValue,
  watch,
  profile,
  verified,
  setVerified,
  phone,
  setPhone,
  countryCode,
  setCountryCode,
  phoneVerified,
  isVerifyingPhone,
  setNicknameDialogOpen,
  handleVerifyPhone,
  handleChangePhoneRequest,
  setIdentityInfoOpen = () => {},
}: EditBasicInfoProps) {
  const { t, i18n } = useTranslation("common");
  const dateLocale = (i18n.language || "es").split("-")[0];

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
      return t(
        "profile.birthdate.future",
        "La fecha no puede ser futura.",
      );
    if (d.isBefore(dayjs("1900-01-01"), "day"))
      return t(
        "profile.birthdate.tooOld",
        "Fecha fuera de rango.",
      );
    if (dayjs().diff(d, "year") < 18)
      return t(
        "profile.birthdate.underage",
        "Debes tener al menos 18 años.",
      );
    return true;
  };

  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: "relative",
          border: (theme) => "1px solid " + theme.palette.divider,
          boxShadow: 1,
          backgroundImage: "none",
          borderRadius: "16px",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            pr={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Info color="action" />
              <Typography variant="h6" fontWeight="600">
                {t("profile.sections.identity.title", "Identidad")}
              </Typography>
            </Box>
            <Tooltip
              title={t("profile.identity.infoModal.title", "¿Por qué pedimos tu identidad?")}
            >
              <IconButton
                size="small"
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdentityInfoOpen(true);
                }}
              >
                <Info fontSize="small" color="info" />
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <IdentityVerificationContainer
                control={control}
                setValue={setValue}
                watch={watch}
                verified={verified}
                setVerified={setVerified}
                verificationStatus={
                  profile.identity_verification_status || "none"
                }
                documentUrl={profile.identity_document_url}
                documentType={profile.identity_document_type}
                rejectionReason={profile.identity_rejection_reason}
              />
            </Grid>

            {/* Separador: documento | datos personales */}
            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="display_name"
                control={control}
                rules={{
                  required: t(
                    "profile.required_field",
                    "Este campo es requerido",
                  ),
                  minLength: {
                    value: 2,
                    message: t("profile.min_length_2", "Mínimo 2 caracteres"),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t("profile.nickname_label", "Apodo / Nickname")}
                    placeholder={t(
                      "profile.nickname_placeholder",
                      "Cómo quieres que te llamen",
                    )}
                    error={!!error}
                    helperText={
                      error?.message ||
                      t(
                        "profile.nickname_helper",
                        "Este es el nombre que verán los demás. Puede contener espacios y acentos.",
                      )
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <UsernameEditor
                currentUsername={profile.nickname || ""}
                onUsernameChange={(newUsername) =>
                  setValue("nickname", newUsername)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="birth_date"
                control={control}
                rules={{ validate: validateBirthDate }}
                render={({ field, fieldState: { error } }) => {
                  const current = field.value
                    ? dayjs(field.value)
                    : null;
                  const valid =
                    !error && current !== null && current.isValid();
                  return (
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale={dateLocale === "es" ? "es" : "en"}
                    >
                      <DatePicker
                        value={current}
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
                              "profile.birthdate.label",
                              "Fecha de nacimiento",
                            ),
                            placeholder: "DD/MM/AAAA",
                            error: !!error,
                            helperText:
                              error?.message ||
                              (valid
                                ? t(
                                    "profile.birthdate.preview",
                                    "{{date}} · {{age}} años",
                                    {
                                      date: (current as any)
                                        .locale(dateLocale === "es" ? "es" : "en")
                                        .format("D [de] MMMM [de] YYYY"),
                                      age: dayjs().diff(current, "year"),
                                    },
                                  )
                                : t(
                                    "profile.birthdate.helper",
                                    "La usamos para verificar tu edad. Nunca se muestra sin tu permiso.",
                                  )),
                          } as any,
                          desktopPaper: { sx: calendarPaperSx },
                          mobilePaper: { sx: calendarPaperSx },
                        }}
                      />
                    </LocalizationProvider>
                  );
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t("profile.email_label", "Email")}
                    type="email"
                    helperText={t(
                      "profile.email_helper",
                      "Tu correo electrónico",
                    )}
                  />
                )}
              />
            </Grid>

            {/* Separador: datos personales | contacto */}
            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="flex-start">
                <Autocomplete
                  options={COUNTRY_CODES}
                  autoHighlight
                  getOptionLabel={(option) =>
                    option.label + " (+" + option.phone + ")"
                  }
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option.label.toLowerCase().includes(searchTerm) ||
                        option.phone.includes(searchTerm) ||
                        option.code.toLowerCase().includes(searchTerm),
                    );
                  }}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                      {...props}
                    >
                      {option.label} (+{option.phone})
                    </Box>
                  )}
                  value={
                    COUNTRY_CODES.find((c) => "+" + c.phone === countryCode) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setCountryCode("+" + newValue.phone);
                    }
                  }}
                  disabled={phoneVerified}
                  sx={{ width: 250 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("profile.country_label", "País")}
                      placeholder={t(
                        "profile.country_placeholder",
                        "Buscar por país o código...",
                      )}
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: "new-password",
                      }}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label={t("profile.phone_label", "Teléfono")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  helperText={t(
                    "profile.phone_helper",
                    "Puedes usar este número para iniciar sesión en tu cuenta",
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

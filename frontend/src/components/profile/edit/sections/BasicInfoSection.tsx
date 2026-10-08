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
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
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
  emailVerified: boolean;
  isVerifyingEmail: boolean;
  setNicknameDialogOpen: (open: boolean) => void;
  handleVerifyPhone: () => void;
  handleVerifyEmail: () => void;
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
  emailVerified,
  isVerifyingEmail,
  setNicknameDialogOpen,
  handleVerifyPhone,
  handleVerifyEmail,
  handleChangePhoneRequest,
  setIdentityInfoOpen = () => {},
}: EditBasicInfoProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const inputSx = {
    "& .MuiOutlinedInput-root": { height: 48 },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderWidth: 2,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
  };

  const renderVerifyControl = ({
    verified,
    verifying,
    onVerify,
    onChangeRequest,
  }: {
    verified: boolean;
    verifying: boolean;
    onVerify: () => void;
    onChangeRequest?: () => void;
  }) => {
    const btnBaseSx = {
      borderRadius: "10px",
      textTransform: "none",
      fontWeight: 600,
      minHeight: 40,
      px: 1.75,
      transition:
        "background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      "&:active": { transform: "scale(0.96)" },
    };
    if (verified) {
      return (
        <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
          <Tooltip title={t("profile.sections.identity.verification.verifiedTooltip")}>
            <Chip
              icon={<VerifiedUserIcon fontSize="small" />}
              label={t("profile.sections.identity.verification.verified")}
              color="success"
              size="small"
              sx={{
                fontWeight: 600,
                borderRadius: "10px",
                transition: "box-shadow 150ms ease",
                "&:hover": {
                  boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.55)}`,
                },
              }}
            />
          </Tooltip>
          {onChangeRequest && (
            <Button
              size="small"
              onClick={onChangeRequest}
              sx={{
                ...btnBaseSx,
                minHeight: 32,
                color: "text.secondary",
              }}
            >
              {t("profile.sections.identity.verification.change")}
            </Button>
          )}
        </Box>
      );
    }
    if (verifying) {
      return (
        <Button
          size="small"
          variant="contained"
          color="warning"
          disabled
          sx={btnBaseSx}
        >
          <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />
          {t("profile.sections.identity.verification.verify")}
        </Button>
      );
    }
    return (
      <Button
        size="small"
        variant="contained"
        startIcon={<VerifiedUserIcon fontSize="small" />}
        onClick={onVerify}
        sx={{
          ...btnBaseSx,
          "&:hover": {
            boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.45)}`,
          },
        }}
      >
        {t("profile.sections.identity.verification.verify")}
      </Button>
    );
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
                  <TextField size="small"
                    {...field}
                    fullWidth
                    sx={inputSx}
                    label={
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {t("profile.nickname_label", "Apodo / Nickname")}
                        <Tooltip
                          title={t(
                            "profile.nickname_helper",
                            "Este es el nombre que verán los demás. Puede contener espacios y acentos.",
                          )}
                        >
                          <Info
                            fontSize="small"
                            color="action"
                            sx={{ verticalAlign: "middle" }}
                          />
                        </Tooltip>
                      </Box>
                    }
                    placeholder={t(
                      "profile.nickname_placeholder",
                      "Cómo quieres que te llamen",
                    )}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1.5 }}>
              <UsernameEditor
                currentUsername={profile.nickname || ""}
                onUsernameChange={(newUsername) =>
                  setValue("nickname", newUsername)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField size="small"
                      {...field}
                      sx={{ ...inputSx, flex: "1 1 240px", minWidth: 220 }}
                      label={t("profile.email_label", "Email")}
                      type="email"
                    />
                  )}
                />
                <Box display="flex" alignItems="flex-start" sx={{ mt: 0.5 }}>
                  {renderVerifyControl({
                    verified: emailVerified,
                    verifying: isVerifyingEmail,
                    onVerify: handleVerifyEmail,
                  })}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
                <Autocomplete size="small"
                  options={COUNTRY_CODES}
                  autoHighlight
                  getOptionLabel={(option) =>
                    option.flag + " " + option.label + " (+" + option.phone + ")"
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
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                      {...props}
                    >
                      {option.flag} {option.label} (+{option.phone})
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
                  sx={{ flex: "0 0 210px" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={inputSx}
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
                <TextField size="small"
                  sx={{ ...inputSx, flex: "1 1 220px", minWidth: 200 }}
                  label={t("profile.phone_label", "Teléfono")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  disabled={phoneVerified}
                  helperText={t(
                    "profile.phone_helper",
                    "Puedes usar este número para iniciar sesión en tu cuenta",
                  )}
                />
                <Box display="flex" alignItems="flex-start" sx={{ mt: 0.5 }}>
                  {renderVerifyControl({
                    verified: phoneVerified,
                    verifying: isVerifyingPhone,
                    onVerify: handleVerifyPhone,
                    onChangeRequest: phoneVerified ? handleChangePhoneRequest : undefined,
                  })}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

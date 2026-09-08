import { Grid, Paper, Typography, TextField, Button, Box, InputAdornment, Autocomplete, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Controller } from 'react-hook-form';
import { Edit as EditIcon, VerifiedUser as VerifiedUserIcon, Info, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import IdentityVerificationContainer from '../../IdentityVerificationContainer';
import { COUNTRY_CODES } from '../../../../constants/countryCodes';
import { UsernameEditor } from '../../UsernameEditor';

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
  handleChangePhoneRequest
}: EditBasicInfoProps) {
  return (
    <Grid item xs={12}>
      <Accordion
        defaultExpanded
        sx={{
          position: 'relative',
          border: (theme) => '1px solid ' + theme.palette.divider,
          boxShadow: 1,
          backgroundImage: 'none',
          borderRadius: '12px !important',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ px: 3, py: 1 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Info color="action" />
            <Typography variant="h6">Información Básica</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <IdentityVerificationContainer
                control={control}
                setValue={setValue}
                watch={watch}
                verified={verified}
                setVerified={setVerified}
                verificationStatus={profile.identity_verification_status || 'none'}
                documentUrl={profile.identity_document_url}
                documentType={profile.identity_document_type}
                rejectionReason={profile.identity_rejection_reason}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="display_name"
                control={control}
                rules={{ required: 'Este campo es requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Apodo / Nickname"
                    placeholder="Cómo quieres que te llamen"
                    error={!!error}
                    helperText={error?.message || "Este es el nombre que verán los demás. Puede contener espacios y acentos."}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <UsernameEditor
                currentUsername={profile.nickname || ''}
                onUsernameChange={(newUsername) => setValue('nickname', newUsername)}
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
                    label="Email"
                    type="email"
                    helperText="Tu correo electrónico"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="flex-start">
                <Autocomplete
                  options={COUNTRY_CODES}
                  autoHighlight
                  getOptionLabel={(option) => option.label + ' (+' + option.phone + ')'}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(option =>
                      option.label.toLowerCase().includes(searchTerm) ||
                      option.phone.includes(searchTerm) ||
                      option.code.toLowerCase().includes(searchTerm)
                    );
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                      {option.label} (+{option.phone})
                    </Box>
                  )}
                  value={COUNTRY_CODES.find(c => '+' + c.phone === countryCode) || null}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setCountryCode('+' + newValue.phone);
                    }
                  }}
                  disabled={phoneVerified}
                  sx={{ width: 250 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="País"
                      placeholder="Buscar por país o código..."
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password',
                      }}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  helperText="Puedes usar este número para iniciar sesión en tu cuenta"
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

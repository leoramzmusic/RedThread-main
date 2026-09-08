import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Controller, Control } from 'react-hook-form';

interface RealNameFieldProps {
  control: Control<any>;
  verified: boolean;
  isUploading: boolean;
  onUploadClick: () => void;
}

const RealNameField: React.FC<RealNameFieldProps> = ({
  control,
  verified,
  isUploading,
  onUploadClick,
}) => {
  const handleUploadClick = () => {
    // Allow upload directly without browser popup
    onUploadClick();
  };

  return (
    <Controller
      name="real_name"
      control={control}
      render={({ field }) => (
        <TextField 
          {...field} 
          fullWidth 
          label="Nombre Real" 
          helperText={verified ? "Identidad verificada" : "Haz clic en el ícono para subir tu documento"}
          InputProps={{
            readOnly: verified,
            endAdornment: (
              <InputAdornment position="end">
                {verified && (
                  <VerifiedUserIcon sx={{ color: 'success.main', mr: 1 }} />
                )}
                <Tooltip 
                  title={verified ? "Volver a subir documento" : "Subir documento de identidad"} 
                  arrow
                >
                  <IconButton 
                    size="small" 
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    sx={{ color: 'text.secondary' }}
                  >
                    {isUploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <UploadFileIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
};

export default RealNameField;

import { Box, Chip, Paper, TextField, Typography } from "@mui/material";

export interface CareFormulaJsonEditorProps {
  /** Current JSON text (owned by the page). */
  value: string;
  /** Whether the last parse succeeded. */
  valid: boolean;
  /** Parse error to surface when invalid. */
  error?: string | null;
  onChange: (text: string) => void;
}

/**
 * Bidirectional JSON view: slider changes rewrite `value`; a valid edit parses
 * back into sliders. Invalid text shows a red chip and the last valid state is
 * kept (that decision lives in the page).
 */
export default function CareFormulaJsonEditor({
  value,
  valid,
  error = null,
  onChange,
}: CareFormulaJsonEditorProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          JSON de la fórmula
        </Typography>
        <Chip
          data-testid="json-validity-chip"
          label={valid ? "JSON válido" : "JSON inválido"}
          color={valid ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      </Box>
      <TextField
        data-testid="formula-json"
        multiline
        fullWidth
        minRows={14}
        value={value}
        error={!valid}
        helperText={
          !valid && error ? error : "slider → JSON; JSON válido → sliders."
        }
        onChange={(event) => onChange(event.target.value)}
        sx={{ "& textarea": { fontFamily: "monospace", fontSize: "0.8rem" } }}
      />
    </Paper>
  );
}

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import type { CareFormula } from "../../services/careFormulaService";

export interface CareVersionsPanelProps {
  versions: CareFormula[];
  activeVersion: number | null;
  loading?: boolean;
  onRollback: (version: number) => void;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("es-ES");
};

/** Plain `CareFormula[]` history (no enriched diff) + per-row rollback. */
export default function CareVersionsPanel({
  versions,
  activeVersion,
  loading = false,
  onRollback,
}: CareVersionsPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }} data-testid="versions-panel">
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <HistoryIcon fontSize="small" /> Historial de versiones
      </Typography>
      {loading ? (
        <Box
          sx={{ display: "flex", justifyContent: "center", py: 3 }}
          data-testid="versions-loading"
        >
          <CircularProgress size={24} />
        </Box>
      ) : versions.length === 0 ? (
        <Typography variant="body2">Sin versiones registradas.</Typography>
      ) : (
        <Stack spacing={1}>
          {versions.map((version) => {
            const isActive = version.version === activeVersion;
            return (
              <Stack
                key={version.version}
                data-testid={`version-row-${version.version}`}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ fontWeight: 700 }}
                  >
                    v{version.version}{" "}
                    {isActive && (
                      <Chip
                        data-testid="version-active"
                        label="Activa"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {formatDate(version.created_at)} · {version.created_by}
                  </Typography>
                </Box>
                {!isActive && (
                  <Button
                    data-testid={`rollback-${version.version}`}
                    size="small"
                    variant="outlined"
                    onClick={() => onRollback(version.version)}
                  >
                    Restaurar
                  </Button>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}

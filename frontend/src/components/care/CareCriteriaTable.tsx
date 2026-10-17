import {
  Box,
  IconButton,
  Paper,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";

export interface CareCriteriaTableProps {
  /** Editable weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Keys currently locked (excluded from normalization). */
  locked: string[];
  /** Row to highlight (driven by the diagram hover / handoff focus). */
  focus?: CareDimensionKey | null;
  /** Slider floor in percent (default 0). */
  minPercent?: number;
  /** Slider ceiling in percent (default 40, per spec). */
  maxPercent?: number;
  onSliderChange: (key: CareDimensionKey, percent: number) => void;
  onSliderCommit: (key: CareDimensionKey, percent: number) => void;
  onToggleLock: (key: CareDimensionKey) => void;
  onProbar: (key: CareDimensionKey) => void;
  onBlockHover?: (key: CareDimensionKey | null) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Presentational editor for the 7 canonical CARE weights (matrix M).
 * Emits intent only — no state, no network — so the container page owns logic.
 */
export default function CareCriteriaTable({
  blocks,
  locked,
  focus = null,
  minPercent = 0,
  maxPercent = 40,
  onSliderChange,
  onSliderCommit,
  onToggleLock,
  onProbar,
  onBlockHover,
}: CareCriteriaTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell width="40%">Dimensión (Matriz M)</TableCell>
            <TableCell width="40%">Peso</TableCell>
            <TableCell width="10%">Bloqueo</TableCell>
            <TableCell align="right" width="10%">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CARE_DIMENSIONS.map((dim) => {
            const isLocked = locked.includes(dim.key);
            const percent = percentOf(blocks[dim.key]);
            return (
              <TableRow
                key={dim.key}
                hover
                selected={focus === dim.key}
                data-testid={`criteria-row-${dim.key}`}
                data-focus={focus === dim.key ? "true" : "false"}
                onMouseEnter={() => onBlockHover?.(dim.key)}
                onMouseLeave={() => onBlockHover?.(null)}
              >
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Box
                      data-testid={`care-chip-${dim.key}`}
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        color: "#fff",
                        bgcolor: dim.color,
                      }}
                    >
                      {dim.chip}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {dim.label}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Slider
                      data-testid={`care-slider-${dim.key}`}
                      value={clamp(percent, minPercent, maxPercent)}
                      min={minPercent}
                      max={maxPercent}
                      step={1}
                      size="small"
                      disabled={isLocked}
                      onChange={(_, v) =>
                        onSliderChange(dim.key, Array.isArray(v) ? v[0] : v)
                      }
                      onChangeCommitted={(_, v) =>
                        onSliderCommit(dim.key, Array.isArray(v) ? v[0] : v)
                      }
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography
                      variant="body2"
                      data-testid={`care-percent-${dim.key}`}
                      sx={{ minWidth: 44, fontWeight: 800 }}
                    >
                      {percent}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={isLocked ? "Desbloquear" : "Bloquear"}>
                    <IconButton
                      data-testid={`care-lock-${dim.key}`}
                      size="small"
                      color={isLocked ? "primary" : "default"}
                      onClick={() => onToggleLock(dim.key)}
                    >
                      {isLocked ? (
                        <LockIcon fontSize="small" />
                      ) : (
                        <LockOpenIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Probar (enfocar dimensión)">
                    <IconButton
                      data-testid={`care-probar-${dim.key}`}
                      size="small"
                      onClick={() => onProbar(dim.key)}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

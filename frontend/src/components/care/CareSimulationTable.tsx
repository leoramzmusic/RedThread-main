import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { SimulateResult } from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

export interface CareSimulationTableProps {
  result: SimulateResult | null;
  loading?: boolean;
}

/**
 * Ranking table from `POST /formula/simulate`: current vs proposed score, the
 * proposed score with χ removed, and the per-candidate Δ.
 */
export default function CareSimulationTable({
  result,
  loading = false,
}: CareSimulationTableProps) {
  if (loading) {
    return (
      <Typography
        variant="body2"
        data-testid="simulation-loading"
        sx={{ py: 2 }}
      >
        Simulando...
      </Typography>
    );
  }
  if (!result) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="simulation-table">
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        Ranking simulado
        {result.mock && (
          <Chip
            data-testid="sim-mock"
            label="Datos mock (8 perfiles)"
            size="small"
            variant="outlined"
          />
        )}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Candidato</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">Propuesto (χ)</TableCell>
              <TableCell align="right">Sin χ</TableCell>
              <TableCell align="right">Δ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.ranking.map((row) => (
              <TableRow
                key={row.candidate_id}
                data-testid={`sim-row-${row.candidate_id}`}
              >
                <TableCell>{row.candidate_id}</TableCell>
                <TableCell align="right">
                  {row.score_current.toFixed(3)}
                </TableCell>
                <TableCell align="right">
                  {row.score_proposed.toFixed(3)}
                </TableCell>
                <TableCell
                  align="right"
                  data-testid={`sim-without-chi-${row.candidate_id}`}
                >
                  {(row.score_proposed - row.chi_proposed).toFixed(3)}
                </TableCell>
                <TableCell
                  align="right"
                  data-testid={`sim-delta-${row.candidate_id}`}
                >
                  {formatDelta(row.delta)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="body2"
        data-testid="sim-mean-delta"
        sx={{ mt: 1, fontWeight: 700 }}
      >
        Δ score medio: {formatDelta(result.mean_delta)}
      </Typography>
    </Paper>
  );
}

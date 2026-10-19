import {
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CARE_DIMENSION_BY_KEY } from "../../constants/careDimensions";
import type { PreferenceInsights } from "../../services/carePreferencesAdminService";

const label = (key: string) => CARE_DIMENSION_BY_KEY[key]?.label ?? key;
const score = (value: number) => value.toFixed(1);

export default function CarePreferenceInsights({
  insights,
}: {
  insights: PreferenceInsights | null;
}) {
  if (!insights) return null;
  const top = insights.top_dimensions ?? [];

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5 }} data-testid="preferences-top">
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Top 3 dimensiones más valoradas
        </Typography>
        {top.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            data-testid="preferences-top-empty"
          >
            Aún no hay preferencias registradas.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {top.map((row) => (
              <Box
                key={row.dimension}
                data-testid={`preferences-top-${row.dimension}`}
              >
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", mb: 0.5 }}
                >
                  <Typography variant="body2">
                    {label(row.dimension)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {score(row.avg_score)} · {row.count}{" "}
                    {row.count === 1 ? "registro" : "registros"}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={row.avg_score}
                  sx={{ height: 8, borderRadius: "4px" }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5 }}
            data-testid="preferences-distribution"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Distribución por dimensión
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dimensión</TableCell>
                  <TableCell align="right">Registros</TableCell>
                  <TableCell align="right">Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {insights.dimensions.map((row) => (
                  <TableRow
                    key={row.dimension}
                    data-testid={`preferences-dimension-${row.dimension}`}
                  >
                    <TableCell>{label(row.dimension)}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{score(row.avg_score)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5 }}
            data-testid="preferences-tags"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Tags
            </Typography>
            {insights.tags.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                data-testid="preferences-tags-empty"
              >
                Sin tags registrados.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell align="right">Registros</TableCell>
                    <TableCell align="right">Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insights.tags.map((row) => (
                    <TableRow
                      key={row.tag}
                      data-testid={`preferences-tag-${row.tag}`}
                    >
                      <TableCell>{row.tag}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right">
                        {score(row.avg_score)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

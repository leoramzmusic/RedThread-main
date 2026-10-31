import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Schedule {
  id: string;
  name: string;
  type: string;
  cron_expression?: string;
  start_date?: string;
  end_date?: string;
  campaign_id?: string;
  is_active?: boolean;
}

export default function SchedulesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "once",
    cron_expression: "",
    start_date: "",
    end_date: "",
    campaign_id: "",
    is_active: true,
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/api/admin/notifications/employees/schedules",
      );
      setSchedules(res.data || []);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      enqueueSnackbar("Error al cargar programaciones", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      type: "once",
      cron_expression: "",
      start_date: "",
      end_date: "",
      campaign_id: "",
      is_active: true,
    });
    setOpen(true);
  };

  const handleOpenEdit = (sched: Schedule) => {
    setEditing(sched);
    setForm({
      name: sched.name || "",
      type: sched.type,
      cron_expression: sched.cron_expression || "",
      start_date: sched.start_date || "",
      end_date: sched.end_date || "",
      campaign_id: sched.campaign_id || "",
      is_active: sched.is_active ?? true,
    });
    setOpen(true);
  };

  const handleChange =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: form.name,
        type: form.type,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        campaign_id: form.campaign_id || undefined,
        is_active: form.is_active,
      };
      if (form.type === "recurring" && form.cron_expression) {
        payload.cron_expression = form.cron_expression;
      }

      if (editing) {
        await adminApiClient.put(
          `/api/admin/notifications/employees/schedules/${editing.id}`,
          payload,
        );
        enqueueSnackbar("Programación actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(
          "/api/admin/notifications/employees/schedules",
          payload,
        );
        enqueueSnackbar("Programación creada", { variant: "success" });
      }
      setOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error("Save schedule failed:", error);
      enqueueSnackbar("Error al guardar la programación", {
        variant: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta programación?")) return;
    try {
      await adminApiClient.delete(
        `/api/admin/notifications/employees/schedules/${id}`,
      );
      enqueueSnackbar("Programación eliminada", { variant: "success" });
      fetchSchedules();
    } catch (error) {
      console.error("Delete schedule failed:", error);
      enqueueSnackbar("Error al eliminar la programación", {
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  const recurring = form.type === "recurring";

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ⏰ Programaciones de Empleados
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Programa envíos de notificaciones para empleados
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Nueva Programación
            </Button>
          </Box>

          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Expresión Cron</TableCell>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((sched) => (
                    <TableRow key={sched.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {sched.name}
                      </TableCell>
                      <TableCell>{sched.type}</TableCell>
                      <TableCell>{sched.cron_expression || "-"}</TableCell>
                      <TableCell>
                        {sched.start_date
                          ? new Date(sched.start_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sched.end_date
                          ? new Date(sched.end_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sched.is_active ? "Activa" : "Inactiva"}
                          size="small"
                          color={sched.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(sched)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(sched.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schedules.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay programaciones disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {editing ? "Editar Programación" : "Nueva Programación"}
            </DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}
            >
              <TextField
                fullWidth
                label="Nombre *"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
              <TextField
                fullWidth
                label="Tipo *"
                select
                value={form.type}
                onChange={handleChange("type")}
                required
                slotProps={{ select: {} }}
              >
                <MenuItem value="once">Una vez</MenuItem>
                <MenuItem value="recurring">Recurrente</MenuItem>
              </TextField>
              {recurring && (
                <TextField
                  fullWidth
                  label="Expresión Cron"
                  placeholder="Ej: 0 9 * * *"
                  value={form.cron_expression}
                  onChange={handleChange("cron_expression")}
                />
              )}
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange("start_date")}
              />
              <TextField
                fullWidth
                label="Fecha de Fin"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange("end_date")}
              />
            </DialogContent>
            <DialogActions sx={{ pt: 0 }}>
              <Button onClick={() => setOpen(false)} startIcon={<CancelIcon />}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
              >
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}

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
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import FilterListIcon from "@mui/icons-material/FilterList";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Audience {
  id: string;
  name: string;
  description?: string;
  filters?: Record<string, any>;
  estimated_count?: number;
  is_active?: boolean;
}

export default function AudiencesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Audience | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    country: "",
    city: "",
    age_min: "",
    age_max: "",
    gender: "",
    is_active: true,
  });

  const fetchAudiences = async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.get(
        "/api/admin/notifications/employees/audiences",
      );
      setAudiences(res.data || []);
    } catch (error) {
      console.error("Failed to fetch audiences:", error);
      enqueueSnackbar("Error al cargar audiencias", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiences();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      country: "",
      city: "",
      age_min: "",
      age_max: "",
      gender: "",
      is_active: true,
    });
    setOpen(true);
  };

  const handleOpenEdit = (aud: Audience) => {
    setEditing(aud);
    const f = aud.filters || {};
    setForm({
      name: aud.name || "",
      description: aud.description || "",
      country: f.country || "",
      city: f.city || "",
      age_min: f.age_min || "",
      age_max: f.age_max || "",
      gender: f.gender || "",
      is_active: aud.is_active ?? true,
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
      const filters: Record<string, any> = {};
      if (form.country) filters.country = form.country;
      if (form.city) filters.city = form.city;
      if (form.age_min) filters.age_min = Number(form.age_min);
      if (form.age_max) filters.age_max = Number(form.age_max);
      if (form.gender) filters.gender = form.gender;

      if (editing) {
        await adminApiClient.put(
          `/api/admin/notifications/employees/audiences/${editing.id}`,
          {
            name: form.name,
            description: form.description,
            filters,
            is_active: form.is_active,
          },
        );
        enqueueSnackbar("Audiencia actualizada", { variant: "success" });
      } else {
        await adminApiClient.post(
          "/api/admin/notifications/employees/audiences",
          {
            name: form.name,
            description: form.description,
            filters,
            is_active: form.is_active,
          },
        );
        enqueueSnackbar("Audiencia creada", { variant: "success" });
      }
      setOpen(false);
      fetchAudiences();
    } catch (error) {
      console.error("Save audience failed:", error);
      enqueueSnackbar("Error al guardar la audiencia", { variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Mover esta audiencia a la papelera?")) return;
    try {
      await adminApiClient.delete(
        `/api/admin/notifications/employees/audiences/${id}`,
      );
      enqueueSnackbar("Audiencia movida a papelera", { variant: "success" });
      fetchAudiences();
    } catch (error) {
      console.error("Delete audience failed:", error);
      enqueueSnackbar("Error al eliminar la audiencia", { variant: "error" });
    }
  };

  const handleEstimate = async () => {
    try {
      const res = await adminApiClient.post(
        "/api/admin/notifications/employees/audiences/estimate",
        { filters: {} },
      );
      enqueueSnackbar(
        `Empleados estimados: ${res.data?.estimated_count || res.data?.count || "N/A"}`,
        { variant: "info" },
      );
    } catch (error) {
      enqueueSnackbar("Error al calcular estimación", { variant: "error" });
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
                  👥 Audiencias de Empleados
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Define segmentos de empleados para campañas
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleEstimate}
              >
                Estimar Empleados
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Nueva Audiencia
              </Button>
            </Box>
          </Box>

          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Empleados Estimados</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audiences.map((aud) => (
                    <TableRow key={aud.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{aud.name}</TableCell>
                      <TableCell>{aud.description || "-"}</TableCell>
                      <TableCell>{aud.estimated_count ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={aud.is_active ? "Activa" : "Inactiva"}
                          size="small"
                          color={aud.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(aud)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(aud.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {audiences.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ textAlign: "center", color: "text.secondary" }}
                      >
                        No hay audiencias disponibles.
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
              {editing ? "Editar Audiencia" : "Nueva Audiencia"}
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
                label="Descripción"
                value={form.description}
                onChange={handleChange("description")}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="País"
                    value={form.country}
                    onChange={handleChange("country")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    value={form.city}
                    onChange={handleChange("city")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Edad Mínima"
                    type="number"
                    value={form.age_min}
                    onChange={handleChange("age_min")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Edad Máxima"
                    type="number"
                    value={form.age_max}
                    onChange={handleChange("age_max")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Género"
                    select
                    value={form.gender}
                    onChange={handleChange("gender")}
                    slotProps={{ select: {} }}
                  >
                    <MenuItem value="">--</MenuItem>
                    <MenuItem value="M">Masculino</MenuItem>
                    <MenuItem value="F">Femenino</MenuItem>
                    <MenuItem value="O">Otro</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                <Switch
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Activa
                </Typography>
              </Box>
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

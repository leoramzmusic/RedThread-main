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
  Select,
  MenuItem,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BugReportIcon from "@mui/icons-material/BugReport";
import SendIcon from "@mui/icons-material/Send";
import HistoryIcon from "@mui/icons-material/History";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import AdminLayout from "../../../../components/layout/AdminLayout";
import adminApiClient from "../../../../services/adminApi";
import { useSnackbar } from "notistack";

interface Template {
  id: string;
  name: string;
  channel: string;
  variables?: string[];
}

interface TestBrand {
  id: string;
  name: string;
  email?: string;
}

interface TestHistoryItem {
  id: string;
  template_name: string;
  brand_name: string;
  status: string;
  sent_at: string;
}

export default function BrandsTestCenterPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brands, setBrands] = useState<TestBrand[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [matchesCount, setMatchesCount] = useState("");
  const [careRemaining, setCareRemaining] = useState("");
  const [preview, setPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, brandRes, histRes] = await Promise.all([
        adminApiClient.get("/api/admin/notifications/brands/templates"),
        adminApiClient.get("/api/admin/notifications/brands/listado"),
        adminApiClient.get("/api/admin/notifications/brands/test/history"),
      ]);
      setTemplates(tplRes.data || []);
      setBrands(brandRes.data || []);
      setTestHistory(histRes.data || []);
    } catch (error) {
      console.error("Failed to fetch test center data:", error);
      enqueueSnackbar("Error al cargar datos del centro de pruebas", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePreview = () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;
    setPreviewLoading(true);
    try {
      let content = `Prueba de plantilla: ${template.name}\n`;
      content += `Marca: ${selectedBrand}\n`;
      content += `first_name: ${firstName || "{{first_name}}"}\n`;
      content += `matches_count: ${matchesCount || "{{matches_count}}"}\n`;
      content += `care_remaining: ${careRemaining || "{{care_remaining}}"}\n`;
      setPreview(content);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !selectedBrand) {
      enqueueSnackbar("Selecciona una plantilla y una marca", {
        variant: "warning",
      });
      return;
    }
    setSending(true);
    try {
      await adminApiClient.post("/api/admin/notifications/brands/test/send", {
        template_id: selectedTemplate,
        brand_id: selectedBrand,
        variables: {
          first_name: firstName || "{{first_name}}",
          matches_count: matchesCount || "{{matches_count}}",
          care_remaining: careRemaining || "{{care_remaining}}",
        },
      });
      enqueueSnackbar("Notificación de prueba enviada", { variant: "success" });
      fetchData();
    } catch (error) {
      console.error("Test send failed:", error);
      enqueueSnackbar("Error al enviar notificación de prueba", {
        variant: "error",
      });
    } finally {
      setSending(false);
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

  const previewElement = preview ? (
    <Grid size={{ xs: 12 }}>
      <Paper
        sx={{
          p: 2,
          bgcolor: "background.paper",
          border: "1px dashed",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
        >
          {preview}
        </Typography>
      </Paper>
    </Grid>
  ) : null;

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
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  🧪 Centro de Pruebas
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Simula y envía notificaciones de prueba a marcas
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => router.back()}>
                Volver
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Simulación de Envío
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Plantilla"
                      select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      slotProps={{ select: {} }}
                    >
                      <MenuItem value="">-- Seleccionar plantilla --</MenuItem>
                      {templates.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} ({t.channel})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Marca de prueba"
                      select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      slotProps={{ select: {} }}
                    >
                      <MenuItem value="">-- Seleccionar marca --</MenuItem>
                      {brands.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="{{first_name}}"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="{{matches_count}}"
                      value={matchesCount}
                      onChange={(e) => setMatchesCount(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label="{{care_remaining}}"
                      value={careRemaining}
                      onChange={(e) => setCareRemaining(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        disabled={previewLoading}
                        onClick={handlePreview}
                        startIcon={<RemoveRedEyeIcon />}
                      >
                        Vista Previa
                      </Button>
                      <Button
                        variant="contained"
                        disabled={
                          sending || !selectedTemplate || !selectedBrand
                        }
                        onClick={handleSendTest}
                        startIcon={<SendIcon />}
                      >
                        Enviar Prueba
                      </Button>
                    </Box>
                  </Grid>
                  {previewElement}
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Historial de Pruebas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {testHistory.length === 0 ? (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body1">
                      No hay pruebas realizadas aún.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                    {testHistory.map((item) => (
                      <Card key={item.id} sx={{ p: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.template_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {item.brand_name} - {item.status}
                        </Typography>
                        <Typography variant="caption">
                          {item.sent_at}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
}

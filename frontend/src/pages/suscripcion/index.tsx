import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  Undo as UndoIcon,
  Radar as RadarIcon,
  FilterList as FilterIcon,
  Translate as TranslateIcon,
  Videocam as VideoIcon,
  Verified as VerifiedIcon,
  AllInclusive as UnlimitedIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as CrownIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { PLAN_CONFIGS, SubscriptionTier } from '../../config/planConfig';

interface PremiumFeature {
  name: string;
  description: string;
  icon: string;
}

interface PlanPricing {
  monthly: number;
  threeMonth: number;
  sixMonth: number;
  yearly: number;
}

interface PricingData {
  premium: PlanPricing;
  vip: PlanPricing;
}

interface SubscriptionStatus {
  subscription_tier: string;
  expires_at: string | null;
  is_active: boolean;
  days_remaining: number;
  available_boosts: number;
}

interface BoostPackage {
  id: string;
  count: number;
  price: number;
  original_price: number;
  discount_percent: number;
}

const ICON_MAP: Record<string, any> = {
  favorite: FavoriteIcon,
  undo: UndoIcon,
  radar: RadarIcon,
  filter: FilterIcon,
  translate: TranslateIcon,
  videocam: VideoIcon,
  verified: VerifiedIcon,
  all_inclusive: UnlimitedIcon,
  crown: CrownIcon,
};

// Mock data removed, using backend data
const MOCK_PRICING: PricingData = {
  premium: {
    monthly: 0,
    threeMonth: 0,
    sixMonth: 0,
    yearly: 0,
  },
  vip: {
    monthly: 0,
    threeMonth: 0,
    sixMonth: 0,
    yearly: 0,
  }
};

type Duration = '1' | '3' | '6' | '12';

export default function Planes() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [pricing, setPricing] = useState<PricingData>(MOCK_PRICING);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [boostPackages, setBoostPackages] = useState<BoostPackage[]>([]);

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('premium');
  const [selectedDuration, setSelectedDuration] = useState<Duration>('12');

  const [processing, setProcessing] = useState(false);
  const [purchaseProcessing, setPurchaseProcessing] = useState<string | null>(null);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuresRes, statusRes, boostRes] = await Promise.all([
        apiClient.get('/premium/features'),
        apiClient.get('/premium/status'),
        apiClient.get('/premium/boost-packages'),
      ]);

      if (featuresRes.data.pricing) {
        setPricing(featuresRes.data.pricing);
      }

      setFeatures(featuresRes.data.features);

      // Combine status and available boosts
      setStatus({
        ...statusRes.data,
        available_boosts: boostRes.data.available_boosts
      });

      setBoostPackages(boostRes.data.packages);
    } catch (error) {
      console.error('Error fetching premium data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      await apiClient.post('/premium/subscribe', {
        tier: selectedTier,
        plan: selectedDuration === '1' ? 'monthly' : selectedDuration === '12' ? 'yearly' : `${selectedDuration}_months`,
        duration_months: parseInt(selectedDuration),
        payment_method_id: 'pm_mock',
      });
      await fetchData();
      setSuccessMessage(`¡Bienvenido a ${PLAN_CONFIGS[selectedTier].label}! Tu suscripción ha sido activada exitosamente.`);
      setOpenSuccess(true);
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchaseBoost = async (packageId: string) => {
    setPurchaseProcessing(packageId);
    try {
      await apiClient.post('/premium/purchase-boosts', {
        package_id: packageId,
        payment_method_id: 'pm_mock'
      });
      await fetchData();
      setSuccessMessage('¡Paquete de Boosts adquirido correctamente! Tu visibilidad aumentará pronto.');
      setOpenSuccess(true);
    } catch (error) {
      console.error('Error purchasing boosts:', error);
    } finally {
      setPurchaseProcessing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción?')) return;

    setProcessing(true);
    try {
      await apiClient.post('/premium/cancel');
      await fetchData();
    } catch (error) {
      console.error('Error cancelling:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getPrice = (tier: 'premium' | 'vip', duration: Duration) => {
    const tierPricing = pricing[tier];
    switch (duration) {
      case '1': return tierPricing.monthly;
      case '3': return tierPricing.threeMonth;
      case '6': return tierPricing.sixMonth;
      case '12': return tierPricing.yearly;
    }
  };

  const getMonthlyEquivalent = (tier: 'premium' | 'vip', duration: Duration) => {
    const price = getPrice(tier, duration);
    return (price / parseInt(duration)).toFixed(2);
  };

  const getSavings = (tier: 'premium' | 'vip', duration: Duration) => {
    if (duration === '1') return 0;
    const monthlyPrice = pricing[tier].monthly;
    const totalCost = getPrice(tier, duration);
    const savings = (monthlyPrice * parseInt(duration)) - totalCost;
    return Math.round((savings / (monthlyPrice * parseInt(duration))) * 100);
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const currentPlanConfig = PLAN_CONFIGS[selectedTier];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h2" fontWeight={900} gutterBottom sx={{
            background: 'linear-gradient(45deg, #FF6B6B 30%, #FFD700 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: "'Outfit', sans-serif"
          }}>
            SUSCRIPCIÓN
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth={700} mx="auto" sx={{ opacity: 0.8 }}>
            Gestiona tu experiencia en Red Thread, potencia tu visibilidad y descubre conexiones más profundas.
          </Typography>
        </Box>

        {/* CURRENT STATUS DASHBOARD */}
        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={5}>
            <Paper sx={{
              p: 4,
              height: '100%',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.2em' }}>
                  ESTADO ACTUAL
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={2} mb={3}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 4,
                    bgcolor: `${PLAN_CONFIGS[status?.subscription_tier as SubscriptionTier || 'free'].color.primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {status?.subscription_tier === 'vip' ?
                      <CrownIcon sx={{ color: PLAN_CONFIGS.vip.color.primary, fontSize: 40 }} /> :
                      <DiamondIcon sx={{ color: PLAN_CONFIGS.premium.color.primary, fontSize: 40 }} />
                    }
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={900}>
                      {PLAN_CONFIGS[status?.subscription_tier as SubscriptionTier || 'free'].label.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {status?.is_active
                        ? `Expira el ${new Date(status.expires_at!).toLocaleDateString()}`
                        : 'Plan gratuito limitado'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3, opacity: 0.5 }} />

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Boosts automáticos:</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {PLAN_CONFIGS[status?.subscription_tier as SubscriptionTier || 'free'].boostAllocation}
                  </Typography>
                </Box>
              </Box>

              {status?.is_active && (
                <Button
                  fullWidth
                  variant="text"
                  color="error"
                  onClick={handleCancel}
                  disabled={processing}
                  sx={{ mt: 3, opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                  Cancelar Suscripción
                </Button>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            {/* QUICK BOOST SHOP */}
            <Paper sx={{
              p: 4,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,107,107,0.05) 100%)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 5
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>TIENDA DE BOOSTS</Typography>
                  <Typography variant="body2" color="text.secondary">Aumenta tu visibilidad x3 de inmediato.</Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', px: 2, py: 1, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">DISPONIBLES</Typography>
                  <Typography variant="h6" fontWeight={900} textAlign="center">
                    ⚡ {status?.available_boosts || 0}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {boostPackages.map((pkg) => (
                  <Grid item xs={12} sm={4} key={pkg.id}>
                    <Paper sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', transform: 'translateY(-4px)' }
                    }}>
                      <Typography variant="h4" fontWeight={900} color="primary.main">
                        {pkg.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        BOOSTS
                      </Typography>

                      <Typography variant="h6" fontWeight={700}>
                        ${pkg.price}
                      </Typography>
                      {pkg.discount_percent > 0 && (
                        <Typography variant="caption" color="success.main" fontWeight={700} display="block">
                          -{pkg.discount_percent}% DCTO
                        </Typography>
                      )}

                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        sx={{ mt: 2, borderRadius: 2, bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC400' } }}
                        onClick={() => handlePurchaseBoost(pkg.id)}
                        disabled={!!purchaseProcessing}
                      >
                        {purchaseProcessing === pkg.id ? <CircularProgress size={16} color="inherit" /> : 'COMPRAR'}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* PLAN COMPARISON */}
        {!status?.is_active && (
          <Box mb={10}>
            <Typography variant="h4" fontWeight={900} textAlign="center" mb={6} sx={{ fontFamily: "'Outfit', sans-serif" }}>
              MEJORAR TU EXPERIENCIA
            </Typography>
            <Grid container spacing={4}>
              {['premium', 'vip'].map((tier) => {
                const config = PLAN_CONFIGS[tier as SubscriptionTier];
                return (
                  <Grid item xs={12} md={6} key={tier}>
                    <Card sx={{
                      borderRadius: 6,
                      overflow: 'visible',
                      position: 'relative',
                      border: tier === 'vip' ? `2px solid ${config.color.primary}` : '1px solid rgba(255,255,255,0.1)',
                      bgcolor: 'background.paper',
                      boxShadow: tier === 'vip' ? `0 20px 60px ${config.color.primary}15` : 'none'
                    }}>
                      {tier === 'vip' && (
                        <Box sx={{
                          position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
                          bgcolor: config.color.primary, color: 'black', px: 3, py: 0.5, borderRadius: 20,
                          fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em'
                        }}>
                          MÁXIMA EXPOSICIÓN
                        </Box>
                      )}
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h4" fontWeight={900} textAlign="center" gutterBottom>
                          {config.label.toUpperCase()}
                        </Typography>
                        <Typography variant="h3" fontWeight={900} textAlign="center" sx={{ my: 3 }}>
                          ${getPrice(tier as 'premium' | 'vip', selectedDuration)}
                          <Typography component="span" variant="body1" color="text.secondary">
                            /{selectedDuration === '1' ? 'mes' : selectedDuration === '12' ? 'año' : `${selectedDuration} meses`}
                          </Typography>
                        </Typography>

                        <List sx={{ mb: 4 }}>
                          <ListItem>
                            <ListItemIcon><CheckIcon sx={{ color: config.color.primary }} /></ListItemIcon>
                            <ListItemText primary={<strong>{config.boostAllocation} automáticos</strong>} />
                          </ListItem>
                          {config.features.map((f, i) => (
                            <ListItem key={i}>
                              <ListItemIcon><CheckIcon sx={{ color: config.color.primary }} /></ListItemIcon>
                              <ListItemText primary={f} />
                            </ListItem>
                          ))}
                        </List>

                        <Button
                          fullWidth
                          size="large"
                          variant="contained"
                          onClick={() => { setSelectedTier(tier as SubscriptionTier); handleSubscribe(); }}
                          disabled={processing}
                          sx={{
                            bgcolor: config.color.primary,
                            color: tier === 'vip' ? 'black' : 'white',
                            fontWeight: 800,
                            py: 2,
                            borderRadius: 3,
                            '&:hover': { bgcolor: config.color.dark }
                          }}
                        >
                          {processing ? <CircularProgress size={24} color="inherit" /> : `ACTIVAR ${config.label.toUpperCase()}`}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={selectedDuration}
                exclusive
                onChange={(_, v) => v && setSelectedDuration(v)}
                sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, p: 0.5 }}
              >
                <ToggleButton value="1">1 Mes</ToggleButton>
                <ToggleButton value="3">3 Meses</ToggleButton>
                <ToggleButton value="6">6 Meses</ToggleButton>
                <ToggleButton value="12">1 Año</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        {/* PROXIMAMENTE SECTION */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="overline" color="primary.main" fontWeight={900} textAlign="center" display="block" sx={{ letterSpacing: '0.3em', mb: 2 }}>
            PRÓXIMAMENTE • CARE ECONOMY
          </Typography>
          <Grid container spacing={3}>
            {[
              { title: 'Bonos CARE', desc: 'Gana Boosts completando tu perfil al 100% o participando en rituales.', icon: <HeartIcon /> },
              { title: 'Moneda Hilos', desc: 'Gana créditos por interacciones positivas y canjéalos por funciones premium.', icon: <UnlimitedIcon /> },
              { title: 'Eventos VIP', desc: 'Acceso exclusivo a dinámicas grupales y salas de conversación de alta afinidad.', icon: <StarIcon /> }
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper sx={{ p: 3, textAlign: 'center', opacity: 0.6, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 4, bgcolor: 'transparent' }}>
                  <Box sx={{ color: 'text.secondary', mb: 1 }}>{item.icon}</Box>
                  <Typography variant="h6" fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Success Dialog */}
        <Dialog
          open={openSuccess}
          onClose={() => setOpenSuccess(false)}
          PaperProps={{ sx: { borderRadius: 4, px: 2, py: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>¡Éxito!</DialogTitle>
          <DialogContent>
            <DialogContentText textAlign="center">
              {successMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setOpenSuccess(false)}
              autoFocus
              sx={{ borderRadius: 2, px: 4, bgcolor: 'primary.main' }}
            >
              ¡Genial!
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

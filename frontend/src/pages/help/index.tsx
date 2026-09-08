import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  InputAdornment,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Search as SearchIcon, ContactSupport as ContactSupportIcon } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import apiClient from '../../services/api';
import Layout from '../../components/layout/Layout';

interface FAQItem {
  question: string;
  answer: string;
  question_en?: string;
  answer_en?: string;
}

interface FAQData {
  categories: { id: string; name: string; count: number }[];
  all_items: Record<string, FAQItem[]>;
}

export default function HelpCenter() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FAQData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | false>(false);

  const currentLang = (i18n.language || 'es').split('-')[0];
  const isEn = currentLang === 'en';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/help/faq');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching FAQ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getFilteredItems = () => {
    if (!data) return [];

    let items: { category: string; item: FAQItem }[] = [];

    // Flatten items
    Object.entries(data.all_items).forEach(([category, categoryItems]) => {
      if (activeCategory === 'all' || activeCategory === category) {
        categoryItems.forEach(item => {
          items.push({ category, item });
        });
      }
    });

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(({ item }) => {
        const question = isEn ? (item.question_en || item.question) : item.question;
        const answer = isEn ? (item.answer_en || item.answer) : item.answer;
        return question.toLowerCase().includes(query) || answer.toLowerCase().includes(query);
      });
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  return (
    <Layout>
      {/* Hero Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText', 
        py: 8, 
        mb: 6,
        borderRadius: { xs: 0, md: 2 },
        mt: { xs: -3, md: 0 },
        mx: { xs: -3, md: 0 },
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            {t('help.title', '¿Cómo podemos ayudarte?')}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            {t('help.subtitle', 'Busca respuestas o explora por categoría')}
          </Typography>
          
          <TextField
            fullWidth
            placeholder={t('help.searchPlaceholder', 'Buscar en preguntas frecuentes...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* Sidebar / Categories */}
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {t('help.categories', 'Categorías')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, overflowX: 'auto', pb: 2 }}>
                <Button
                  variant={activeCategory === 'all' ? 'contained' : 'text'}
                  color={activeCategory === 'all' ? 'primary' : 'inherit'}
                  onClick={() => setActiveCategory('all')}
                  sx={{ justifyContent: 'flex-start', borderRadius: 2 }}
                >
                  {t('help.all', 'Todas')}
                </Button>
                {data?.categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'contained' : 'text'}
                    color={activeCategory === cat.id ? 'primary' : 'inherit'}
                    onClick={() => setActiveCategory(cat.id)}
                    sx={{ justifyContent: 'flex-start', borderRadius: 2 }}
                  >
                    {t(`help.cat.${cat.id}`, cat.name)}
                  </Button>
                ))}
              </Box>
            </Grid>

            {/* FAQ Items */}
            <Grid item xs={12} md={9}>
              <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                {searchQuery 
                  ? t('help.searchResults', 'Resultados de búsqueda') 
                  : activeCategory === 'all' 
                    ? t('help.popularQuestions', 'Preguntas Frecuentes')
                    : t(`help.cat.${activeCategory}`, activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1))
                }
              </Typography>

              {filteredItems.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {t('help.noResults', 'No se encontraron resultados para tu búsqueda.')}
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {filteredItems.map(({ item, category }, index) => {
                    const question = isEn ? (item.question_en || item.question) : item.question;
                    const answer = isEn ? (item.answer_en || item.answer) : item.answer;
                    const panelId = `panel-${index}`;
                    
                    return (
                      <Accordion 
                        key={index} 
                        expanded={expanded === panelId} 
                        onChange={handleChange(panelId)}
                        sx={{ mb: 1, '&:before': { display: 'none' }, borderRadius: 1 }}
                        elevation={1}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography fontWeight={500}>{question}</Typography>
                            {activeCategory === 'all' && (
                              <Chip 
                                label={category} 
                                size="small" 
                                variant="outlined" 
                                sx={{ fontSize: '0.7rem', height: 20 }} 
                              />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography color="text.secondary">
                            {answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {/* Contact CTA */}
              <Paper 
                elevation={0} 
                sx={{ 
                  mt: 6, 
                  p: 4, 
                  bgcolor: 'background.default', 
                  border: '1px dashed', 
                  borderColor: 'divider',
                  textAlign: 'center',
                  borderRadius: 2
                }}
              >
                <ContactSupportIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('help.stillNeedHelp', '¿Aún necesitas ayuda?')}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {t('help.contactDesc', 'Si no encontraste la respuesta que buscabas, nuestro equipo de soporte está listo para ayudarte.')}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/help/contact')}
                >
                  {t('help.contactSupport', 'Contactar Soporte')}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Layout>
  );
}

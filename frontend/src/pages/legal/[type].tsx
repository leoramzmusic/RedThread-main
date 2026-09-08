import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Breadcrumbs, 
  Link as MuiLink,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import apiClient from '../../services/api';
import Layout from '../../components/layout/Layout';

interface LegalDocument {
  doc_type: string;
  language: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
}

export default function LegalDocumentPage() {
  const router = useRouter();
  const { type } = router.query;
  const { t, i18n } = useTranslation('common');
  
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState((i18n.language || 'es').split('-')[0]);

  useEffect(() => {
    if (!type) return;
    
    const fetchDocument = async () => {
      setLoading(true);
      try {
        // Map frontend routes to backend doc types
        const docTypeMap: Record<string, string> = {
          'community-rules': 'community_guidelines',
          'privacy': 'privacy',
          'terms': 'terms',
          'security': 'security'
        };
        
        const docType = docTypeMap[type as string] || type as string;
        
        const response = await apiClient.get(`/legal/${docType}`, {
          params: { language }
        });
        
        setDocument(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching legal document:', err);
        setError(t('legal.error', 'No se pudo cargar el documento. Por favor intenta más tarde.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [type, language, t]);

  const handleLanguageChange = (
    event: React.MouseEvent<HTMLElement>,
    newLanguage: string,
  ) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  if (loading && !document) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const LANGUAGES = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
    { code: 'pt', label: 'PT' },
    { code: 'fr', label: 'FR' },
  ];

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/home" color="inherit" sx={{ cursor: 'pointer', textDecoration: 'none' }}>
            {t('nav.home', 'Inicio')}
          </MuiLink>
          <Typography color="text.primary">
            {t('footer.legal', 'Legal')}
          </Typography>
          <Typography color="text.primary">
            {document?.title || type}
          </Typography>
        </Breadcrumbs>

        {error ? (
          <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  {document?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('legal.effectiveDate', 'Fecha de vigencia')}: {new Date(document?.effective_date || '').toLocaleDateString()} • v{document?.version}
                </Typography>
              </Box>

              <ToggleButtonGroup
                value={language}
                exclusive
                onChange={handleLanguageChange}
                aria-label="language"
                size="small"
              >
                {LANGUAGES.map((lang) => (
                  <ToggleButton key={lang.code} value={lang.code}>
                    {lang.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Content */}
            <Box sx={{ 
              '& h1': { fontSize: '2rem', mb: 2, mt: 4 },
              '& h2': { fontSize: '1.5rem', mb: 2, mt: 3 },
              '& h3': { fontSize: '1.25rem', mb: 1, mt: 2 },
              '& p': { mb: 2, lineHeight: 1.7 },
              '& ul, & ol': { mb: 2, pl: 3 },
              '& li': { mb: 1 },
            }}>
              <ReactMarkdown>
                {document?.content || ''}
              </ReactMarkdown>
            </Box>
          </Paper>
        )}
      </Container>
    </Layout>
  );
}

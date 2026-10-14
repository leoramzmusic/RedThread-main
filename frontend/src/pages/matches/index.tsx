import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { Box, Container, Typography, Button } from '@mui/material';
import { Favorite as HeartIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';

export default function MatchesPage() {
  const router = useRouter();

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <HeartIcon sx={{ fontSize: 80, color: '#FF6B6B', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{
            fontWeight: 800
          }}>
            Matches
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              mb: 4,
              fontStyle: 'italic',
              opacity: 0.8
            }}>
            Esta sección estará disponible pronto.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/home')}
          >
            Volver al inicio
          </Button>
        </Box>
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

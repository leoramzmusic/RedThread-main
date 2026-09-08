import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useTranslation } from 'next-i18next';

interface CommunityRulesDialogProps {
  open: boolean;
  onClose: () => void;
}

const CommunityRulesDialog: React.FC<CommunityRulesDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ bgcolor: 'background.default', pb: 1 }}>
        {t('communityRules.title', '🌐 Reglas de la Comunidad de RedThread')}
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom color="primary">
          {t('communityRules.welcome', '¡Bienvenidx a RedThread!')}
        </Typography>
        <Typography paragraph>
          {t('communityRules.intro1', 'Aquí no solo conectas con personas: aquí tejes hilos de confianza, creatividad y colaboración. Cada interacción puede abrir una oportunidad, una amistad, un proyecto o simplemente una buena conversación. Las posibilidades son infinitas, siempre que respetemos este espacio.')}
        </Typography>
        <Typography paragraph>
          {t('communityRules.intro2', 'Queremos que RedThread sea un entorno seguro, inclusivo y auténtico, donde todxs puedan expresarse libremente mientras conocen gente. Estas reglas existen para marcar los límites claros de lo que está permitido y lo que no. No seguirlas puede tener consecuencias, desde advertencias hasta la suspensión de la cuenta.')}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
          {t('communityRules.rulesTitle', '📜 Reglas de RedThread')}
        </Typography>

        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule1.title', 'Respeta los límites y el consentimiento.')}</strong>
            <br />
            {t('communityRules.rule1.desc', 'No se permiten desnudos ni contenido sexual explícito en perfiles públicos. En conversaciones privadas, cualquier intercambio íntimo debe ser consensuado por todas las partes. El consentimiento es la base de toda interacción.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule2.title', 'Protege tu información personal.')}</strong>
            <br />
            {t('communityRules.rule2.desc', 'No publiques datos sensibles como teléfono, correo, redes sociales o cuentas bancarias en tu perfil. No pidas ni compartas información privada de otras personas. Si alguien te pide dinero o inversiones, probablemente sea una estafa: denúncialo.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule3.title', 'Cero violencia.')}</strong>
            <br />
            {t('communityRules.rule3.desc', 'No se tolera contenido violento, sangriento, ni que glorifique el daño a personas o animales. Tampoco se permite promover autolesión o uso de armas. Si detectamos riesgo de daño, podemos activar protocolos de seguridad y apoyo.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule4.title', 'RedThread no es un mercado.')}</strong>
            <br />
            {t('communityRules.rule4.desc', 'No uses la app para vender productos, captar seguidores, recaudar fondos o hacer campañas. Tampoco para servicios sexuales, relaciones compensadas o “sugar dating”.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule5.title', 'Sé auténtico.')}</strong>
            <br />
            {t('communityRules.rule5.desc', 'No crees cuentas falsas ni suplantes identidades. La comunidad quiere conocerte a ti, no a un personaje inventado.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule6.title', 'Comunícate con respeto.')}</strong>
            <br />
            {t('communityRules.rule6.desc', 'No se permite acoso, amenazas, intimidación, chantaje, sextorsión ni doxing. Aquí no hay espacio para racismo, intolerancia, odio o discriminación por raza, género, orientación sexual, religión, discapacidad, apariencia o estado de salud. Si alguien no encaja con tus criterios, simplemente pasa de largo.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule7.title', 'No dañes a los demás.')}</strong>
            <br />
            {t('communityRules.rule7.desc', 'Cualquier acción que sugiera, incite o cause daño físico, emocional o digital será tomada muy en serio. Si alguien te lastima, cuídate primero y luego decide si quieres denunciarlo. Estamos aquí para apoyarte.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule8.title', 'Solo para mayores de edad.')}</strong>
            <br />
            {t('communityRules.rule8.desc', 'Debes tener al menos 18 años para usar RedThread. No se permiten fotos de menores ni imágenes de infancia en contextos inapropiados.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule9.title', 'Cumple la ley.')}</strong>
            <br />
            {t('communityRules.rule9.desc', 'No uses RedThread para actividades ilegales: venta de drogas, productos falsificados, tráfico de personas o explotación de menores.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule10.title', 'Una cuenta, una persona.')}</strong>
            <br />
            {t('communityRules.rule10.desc', 'Cada cuenta es individual. No compartas tu acceso ni crees múltiples perfiles.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule11.title', 'Publica solo tu propio contenido.')}</strong>
            <br />
            {t('communityRules.rule11.desc', 'No compartas fotos, mensajes privados o material de otras personas sin su consentimiento. Respeta derechos de autor y marcas registradas.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule12.title', 'Sé un miembro ejemplar.')}</strong>
            <br />
            {t('communityRules.rule12.desc', 'No difundas información falsa, spam ni enlaces dañinos. No manipules ni intentes engañar a la comunidad. No uses apps externas para alterar funciones de RedThread.')}
          </Typography>

          <Typography component="li" paragraph>
            <strong>{t('communityRules.rule13.title', 'Mantente activo.')}</strong>
            <br />
            {t('communityRules.rule13.desc', 'Si no usas tu cuenta en dos años, podremos eliminarla por inactividad.')}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          {t('communityRules.reportTitle', '🚨 Denuncias')}
        </Typography>
        <Typography paragraph>
          {t('communityRules.reportDesc', 'Si alguien te incomoda, te daña o rompe estas reglas, denúncialo. Tus reportes son confidenciales y ayudan a proteger a la comunidad.')}
        </Typography>

        <Typography variant="h6" gutterBottom>
          {t('communityRules.impactTitle', '⚖️ Impacto')}
        </Typography>
        <Typography paragraph>
          {t('communityRules.impactDesc', 'Nos tomamos estas reglas muy en serio. Aplicamos advertencias, suspensiones o expulsiones según la gravedad. Podemos investigar y cancelar cuentas sin reembolso si detectamos mal uso del servicio, incluso si ocurre fuera de la app pero involucra a personas que conociste aquí.')}
        </Typography>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          {t('common.understood', 'Entendido')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommunityRulesDialog;

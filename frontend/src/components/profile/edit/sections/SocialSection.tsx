import React from 'react';
import { Box, Typography, Alert, Accordion, AccordionSummary, AccordionDetails, Grid } from '@mui/material';
import { Diversity3, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import FriendManager from '../../FriendManager';

interface SocialSectionProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
    watch: UseFormWatch<any>;
}

const SocialSection: React.FC<SocialSectionProps> = ({ control, setValue, watch }) => {
    const { t } = useTranslation();

    return (
        <Grid item xs={12}>
            <Accordion
                defaultExpanded
                sx={{
                    position: 'relative',
                    border: (theme) => '1px solid ' + theme.palette.divider,
                    boxShadow: 1,
                    backgroundImage: 'none',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 3, py: 1 }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Diversity3 color="action" />
                        <Typography variant="h6">Mi Círculo Social</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Gestiona tu círculo social. Agrega amigos, acepta solicitudes y mantente conectado.
                    </Typography>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        Tus amigos podrán ver tu perfil incluso si está configurado como privado.
                    </Alert>

                    <FriendManager />
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
};

export default SocialSection;

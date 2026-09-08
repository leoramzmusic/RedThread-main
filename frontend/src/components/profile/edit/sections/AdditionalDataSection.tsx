import { Grid, Paper, Typography, TextField, Box, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ListAlt, ChildCare, Chat, Favorite, Straighten, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { SectionWithOptionsProps } from '../types';
import { formatHeight } from '../../../../utils/formatters';
import OptionSelector from './OptionSelector';
import ZodiacSelector from './ZodiacSelector';
import HeightSelector from './HeightSelector';
import RelationshipTypeSelector from './RelationshipTypeSelector';
import FamilyPlansSelector from './FamilyPlansSelector';
import CommunicationStyleSelector from './CommunicationStyleSelector';
import LoveLanguageSelector from './LoveLanguageSelector';
import { useTranslation } from 'next-i18next';

export default function AdditionalDataSection({ control, options }: SectionWithOptionsProps) {
    const { t } = useTranslation('common');
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
                        <ListAlt color="action" />
                        <Typography variant="h6">Datos Adicionales</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <HeightSelector control={control} />
                        </Grid>

                        {/* Relationship Type - Enhanced Component */}
                        <Grid item xs={12}>
                            <RelationshipTypeSelector control={control} />
                        </Grid>

                        {/* Education Level moved to ProfessionalAcademicSection */}

                        <Grid item xs={12}>
                            <ZodiacSelector control={control} />
                        </Grid>

                        {/* Moved Fields from Lifestyle */}
                        <Grid item xs={12}>
                            <FamilyPlansSelector control={control} />
                        </Grid>

                        <Grid item xs={12}>
                            <CommunicationStyleSelector control={control} />
                        </Grid>

                        <Grid item xs={12}>
                            <LoveLanguageSelector control={control} />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}

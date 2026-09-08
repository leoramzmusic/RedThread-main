import { Grid, Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Nightlife, ConnectWithoutContact, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { SectionWithOptionsProps } from '../types';
import PetsSelector from './PetsSelector';
import DrinkingSelector from './DrinkingSelector';
import SmokingSelector from './SmokingSelector';
import ExerciseSelector from './ExerciseSelector';
import OptionSelector from './OptionSelector';

export default function LifestyleSection({ control }: Pick<SectionWithOptionsProps, 'control'>) {
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
                        <Nightlife color="action" />
                        <Typography variant="h6">Estilo de vida</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Grid container spacing={2}>
                        {/* Pets Selector - Full Width */}
                        <Grid item xs={12}>
                            <PetsSelector control={control} />
                        </Grid>
                        <Grid item xs={12}>
                            <DrinkingSelector control={control} />
                        </Grid>
                        <Grid item xs={12}>
                            <SmokingSelector control={control} />
                        </Grid>
                        <Grid item xs={12}>
                            <ExerciseSelector control={control} />
                        </Grid>
                        <Grid item xs={12}>
                            <OptionSelector
                                control={control}
                                name="social_media_usage"
                                label="¿Cuánto usas las redes sociales?"
                                icon={<ConnectWithoutContact />}
                                color="#E1306C"
                                options={[
                                    { value: 'influencer_status', label: 'Estatus de influencer' },
                                    { value: 'active_user', label: 'Las uso bastante' },
                                    { value: 'no_social', label: 'No las uso' },
                                    { value: 'lurker', label: 'Deslizo no posteo' },
                                ]}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}

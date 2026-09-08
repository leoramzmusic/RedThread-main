import { Grid, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Info as InfoIcon, Male, Female, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { ListSubheader } from '@mui/material';
import { PRONOUN_CATEGORIES } from '../../../../constants/profileOptions';
import { SectionWithOptionsProps } from '../types';

interface PronounsSectionProps extends SectionWithOptionsProps {
    setPronounsInfoOpen: (open: boolean) => void;
}

export default function PronounsSection({ control, setPronounsInfoOpen }: PronounsSectionProps) {
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
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box display="flex" sx={{ color: 'text.secondary' }}>
                                <Male fontSize="small" />
                                <Female fontSize="small" />
                            </Box>
                            <Typography variant="h6">Pronombres</Typography>
                        </Box>
                        <Tooltip title="Tu pronombre es parte de tu identidad. La compatibilidad se basa en la orientación sexual y otros factores.">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPronounsInfoOpen(true);
                                }}
                            >
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 500 }}>
                        “Tus pronombres definen cómo te nombramos, no cómo conectas.”
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="pronouns"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Pronombres</InputLabel>
                                        <Select {...field} label="Pronombres">
                                            {PRONOUN_CATEGORIES.flatMap((c) => [
                                                <ListSubheader key={c.category}>{c.category}</ListSubheader>,
                                                ...c.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)
                                            ])}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}

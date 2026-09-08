import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, AutoAwesome as SparkleIcon } from '@mui/icons-material';
import { GENDER_CATEGORIES } from '../../constants/profileOptions';
import { useTranslation } from 'next-i18next';

interface CuriosityGenderSelectorProps {
    open: boolean;
    onClose: () => void;
    onSave: (selectedGenders: string[]) => void;
    initialSelected: string[];
    containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function CuriosityGenderSelector({
    open,
    onClose,
    onSave,
    initialSelected,
    containerRef
}: CuriosityGenderSelectorProps) {
    const { t } = useTranslation('common');
    const [selected, setSelected] = useState<string[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | false>(false);

    useEffect(() => {
        if (open) {
            setSelected(initialSelected || []);
        }
    }, [open, initialSelected]);

    const handleToggle = (gender: string) => {
        setSelected(prev => {
            if (prev.includes(gender)) {
                return prev.filter(g => g !== gender);
            } else {
                return [...prev, gender];
            }
        });
    };

    const handleSave = () => {
        onSave(selected);
    };

    const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedCategory(isExpanded ? panel : false);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            container={containerRef?.current}
            disablePortal={!!containerRef}
            hideBackdrop={false}
            scroll="paper"
            sx={{
                position: 'absolute !important',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                '& .MuiBackdrop-root': {
                    position: 'absolute !important',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)'
                },
                '& .MuiDialog-container': {
                    position: 'absolute !important',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                '& .MuiDialog-paper': {
                    m: 2,
                    mt: { xs: 2, md: '50px' },
                    ml: { xs: 2, md: '280px' },
                    width: '100%',
                    maxWidth: { xs: 'calc(100% - 32px) !important', md: '580px !important' },
                    height: 'auto',
                    maxHeight: 'calc(100% - 48px)',
                    boxSizing: 'border-box',
                    borderRadius: 3
                }
            }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundImage: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                    border: '1px solid rgba(171, 71, 188, 0.3)',
                    boxShadow: '0 8px 32px rgba(171, 71, 188, 0.3)',
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <SparkleIcon sx={{ color: '#AB47BC', fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                        {t('curiosity.title', 'Exploración Curiosa')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                        {t('curiosity.subtitle', 'Selecciona los géneros que te gustaría descubrir hoy')}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 2, py: 2 }}>
                <Box sx={{ mb: 2 }}>
                    {selected.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, p: 1.5, bgcolor: 'rgba(171, 71, 188, 0.1)', borderRadius: 2 }}>
                            {selected.map(g => (
                                <Chip
                                    key={g}
                                    label={g}
                                    onDelete={() => handleToggle(g)}
                                    size="small"
                                    sx={{ bgcolor: '#AB47BC', color: 'white' }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {GENDER_CATEGORIES.map((category, index) => (
                        <Accordion
                            key={category.category}
                            expanded={expandedCategory === `panel${index}`}
                            onChange={handleAccordionChange(`panel${index}`)}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.03)',
                                color: 'text.primary',
                                '&:before': { display: 'none' },
                                borderRadius: '8px !important',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 600 }}>{category.category}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                                    {category.options.map((option) => (
                                        <FormControlLabel
                                            key={option.label}
                                            control={
                                                <Checkbox
                                                    checked={selected.includes(option.label)}
                                                    onChange={() => handleToggle(option.label)}
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.3)',
                                                        '&.Mui-checked': { color: '#AB47BC' }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                    {option.label}
                                                </Typography>
                                            }
                                        />
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
                    {t('cancel', 'Cancelar')}
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={selected.length === 0}
                    sx={{
                        bgcolor: '#AB47BC',
                        px: 4,
                        '&:hover': { bgcolor: '#8E24AA' }
                    }}
                >
                    {t('confirm', 'Comenzar a Explorar')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

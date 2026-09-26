import { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    Button,
    Chip,
    Divider,
    IconButton,
    Collapse
} from '@mui/material';
import {
    Person as PersonIcon,
    Favorite as HeartIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { INTENTION_OPTIONS } from '../../../constants/profileOptions';

interface InfoSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const InfoSection = ({ title, icon, children, defaultExpanded = false }: InfoSectionProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <Paper
            sx={{
                mb: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }
            }}
            elevation={0}
        >
            <Box
                p={2.5}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setExpanded(!expanded)}
                sx={{
                    cursor: 'pointer',
                    bgcolor: 'transparent'
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        color="primary.main"
                        display="flex"
                        p={1}
                        bgcolor="primary.50"
                        borderRadius="50%"
                    >
                        {icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">{title}</Typography>
                </Box>
                <IconButton
                    size="small"
                    sx={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        bgcolor: 'action.hover'
                    }}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </Box>
            <Collapse in={expanded}>
                <Box p={3} pt={0}>
                    {children}
                </Box>
            </Collapse>
        </Paper>
    );
};

interface ProfileBioProps {
    profile: any;
}

export default function ProfileBio({ profile }: ProfileBioProps) {
    const { t } = useTranslation('common');
    const [bioExpanded, setBioExpanded] = useState(false);

    return (
        <>
            {/* Bio Section */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
                elevation={0}
            >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box p={1} bgcolor="primary.50" borderRadius="50%" color="primary.main" display="flex">
                        <PersonIcon />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{t('profile.aboutMe', 'Sobre mí')}</Typography>
                </Box>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        whiteSpace: 'pre-line',
                        display: '-webkit-box',
                        WebkitLineClamp: bioExpanded ? 'unset' : 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6
                    }}
                >
                    {profile.bio || t('profile.noBio', 'Sin descripción')}
                </Typography>
                {profile.bio && profile.bio.length > 150 && (
                    <Button
                        size="small"
                        onClick={() => setBioExpanded(!bioExpanded)}
                        sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
                        endIcon={bioExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {bioExpanded ? t('profile.showLess', 'Ver menos') : t('profile.showMore', 'Ver más')}
                    </Button>
                )}
            </Paper>

            {/* Intentions / 'Busco' Section */}
            <InfoSection title={t('profile.intentions_title', 'Busco')} icon={<HeartIcon />} defaultExpanded={true}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {profile.intentions?.length > 0 ? profile.intentions.map((intention: string) => {
                        const option = INTENTION_OPTIONS.find(opt => opt.value === intention);
                        const translatedLabel = t(`profile.intentions_map.${intention}`, option ? option.label : intention);
                        return (
                            <Chip
                                key={intention}
                                label={option ? `${option.emoji} ${translatedLabel}` : translatedLabel}
                                color="primary"
                                variant="filled"
                                sx={{
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            />
                        );
                    }) : (
                        <Typography variant="body2" color="text.secondary">{t('profile.notSpecified', 'No especificado')}</Typography>
                    )}
                </Box>
            </InfoSection>
        </>
    );
}

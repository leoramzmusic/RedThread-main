import { ReactNode } from 'react';
import { Box, Paper, Typography, IconButton, Button, alpha, styled } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ProfileSectionBlockProps {
    title: string;
    icon: ReactNode;
    children?: ReactNode;
    onEdit?: () => void;
    isEmpty?: boolean;
    isHidden?: boolean;
    emptyMessage?: string;
    hiddenMessage?: string;
}

const SectionPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(10px)',
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${alpha(theme.palette.common.white, 0.05)}`,
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.3),
        boxShadow: `0 8px 24px -4px ${alpha(theme.palette.common.black, 0.2)}`,
    }
}));

const Header = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
}));

export default function ProfileSectionBlock({
    title,
    icon,
    children,
    onEdit,
    isEmpty,
    isHidden,
    emptyMessage,
    hiddenMessage
}: ProfileSectionBlockProps) {
    const { t } = useTranslation('common');

    return (
        <SectionPaper elevation={0}>
            <Header>
                <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                {onEdit && (
                    <IconButton
                        onClick={onEdit}
                        size="small"
                        sx={{
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' }
                        }}
                    >
                        <Edit fontSize="small" />
                    </IconButton>
                )}
            </Header>

            <Box sx={{ flexGrow: 1 }}>
                {isHidden ? (
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: 'action.disabledBackground',
                            border: '1px dashed',
                            borderColor: 'text.disabled',
                            textAlign: 'center'
                        }}
                    >
                        <Typography color="text.secondary" fontStyle="italic">
                            {hiddenMessage || t('profile.section_hidden', 'Esta sección está oculta. Puedes activarla desde configuración de privacidad.')}
                        </Typography>
                    </Box>
                ) : isEmpty ? (
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'primary.main', // Slightly more visible than disabled
                            textAlign: 'center',
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                        }}
                    >
                        <Typography color="text.secondary" gutterBottom>
                            {emptyMessage || t('profile.section_empty', 'Aún no has compartido esta parte.')}
                        </Typography>
                        {onEdit && (
                            <Button
                                variant="text"
                                size="small"
                                onClick={onEdit}
                                sx={{ mt: 1 }}
                            >
                                {t('profile.add_info', '¿Quieres agregarla?')}
                            </Button>
                        )}
                    </Box>
                ) : (
                    children
                )}
            </Box>
        </SectionPaper>
    );
}

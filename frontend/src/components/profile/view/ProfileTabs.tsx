import { Tabs, Tab, Box, styled } from '@mui/material';
import {
    Person,
    Collections,
    TheaterComedy,
    EmojiEvents
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

interface ProfileTabsProps {
    activeTab: string;
    onChange: (newValue: string) => void;
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTabs-indicator': {
        height: 3,
        borderRadius: '3px 3px 0 0',
    },
    '& .MuiTabs-flexContainer': {
        justifyContent: 'center',
        gap: '24px', // Add spacing between tabs
        [theme.breakpoints.down('sm')]: {
            justifyContent: 'flex-start',
            gap: '8px'
        }
    }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    minHeight: 56,
    minWidth: 'auto',
    // Separator logic
    '&:not(:last-of-type)::after': {
        content: '"|"',
        position: 'absolute',
        right: -12, // Half of gap (24px)
        color: theme.palette.text.disabled,
        fontSize: '1rem',
        pointerEvents: 'none',
        [theme.breakpoints.down('sm')]: {
            display: 'none' // Hide on mobile
        }
    },
    [theme.breakpoints.down('sm')]: {
        minWidth: 'auto',
        fontSize: '0.8rem',
        padding: '12px 12px',
        '& .MuiTab-iconWrapper': {
            marginBottom: 0,
            marginRight: 6
        }
    },
}));

export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
    const { t } = useTranslation('common');

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        onChange(newValue);
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 10 }}>
            <StyledTabs
                value={activeTab}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="profile tabs"
            >
                <StyledTab
                    value="profile"
                    icon={<Person />}
                    iconPosition="start"
                    label={t('profile.tabs.my_profile', 'Mi Perfil')}
                />
                <StyledTab
                    value="media"
                    icon={<Collections />}
                    iconPosition="start"
                    label={t('profile.tabs.media', 'Multimedia')}
                />
                <StyledTab
                    value="identity"
                    icon={<TheaterComedy sx={{ color: 'text.secondary' }} />}
                    iconPosition="start"
                    label={t('profile.tabs.identity', 'Identidad Creativa')}
                />
                <StyledTab
                    value="rewards"
                    icon={<EmojiEvents />}
                    iconPosition="start"
                    label={t('profile.tabs.rewards', 'Recompensas')}
                />
            </StyledTabs>
        </Box>
    );
}

import {
    Box,
    Typography,
    Grid,
    LinearProgress,
    Tooltip,
    Card,
    CardContent,
    Stack,
    Chip
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    MilitaryTech as BadgeIcon,
    Star as StarIcon,
    WorkspacePremium as PremiumIcon
} from '@mui/icons-material';

interface Reward {
    id: string;
    title: string;
    description: string;
    icon: string;
    date: string;
}

interface ProfileRewardsProps {
    profile: any;
}

export default function ProfileRewards({ profile }: ProfileRewardsProps) {
    // Mock data for rewards - in real app, this would come from profile prop
    const rewards: Reward[] = [
        { id: '1', title: 'Perfil Completo', description: 'Has completado tu perfil al 100%', icon: 'A', date: '2025-01-15' },
        { id: '2', title: 'Primer Post', description: 'Has compartido tu primera publicación', icon: 'B', date: '2025-01-20' },
    ];

    const experience = 75; // Mock experience percentage
    const level = 5;

    return (
        <Card
            elevation={0}
            sx={{
                background: 'rgba(30, 30, 47, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                mb: 3,
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    background: 'rgba(255, 255, 255, 0.02)'
                }}
            >
                <TrophyIcon sx={{ color: '#ffd700', fontSize: 24 }} />
                <Typography variant="h6" fontWeight="bold" color="white">
                    Recompensas y Logros
                </Typography>
            </Box>

            <CardContent>
                {/* Level Progress */}
                <Box mb={4}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
                            Nivel {level}
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            {experience}/100 XP
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={experience}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: '#ffd700',
                                borderRadius: 4
                            }
                        }}
                    />
                </Box>

                {/* Rewards Grid */}
                <Typography variant="subtitle1" fontWeight="600" color="white" gutterBottom mb={2}>
                    Insignias
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                        <Tooltip title="Completaste tu perfil">
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(255, 215, 0, 0.1)',
                                    border: '1px solid rgba(255, 215, 0, 0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: 'rgba(255, 215, 0, 0.15)'
                                    }
                                }}
                            >
                                <BadgeIcon sx={{ color: '#ffd700', fontSize: 32 }} />
                                <Typography variant="caption" color="#ffd700" textAlign="center" fontWeight="bold">
                                    Perfil Top
                                </Typography>
                            </Box>
                        </Tooltip>
                    </Grid>

                    {/* Placeholder for more badges */}
                    <Grid item xs={6} sm={4}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px dashed rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                height: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="caption" color="rgba(255,255,255,0.3)" textAlign="center">
                                Próximo logro
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Recent Activity / Logros */}
                <Box mt={4}>
                    <Typography variant="subtitle1" fontWeight="600" color="white" gutterBottom mb={2}>
                        Logros Recientes
                    </Typography>
                    <Stack spacing={1}>
                        {rewards.map((reward) => (
                            <Box
                                key={reward.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.06)'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(77, 171, 245, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <StarIcon sx={{ color: '#4dabf5', fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="white" fontWeight="500">
                                        {reward.title}
                                    </Typography>
                                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                                        {reward.description}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>

            </CardContent>
        </Card>
    );
}

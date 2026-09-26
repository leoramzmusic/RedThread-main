import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Grid,
    CircularProgress,
    Paper,
    InputBase,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Diversity3 as FriendsIcon,
    PendingActions as PendingIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import FriendCard from '../../components/friends/FriendCard';

interface Friend {
    user_id: string;
    display_name: string;
    photo: string | null;
    status: 'active' | 'pending_sent' | 'pending_received';
    relationship_id: string;
    last_interaction?: string;
    affinity_score?: number;
    is_golth?: boolean;
    is_online?: boolean;
    since?: string;
    age?: number;
    city?: string;
}

export default function FriendsPage() {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                apiClient.get('/friends/list'),
                apiClient.get('/friends/requests/pending'),
            ]);

            // Map Active Friends
            const mappedFriends = friendsRes.data.map((f: any) => ({
                ...f,
                status: 'active',
                affinity_score: f.affinity_score || 0
            }));
            setFriends(mappedFriends);

            // Map Pending Requests
            const mappedRequests = requestsRes.data.map((r: any) => ({
                user_id: r.requester_id,
                display_name: r.requester_name,
                photo: r.requester_photo,
                relationship_id: r.relationship_id,
                status: 'pending_received',
                created_at: r.created_at,
                affinity_score: 0
            }));
            setRequests(mappedRequests);
        } catch (error) {
            console.error('Error fetching friends data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const filteredFriends = friends.filter(f =>
        f.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRequests = requests.filter(r =>
        r.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header Section */}
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        gutterBottom
                        sx={{
                            background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        Mis Vínculos
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8, maxWidth: 600, mx: 'auto', fontStyle: 'italic' }}>
                        “Aquí están tus vínculos. No son solo nombres, son hilos que te conectan con lo que te hace sentir.”
                    </Typography>
                </Box>

                {/* Controls Bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                        }}
                    >
                        <Tab
                            icon={<FriendsIcon />}
                            iconPosition="start"
                            label={`Amigos (${friends.length})`}
                            sx={{ fontWeight: 600 }}
                        />
                        <Tab
                            icon={<PendingIcon />}
                            iconPosition="start"
                            label={`Solicitudes (${requests.length})`}
                            sx={{ fontWeight: 600 }}
                        />
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: { md: 400 } }}>
                        <Paper
                            component="form"
                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', flexGrow: 1, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
                            elevation={0}
                        >
                            <InputBase
                                sx={{ ml: 1, flex: 1 }}
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <IconButton sx={{ p: '10px' }} aria-label="search">
                                <SearchIcon />
                            </IconButton>
                        </Paper>
                        <Tooltip title="Filtros emocionales">
                            <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {tab === 0 ? (
                            <Grid container spacing={3}>
                                {filteredFriends.length > 0 ? (
                                    filteredFriends.map((friend) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={friend.user_id}>
                                            <FriendCard friend={friend} onAction={fetchData} />
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                                            <Typography color="text.secondary">
                                                {searchQuery ? 'No se encontraron vínculos con ese nombre.' : 'Aún no tienes hilos conectados. ¡Explora y conecta!'}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        ) : (
                            <Grid container spacing={3}>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((request) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={request.user_id}>
                                            <FriendCard friend={request} onAction={fetchData} />
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                                            <Typography color="text.secondary">
                                                No hay solicitudes pendientes en este momento.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Box>
                )}
            </Container>
        </Layout>
    );
}


export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

import { Grid } from '@mui/material';
import ProfileRewards from './ProfileRewards';

interface ProfileRewardsViewProps {
    profile: any;
}

export default function ProfileRewardsView({ profile }: ProfileRewardsViewProps) {
    return (
        <Grid container spacing={4} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
            <Grid item xs={12} md={8} lg={6} sx={{ mx: 'auto' }}>
                <ProfileRewards profile={profile} />
            </Grid>
        </Grid>
    );
}

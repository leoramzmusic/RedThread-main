import {
  Home as HomeIcon,
  Event as EventIcon,
  Security as SecurityIcon,
  SupportAgent as SupportAgentIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Explore as ExploreIcon,
  Favorite as FavoriteIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  SvgIconComponent,
} from '@mui/icons-material';

const NAVBAR_ICON_MAP: Record<string, SvgIconComponent> = {
  Home: HomeIcon,
  Event: EventIcon,
  Security: SecurityIcon,
  SupportAgent: SupportAgentIcon,
  Download: DownloadIcon,
  Person: PersonIcon,
  Settings: SettingsIcon,
  Menu: MenuIcon,
  Explore: ExploreIcon,
  Favorite: FavoriteIcon,
  Chat: ChatIcon,
  Notifications: NotificationsIcon,
};

export function NavbarIcon({ name, sx }: { name: string; sx?: object }) {
  const Icon = NAVBAR_ICON_MAP[name] || MenuIcon;
  return <Icon sx={{ fontSize: 20, ...sx }} />;
}
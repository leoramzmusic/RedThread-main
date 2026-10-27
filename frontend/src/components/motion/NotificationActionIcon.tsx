import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from "@mui/icons-material";
import QuickActionIcon from "./QuickActionIcon";
import type { IconStyleId } from "./iconStyles";

export interface NotificationActionIconProps {
  styleId: IconStyleId;
  unreadCount?: number;
  panelOpen?: boolean;
  dndActive?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function NotificationActionIcon({
  styleId,
  unreadCount = 0,
  panelOpen = false,
  dndActive = false,
  onClick,
}: NotificationActionIconProps) {
  const attention = !dndActive && (panelOpen || unreadCount > 0);
  const selected = panelOpen && !attention;

  return (
    <QuickActionIcon
      styleId={styleId}
      motion="bell"
      basicHover="bell"
      active={attention}
      selected={selected}
      muted={dndActive}
      badgeContent={dndActive ? 0 : unreadCount}
      onClick={onClick}
    >
      {dndActive ? (
        <NotificationsOffIcon className="rt-bell-icon" sx={{ fontSize: 22 }} />
      ) : (
        <NotificationsIcon className="rt-bell-icon" sx={{ fontSize: 22 }} />
      )}
    </QuickActionIcon>
  );
}

import { Notifications as NotificationsIcon } from "@mui/icons-material";
import QuickActionIcon from "./QuickActionIcon";
import type { IconStyleId } from "./iconStyles";

export interface NotificationActionIconProps {
  styleId: IconStyleId;
  unreadCount?: number;
  panelOpen?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function NotificationActionIcon({
  styleId,
  unreadCount = 0,
  panelOpen = false,
  onClick,
}: NotificationActionIconProps) {
  return (
    <QuickActionIcon
      styleId={styleId}
      motion="bell"
      basicHover="bell"
      active={panelOpen || unreadCount > 0}
      badgeContent={unreadCount}
      onClick={onClick}
    >
      <NotificationsIcon className="rt-bell-icon" sx={{ fontSize: 22 }} />
    </QuickActionIcon>
  );
}

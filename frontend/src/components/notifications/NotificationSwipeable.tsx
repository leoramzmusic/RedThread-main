import React, { useRef, useState } from "react";
import { Box } from "@mui/material";
import { motionTokens } from "../../theme/liquidGlass";

const THRESHOLD = 72;

interface NotificationSwipeableProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
}

export default function NotificationSwipeable({
  children,
  onArchive,
  onDelete,
}: NotificationSwipeableProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const latestDx = useRef(0);
  const draggingRef = useRef(false);
  const locked = useRef(false);

  const reset = () => {
    latestDx.current = 0;
    draggingRef.current = false;
    locked.current = false;
    setDx(0);
    setDragging(false);
  };

  const touchStart = (event: React.TouchEvent) => {
    startX.current = event.touches[0].clientX;
    startY.current = event.touches[0].clientY;
    latestDx.current = 0;
    draggingRef.current = true;
    locked.current = false;
    setDx(0);
    setDragging(true);
  };

  const touchMove = (event: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const deltaX = event.touches[0].clientX - startX.current;
    const deltaY = event.touches[0].clientY - startY.current;
    if (locked.current || Math.abs(deltaY) > Math.abs(deltaX)) {
      locked.current = true;
      latestDx.current = 0;
      setDx(0);
      return;
    }
    latestDx.current = deltaX;
    setDx(deltaX);
  };

  const end = () => {
    const value = latestDx.current;
    reset();
    if (value >= THRESHOLD) onArchive?.();
    else if (value <= -THRESHOLD) onDelete?.();
  };

  return (
    <Box
      data-testid="notification-swipeable"
      sx={{ position: "relative", overflow: "hidden" }}
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={end}
      onTouchCancel={reset}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          color: "text.secondary",
        }}
      >
        <span aria-hidden="true">↩</span>
        <span aria-hidden="true">🗑</span>
      </Box>
      <Box
        sx={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          transition: dragging
            ? "none"
            : `transform ${motionTokens.durations.normal}ms ${motionTokens.easing}`,
          bgcolor: "background.paper",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

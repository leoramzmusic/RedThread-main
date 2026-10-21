import React, { useRef, useState } from "react";
import { Box } from "@mui/material";
import { motionTokens } from "../../theme/liquidGlass";

const THRESHOLD = 72;
const MOVE_TOLERANCE = 6;
const CAPTURE_TOLERANCE = 8;
const INTERACTIVE_TARGET_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [data-no-swipe]";

interface NotificationSwipeableProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
}

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
};

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
  const movedRef = useRef(false);
  const activePointer = useRef<number | null>(null);
  const captureEligible = useRef(false);
  const captured = useRef(false);
  const suppressClick = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const releaseCapture = () => {
    const element = containerRef.current;
    const pointerId = activePointer.current;
    if (captured.current && element && pointerId !== null) {
      try {
        element.releasePointerCapture?.(pointerId);
      } catch {
        // Capture may already be gone, or unavailable in jsdom.
      }
    }
    captured.current = false;
  };

  const reset = (keepClickSuppression = false) => {
    const wasMoved = movedRef.current;
    releaseCapture();
    latestDx.current = 0;
    draggingRef.current = false;
    locked.current = false;
    movedRef.current = false;
    activePointer.current = null;
    captureEligible.current = false;
    suppressClick.current = keepClickSuppression && wasMoved;
    setDx(0);
    setDragging(false);
  };

  const start = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    latestDx.current = 0;
    draggingRef.current = true;
    locked.current = false;
    movedRef.current = false;
    suppressClick.current = false;
    setDx(0);
    setDragging(true);
  };

  const move = (x: number, y: number) => {
    if (!draggingRef.current) return;
    const deltaX = x - startX.current;
    const deltaY = y - startY.current;
    if (
      Math.abs(deltaX) > MOVE_TOLERANCE ||
      Math.abs(deltaY) > MOVE_TOLERANCE
    ) {
      movedRef.current = true;
    }
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
    reset(true);
    if (value >= THRESHOLD) onArchive?.();
    else if (value <= -THRESHOLD) onDelete?.();
  };

  const touchStart = (event: React.TouchEvent) => {
    start(event.touches[0].clientX, event.touches[0].clientY);
  };

  const touchMove = (event: React.TouchEvent) => {
    move(event.touches[0].clientX, event.touches[0].clientY);
  };

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button > 0) return;
    activePointer.current = event.pointerId;
    captureEligible.current = !isInteractiveTarget(event.target);
    start(event.clientX, event.clientY);
  };

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (
      activePointer.current !== null &&
      event.pointerId !== activePointer.current
    ) {
      return;
    }
    if (!draggingRef.current) return;
    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;
    if (
      !captured.current &&
      captureEligible.current &&
      !locked.current &&
      Math.abs(deltaX) > CAPTURE_TOLERANCE &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      try {
        if (typeof event.currentTarget.setPointerCapture === "function") {
          event.currentTarget.setPointerCapture(event.pointerId);
          captured.current = true;
        }
      } catch {
        // Pointer capture is unavailable in some test/jsdom environments.
      }
    }
    move(event.clientX, event.clientY);
  };

  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (
      activePointer.current !== null &&
      event.pointerId !== activePointer.current
    ) {
      return;
    }
    end();
  };

  const suppressClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Box
      ref={containerRef}
      data-testid="notification-swipeable"
      sx={{
        position: "relative",
        overflow: "hidden",
        touchAction: "pan-y",
      }}
      onTouchStart={touchStart}
      onTouchMove={touchMove}
      onTouchEnd={end}
      onTouchCancel={() => reset()}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => reset()}
      onClickCapture={suppressClickAfterDrag}
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

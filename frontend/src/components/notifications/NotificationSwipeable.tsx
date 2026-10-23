import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutline from "@mui/icons-material/DeleteOutlineRounded";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import Block from "@mui/icons-material/Block";
import { motionTokens } from "../../theme/liquidGlass";

const THRESHOLD = 120;
const LONG_THRESHOLD = 240;
const EXIT_MS = 140;
const MOVE_TOLERANCE = 6;
const CAPTURE_TOLERANCE = 8;
const INTERACTIVE_TARGET_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [data-no-swipe]";

interface NotificationSwipeableProps {
  children: React.ReactNode;
  disabled?: boolean;
  allowInteractive?: boolean;
  onDismiss?: () => void;
  onDismissForever?: () => void;
  onSnooze?: (anchor: HTMLElement) => void;
}

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export default function NotificationSwipeable({
  children,
  disabled = false,
  allowInteractive = false,
  onDismiss,
  onDismissForever,
  onSnooze,
}: NotificationSwipeableProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
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
  const exitingRef = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticFired = useRef(false);
  const inputType = useRef<"mouse" | "touch" | "pen">("mouse");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

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
    hapticFired.current = false;
    exitingRef.current = false;
    suppressClick.current = keepClickSuppression && wasMoved;
    setDx(0);
    setDragging(false);
    setExiting(false);
  };

  const finish = (direction: 1 | -1, action?: () => void) => {
    if (!action) return;
    if (prefersReducedMotion() || !containerRef.current) {
      action();
      return;
    }
    exitingRef.current = true;
    setExiting(true);
    const distance = (containerRef.current.offsetWidth || 320) + 48;
    latestDx.current = direction * distance;
    setDx(direction * distance);
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null;
      reset();
      action();
    }, EXIT_MS);
  };

  const triggerHaptic = (value: number) => {
    if (
      hapticFired.current ||
      Math.abs(value) < THRESHOLD ||
      inputType.current === "mouse"
    ) {
      return;
    }
    hapticFired.current = true;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const start = (x: number, y: number, type: "mouse" | "touch" | "pen") => {
    if (disabled || exitingRef.current) return;
    inputType.current = type;
    startX.current = x;
    startY.current = y;
    latestDx.current = 0;
    draggingRef.current = true;
    locked.current = false;
    movedRef.current = false;
    hapticFired.current = false;
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
    triggerHaptic(deltaX);
  };

  const end = () => {
    if (exitingRef.current) return;
    const value = latestDx.current;
    reset(true);
    if (disabled) return;
    if (value >= LONG_THRESHOLD && onDismissForever) {
      finish(1, onDismissForever);
    } else if (value >= THRESHOLD) {
      finish(1, onDismiss);
    } else if (value <= -THRESHOLD && containerRef.current) {
      onSnooze?.(containerRef.current);
    }
  };

  const touchStart = (event: React.TouchEvent) => {
    if (!allowInteractive && isInteractiveTarget(event.target)) return;
    const touch = event.touches[0];
    if (touch) start(touch.clientX, touch.clientY, "touch");
  };

  const touchMove = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (touch) move(touch.clientX, touch.clientY);
  };

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button > 0) return;
    if (!allowInteractive && isInteractiveTarget(event.target)) {
      captureEligible.current = false;
      return;
    }
    captureEligible.current = true;
    activePointer.current = event.pointerId;
    start(
      event.clientX,
      event.clientY,
      event.pointerType === "pen" ? "pen" : "mouse",
    );
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

  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
  const longProgress = Math.min(
    Math.max((dx - THRESHOLD) / (LONG_THRESHOLD - THRESHOLD), 0),
    1,
  );
  const isRight = dx > 0;
  const isForever =
    isRight && dx >= LONG_THRESHOLD && Boolean(onDismissForever);

  return (
    <Box
      ref={containerRef}
      data-testid="notification-swipeable"
      data-direction={dx > 0 ? "right" : dx < 0 ? "left" : "idle"}
      data-progress={progress.toFixed(2)}
      data-armed={progress >= 1}
      data-forever={isForever}
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
          bgcolor: (theme) =>
            alpha(
              isRight
                ? isForever
                  ? theme.palette.error.dark
                  : theme.palette.error.main
                : theme.palette.info.main,
              0.12 + 0.78 * progress,
            ),
          transition: exiting
            ? `background-color ${EXIT_MS}ms ${motionTokens.easing}`
            : `background-color ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      >
        <Box sx={{ position: "relative", width: 32, height: 32 }}>
          <DeleteOutline
            data-testid="notification-swipe-dismiss"
            sx={{
              position: "absolute",
              inset: 0,
              color: "common.white",
              opacity: isRight ? progress * (1 - longProgress) : 0,
              transform: `scale(${0.8 + 0.4 * progress})`,
            }}
          />
          <Block
            data-testid="notification-swipe-forever"
            sx={{
              position: "absolute",
              inset: 0,
              color: "common.white",
              opacity: isRight ? longProgress : 0,
              transform: `scale(${0.8 + 0.4 * longProgress})`,
            }}
          />
        </Box>
        <ScheduleOutlined
          data-testid="notification-swipe-snooze"
          sx={{
            color: "common.white",
            opacity: isRight ? 0 : progress,
            transform: `scale(${0.8 + 0.4 * progress})`,
          }}
        />
      </Box>
      <Box
        sx={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          transition: exiting
            ? `transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1)`
            : dragging
              ? "none"
              : `transform ${motionTokens.durations.normal}ms ${motionTokens.easing}`,
          bgcolor: "background.paper",
          userSelect: dragging ? "none" : undefined,
          willChange: dragging || exiting ? "transform" : undefined,
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
